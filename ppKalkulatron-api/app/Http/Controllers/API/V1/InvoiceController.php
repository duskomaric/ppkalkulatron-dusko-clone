<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\IndexInvoiceRequest;
use App\Http\Requests\API\V1\SendInvoiceEmailRequest;
use App\Http\Requests\API\V1\StoreInvoiceRequest;
use App\Http\Requests\API\V1\UpdateInvoiceRequest;
use App\Http\Requests\API\V1\StoreRefundInvoiceRequest;
use App\Http\Requests\API\V1\CreateFromProformaRequest;
use App\Http\Requests\API\V1\CreateFromContractRequest;
use App\Http\Resources\API\V1\InvoiceResource;
use App\Models\Company;
use App\Models\Contract;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Invoice;
use App\Models\Proforma;
use App\Exceptions\NoExchangeRateForDateException;
use App\Models\Article;
use App\Services\CompanyMailService;
use App\Services\CurrencyConversionService;
use App\Services\DocumentConversionService;
use App\Services\DocumentNumberService;
use App\Services\InvoicePdfService;
use Carbon\Carbon;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Invoices', weight: 5)]
class InvoiceController extends Controller
{
    #[Endpoint(operationId: 'getInvoices', title: 'Get invoices', description: 'Get all invoices')]
    public function index(IndexInvoiceRequest $request, Company $company): AnonymousResourceCollection
    {
        $query = $company->invoices()
            ->with(['source', 'client', 'fiscalRecords', 'currency', 'refundInvoice', 'originalInvoice'])
            ->latest();

        $dateRange = null;
        if ($request->filled('date_from') || $request->filled('date_to')) {
            $from = $request->filled('date_from')
                ? Carbon::parse($request->date_from)->toDateString()
                : Carbon::parse($request->date_to)->toDateString();
            $to = $request->filled('date_to')
                ? Carbon::parse($request->date_to)->toDateString()
                : $from;
            $dateRange = ['from' => $from, 'to' => $to];
        } elseif ($request->filled('year')) {
            $y = (int) $request->year;
            $dateRange = ['from' => "{$y}-01-01", 'to' => "{$y}-12-31"];
        }

        $query
            ->when($request->validated('search'), function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('invoice_number', 'like', '%' . $search . '%')
                        ->orWhereHas('client', function ($clientQuery) use ($search) {
                            $clientQuery->where('name', 'like', '%' . $search . '%');
                        });
                });
            })
            ->when($request->validated('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->validated('payment_type'), fn ($q, $paymentType) => $q->where('payment_type', $paymentType))
            ->when($request->validated('created_from'), function ($q, $createdFrom) {
                $from = Carbon::parse($createdFrom)->startOfDay();
                $q->where('created_at', '>=', $from);
            })
            ->when($request->validated('created_to'), function ($q, $createdTo) {
                $to = Carbon::parse($createdTo)->endOfDay();
                $q->where('created_at', '<=', $to);
            })
            ->when($dateRange, function ($q, $range) {
                $q->whereBetween('date', [$range['from'], $range['to']]);
            });

        return InvoiceResource::collection($query->paginate(20));
    }

    #[Endpoint(operationId: 'storeInvoice', title: 'Store invoice', description: 'Create a new invoice')]
    public function store(StoreInvoiceRequest $request, Company $company, DocumentNumberService $numberService, CurrencyConversionService $conversionService): InvoiceResource|JsonResponse
    {
        $year = DocumentNumberService::yearFromDate($request->validated('date'));

        $invoice = $company->invoices()->create(
            $request->safe()
                ->merge([
                    'invoice_number' => $request->validated('invoice_number')
                        ?: $numberService->reserveNumber($company, 'invoice', $year)['formatted'],
                ])
                ->except('items')
        );

        $items = $request->validated('items') ?? [];
        $invoice->items()->createMany($items);

        try {
            $conversionService->fillInvoiceBam($invoice);
        } catch (NoExchangeRateForDateException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $this->updateArticleLastPricesFromInvoice($invoice);

        return new InvoiceResource($invoice->load(['items', 'fiscalRecords', 'currency']));
    }

    #[Endpoint(operationId: 'showInvoice', title: 'Show invoice', description: 'Get invoice')]
    public function show(Company $company, Invoice $invoice): InvoiceResource
    {
        return new InvoiceResource($invoice->load(['client', 'items', 'source', 'parent', 'children', 'fiscalRecords', 'currency', 'refundInvoice', 'originalInvoice']));
    }

    #[Endpoint(operationId: 'downloadInvoicePdf', title: 'Download invoice PDF', description: 'Export invoice as PDF')]
    public function downloadPdf(Company $company, Invoice $invoice, InvoicePdfService $pdfService): Response
    {
        $invoice->loadMissing(['items.article']);

        return $pdfService->download($invoice)->toResponse(request());
    }

    #[Endpoint(operationId: 'sendInvoiceEmail', title: 'Send invoice email', description: 'Send invoice and fiscal receipt via email')]
    public function sendEmail(SendInvoiceEmailRequest $request, Company $company, Invoice $invoice, CompanyMailService $mailService, InvoicePdfService $pdfService): JsonResponse
    {
        $invoice->load(['client', 'company', 'fiscalRecords']);
        $verificationUrl = $invoice->fiscal_verification_url;

        $attachFiscalRecordIds = collect($request->validated('attach_fiscal_record_ids') ?? [])
            ->filter(fn ($id) => $invoice->fiscalRecords->contains('id', $id))
            ->values()
            ->all();

        $pdfPath = null;
        if ($request->boolean('attach_pdf')) {
            $pdfPath = $mailService->createTempPdfPath();
            $pdfService->save($invoice, $pdfPath);
        }

        try {
            [$fromAddress, $fromName] = $mailService->resolveFrom($company);

            $mailable = new \App\Mail\InvoiceMail(
                invoice: $invoice,
                emailSubject: $request->validated('subject'),
                body: $request->validated('body'),
                verificationUrl: $verificationUrl,
                pdfPath: $pdfPath,
                attachFiscalRecordIds: $attachFiscalRecordIds,
                fromAddress: $fromAddress,
                fromName: $fromName,
            );

            $mailService->send($company, $request->validated('to'), $mailable);

            return response()->json([
                'success' => true,
                'message' => 'Faktura uspješno poslata na email.',
            ]);
        } finally {
            $mailService->cleanupTempFile($pdfPath);
        }
    }

    #[Endpoint(operationId: 'updateInvoice', title: 'Update invoice', description: 'Update invoice')]
    public function update(UpdateInvoiceRequest $request, Company $company, Invoice $invoice, CurrencyConversionService $conversionService): InvoiceResource|JsonResponse
    {
        $invoice->update($request->safe()->except('items'));

        if ($request->has('items')) {
            $invoice->items()->delete();
            $invoice->items()->createMany($request->validated('items') ?? []);
        }

        try {
            $conversionService->fillInvoiceBam($invoice);
        } catch (NoExchangeRateForDateException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $this->updateArticleLastPricesFromInvoice($invoice);

        return new InvoiceResource($invoice->load(['items', 'fiscalRecords', 'currency', 'refundInvoice', 'originalInvoice']));
    }

    #[Endpoint(operationId: 'destroyInvoice', title: 'Destroy invoice', description: 'Remove invoice')]
    public function destroy(Company $company, Invoice $invoice, DocumentNumberService $numberService): JsonResponse
    {
        if (! in_array($invoice->status, [DocumentStatusEnum::Created, DocumentStatusEnum::RefundCreated], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Moguće je obrisati samo račune sa statusom Kreiran ili Storno kreiran.',
            ], 422);
        }
        if ($invoice->status === DocumentStatusEnum::RefundCreated) {
            $invoice->originalInvoice()->update(['refund_invoice_id' => null]);
        }

        $numberService->releaseNumber($company, 'invoice', $invoice->invoice_number);
        $invoice->delete();

        return response()->json(['message' => 'Invoice deleted successfully']);
    }

    #[Endpoint(operationId: 'createInvoiceFromProforma', title: 'Create invoice from proforma', description: 'Create invoice from proforma')]
    public function createFromProforma(CreateFromProformaRequest $request, Company $company, Proforma $proforma, DocumentConversionService $conversionService, DocumentNumberService $numberService, CurrencyConversionService $currencyConversionService): InvoiceResource|JsonResponse
    {
        $proforma->load(['items.article']);
        $invoice = $conversionService->convertProformaToInvoice($proforma);

        $year = DocumentNumberService::yearFromDate($invoice->date);
        $numberData = $numberService->reserveNumber($company, 'invoice', $year);
        $invoice->invoice_number = $numberData['formatted'];
        $invoice->save();

        try {
            $currencyConversionService->fillInvoiceBam($invoice);
        } catch (NoExchangeRateForDateException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $this->updateArticleLastPricesFromInvoice($invoice);

        return new InvoiceResource($invoice->load(['items', 'fiscalRecords', 'currency', 'refundInvoice', 'originalInvoice']));
    }

    #[Endpoint(operationId: 'createInvoiceFromContract', title: 'Create invoice from contract', description: 'Create invoice from contract')]
    public function createFromContract(CreateFromContractRequest $request, Company $company, Contract $contract, DocumentConversionService $conversionService, DocumentNumberService $numberService, CurrencyConversionService $currencyConversionService): InvoiceResource|JsonResponse
    {
        $contract->load(['items.article']);
        $invoice = $conversionService->convertContractToInvoice($contract);

        $year = DocumentNumberService::yearFromDate($invoice->date);
        $numberData = $numberService->reserveNumber($company, 'invoice', $year);
        $invoice->invoice_number = $numberData['formatted'];
        $invoice->save();

        try {
            $currencyConversionService->fillInvoiceBam($invoice);
        } catch (NoExchangeRateForDateException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        $this->updateArticleLastPricesFromInvoice($invoice);

        return new InvoiceResource($invoice->load(['items', 'fiscalRecords', 'currency']));
    }

    #[Endpoint(operationId: 'createRefundInvoice', title: 'Create refund invoice', description: 'Create refund/storno invoice from original')]
    public function createRefund(StoreRefundInvoiceRequest $request, Company $company, Invoice $invoice, DocumentNumberService $numberService): InvoiceResource|JsonResponse
    {
        $invoice->load(['items']);

        $year = DocumentNumberService::yearFromDate($invoice->date);
        $numberData = $numberService->reserveNumber($company, 'invoice', $year);
        $refundInvoice = $company->invoices()->create([
            'invoice_number' => $numberData['formatted'],
            'client_id' => $invoice->client_id,
            'status' => DocumentStatusEnum::RefundCreated,
            'language' => $invoice->language,
            'date' => $invoice->date,
            'due_date' => $invoice->due_date,
            'notes' => $invoice->notes,
            'is_recurring' => false,
            'frequency' => null,
            'next_invoice_date' => null,
            'parent_id' => null,
            'currency_id' => $invoice->currency_id,
            'invoice_template' => $invoice->invoice_template,
            'payment_type' => $invoice->payment_type,
            'subtotal' => abs($invoice->subtotal),
            'tax_total' => abs($invoice->tax_total),
            'discount_total' => abs($invoice->discount_total),
            'total' => abs($invoice->total),
        ]);

        $refundInvoice->items()->createMany(
            $invoice->items->map(fn ($item) => [
                'article_id' => $item->article_id,
                'name' => $item->name,
                'description' => $item->description,
                'quantity' => $item->quantity,
                'unit_price' => abs($item->unit_price),
                'subtotal' => abs($item->subtotal),
                'tax_rate' => $item->tax_rate,
                'tax_label' => $item->tax_label,
                'tax_amount' => abs($item->tax_amount),
                'total' => abs($item->total),
            ])->all()
        );

        $invoice->update(['refund_invoice_id' => $refundInvoice->id]);

        try {
            app(CurrencyConversionService::class)->fillInvoiceBam($refundInvoice);
        } catch (NoExchangeRateForDateException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return new InvoiceResource($refundInvoice->load(['items', 'fiscalRecords', 'currency', 'originalInvoice']));
    }

    protected function updateArticleLastPricesFromInvoice(Invoice $invoice): void
    {
        $invoice->loadMissing('items');
        foreach ($invoice->items as $item) {
            if ($item->article_id) {
                Article::where('id', $item->article_id)->update([
                    'last_unit_price' => $item->unit_price,
                    'last_currency_id' => $invoice->currency_id,
                ]);
            }
        }
    }
}
