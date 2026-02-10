<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\StoreInvoiceRequest;
use App\Http\Requests\API\V1\UpdateInvoiceRequest;
use App\Http\Requests\API\V1\CreateFromProformaRequest;
use App\Http\Requests\API\V1\CreateFromContractRequest;
use App\Http\Resources\API\V1\InvoiceResource;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Contract;
use App\Models\Currency;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Invoice;
use App\Models\Proforma;
use App\Services\DocumentConversionService;
use App\Services\DocumentNumberService;
use App\Services\InvoicePdfService;
use Carbon\Carbon;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

#[Group('Invoices', weight: 5)]
class InvoiceController extends Controller
{
    public function __construct(
        private DocumentNumberService $numberService,
        private DocumentConversionService $conversionService,
        private InvoicePdfService $pdfService
    ) {
    }

    #[Endpoint(operationId: 'getInvoices', title: 'Get invoices', description: 'Get all invoices')]
    public function index(Request $request, Company $company): AnonymousResourceCollection
    {
        $query = $company->invoices()
            ->with(['items', 'source', 'client', 'fiscalRecords', 'currencyRelation', 'bankAccount', 'refundInvoice', 'originalInvoice'])
            ->latest();

        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', '%' . $search . '%')
                    ->orWhereHas('client', function ($clientQuery) use ($search) {
                        $clientQuery->where('name', 'like', '%' . $search . '%');
                    });
            });
        }

        $status = $request->query('status');
        if ($status) {
            $query->where('status', $status);
        }

        $paymentType = $request->query('payment_type');
        if ($paymentType) {
            $query->where('payment_type', $paymentType);
        }

        $createdFrom = $request->query('created_from');
        if ($createdFrom) {
            try {
                $from = Carbon::parse($createdFrom)->startOfDay();
                $query->where('created_at', '>=', $from);
            } catch (\Throwable $e) {
            }
        }

        $createdTo = $request->query('created_to');
        if ($createdTo) {
            try {
                $to = Carbon::parse($createdTo)->endOfDay();
                $query->where('created_at', '<=', $to);
            } catch (\Throwable $e) {
            }
        }

        return InvoiceResource::collection($query->paginate(20));
    }

    #[Endpoint(operationId: 'storeInvoice', title: 'Store invoice', description: 'Create a new invoice')]
    public function store(StoreInvoiceRequest $request, Company $company): InvoiceResource
    {
        $data = $request->validated();

        // Extract items before creating invoice
        $items = $data['items'] ?? [];
        unset($data['items']);

        // Resolve currency_id from required currency (must exist for this company)
        $currency = Currency::where('company_id', $company->id)->where('code', $data['currency'])->first();
        if (! $currency) {
            abort(422, 'Valuta nije pronađena za ovu kompaniju.');
        }
        $data['currency_id'] = $currency->id;

        // Reserve invoice number if not provided
        if (empty($data['invoice_number'])) {
            $numberData = $this->numberService->reserveNumber($company, 'invoice');
            $data['invoice_number'] = $numberData['formatted'];
        }

        $data['status'] = $data['status'] ?? DocumentStatusEnum::Created->value;

        $invoice = $company->invoices()->create($data);

        foreach ($items as $itemData) {
            if (empty($itemData['tax_label']) && ! empty($itemData['article_id'])) {
                $article = \App\Models\Article::find($itemData['article_id']);
                if ($article?->tax_rate) {
                    $itemData['tax_label'] = $article->tax_rate;
                }
            }
            $itemData['tax_label'] = $itemData['tax_label'] ?? 'A';
            $invoice->items()->create($itemData);
        }

        return new InvoiceResource($invoice->load(['items', 'fiscalRecords', 'currencyRelation', 'bankAccount']));
    }

    #[Endpoint(operationId: 'showInvoice', title: 'Show invoice', description: 'Get invoice')]
    public function show(Company $company, Invoice $invoice): InvoiceResource
    {
        return new InvoiceResource($invoice->load(['client', 'items', 'source', 'parent', 'children', 'fiscalRecords', 'currencyRelation', 'bankAccount', 'refundInvoice', 'originalInvoice']));
    }

    #[Endpoint(operationId: 'downloadInvoicePdf', title: 'Download invoice PDF', description: 'Export invoice as PDF')]
    public function downloadPdf(Company $company, Invoice $invoice): Response
    {
        return $this->pdfService->download($invoice)->toResponse(request());
    }

    #[Endpoint(operationId: 'sendInvoiceEmail', title: 'Send invoice email', description: 'Send invoice and fiscal receipt via email')]
    public function sendEmail(\App\Http\Requests\API\V1\SendInvoiceEmailRequest $request, Company $company, Invoice $invoice): JsonResponse
    {
        $invoice->load(['client', 'company', 'fiscalRecords']);
        $verificationUrl = $invoice->fiscal_verification_url;

        $pdfPath = null;
        if ($request->boolean('attach_pdf')) {
            $pdfPath = storage_path('app/private/temp-' . Str::random(16) . '.pdf');
            $this->pdfService->save($invoice, $pdfPath);
        }

        // From: CompanySetting ako je podešeno, inače default iz .env
        $fromAddress = CompanySetting::get('mail_from_address', null, $company->id)
            ?: config('mail.from.address');
        $fromName = CompanySetting::get('mail_from_name', null, $company->id)
            ?: config('mail.from.name');

        // Ako je mail_host podešeno, koristi custom SMTP mailer
        $mailHost = CompanySetting::get('mail_host', null, $company->id);
        $mailer = null;
        if ($mailHost) {
            $mailerName = 'company_smtp_' . $company->id;
            config([
                'mail.mailers.' . $mailerName => [
                    'transport' => 'smtp',
                    'host' => $mailHost,
                    'port' => (int) (CompanySetting::get('mail_port', 587, $company->id) ?: 587),
                    'encryption' => CompanySetting::get('mail_encryption', null, $company->id) ?: null,
                    'username' => CompanySetting::get('mail_username', null, $company->id) ?: null,
                    'password' => CompanySetting::get('mail_password', null, $company->id) ?: null,
                    'timeout' => null,
                ],
            ]);
            $mailer = Mail::mailer($mailerName);
        }

        $attachFiscalRecordIds = collect($request->validated('attach_fiscal_record_ids') ?? [])
            ->filter(fn ($id) => $invoice->fiscalRecords->contains('id', $id))
            ->values()
            ->all();

        try {
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

            if ($mailer) {
                $mailer->to($request->validated('to'))->send($mailable);
            } else {
                Mail::to($request->validated('to'))->send($mailable);
            }

            return response()->json([
                'success' => true,
                'message' => 'Faktura uspješno poslata na email.',
            ]);
        } finally {
            if ($pdfPath && file_exists($pdfPath)) {
                @unlink($pdfPath);
            }
        }
    }

    #[Endpoint(operationId: 'updateInvoice', title: 'Update invoice', description: 'Update invoice')]
    public function update(UpdateInvoiceRequest $request, Company $company, Invoice $invoice): InvoiceResource
    {
        $data = $request->validated();
        $items = $data['items'] ?? null;
        unset($data['items']);

        if (isset($data['client_id']) && $data['client_id'] == 0) {
            $data['client_id'] = null;
        }

        if (isset($data['currency'])) {
            $currency = Currency::where('company_id', $company->id)->where('code', $data['currency'])->first();
            $data['currency_id'] = $currency?->id;
        }

        $invoice->update($data);

        if ($items !== null) {
            $invoice->items()->delete();
            foreach ($items as $itemData) {
                if (empty($itemData['tax_label']) && ! empty($itemData['article_id'])) {
                    $article = \App\Models\Article::find($itemData['article_id']);
                    if ($article?->tax_rate) {
                        $itemData['tax_label'] = $article->tax_rate;
                    }
                }
                $itemData['tax_label'] = $itemData['tax_label'] ?? 'A';
                $invoice->items()->create($itemData);
            }
        }

        return new InvoiceResource($invoice->load(['items', 'fiscalRecords', 'currencyRelation', 'bankAccount', 'refundInvoice', 'originalInvoice']));
    }

    #[Endpoint(operationId: 'destroyInvoice', title: 'Destroy invoice', description: 'Remove invoice')]
    public function destroy(Company $company, Invoice $invoice): JsonResponse
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
        $invoice->delete();
        return response()->json(['message' => 'Invoice deleted successfully']);
    }

    #[Endpoint(operationId: 'createInvoiceFromProforma', title: 'Create invoice from proforma', description: 'Create invoice from proforma')]
    public function createFromProforma(CreateFromProformaRequest $request, Company $company, Proforma $proforma): InvoiceResource
    {
        $proforma->load(['items.article']);
        $invoice = $this->conversionService->convertProformaToInvoice($proforma);

        // Reserve invoice number
        $numberData = $this->numberService->reserveNumber($company, 'invoice');
        $invoice->invoice_number = $numberData['formatted'];
        $invoice->save();

        return new InvoiceResource($invoice->load(['items', 'fiscalRecords', 'currencyRelation', 'bankAccount', 'refundInvoice', 'originalInvoice']));
    }

    #[Endpoint(operationId: 'createInvoiceFromContract', title: 'Create invoice from contract', description: 'Create invoice from contract')]
    public function createFromContract(CreateFromContractRequest $request, Company $company, Contract $contract): InvoiceResource
    {
        $contract->load(['items.article']);
        $invoice = $this->conversionService->convertContractToInvoice($contract);

        // Reserve invoice number
        $numberData = $this->numberService->reserveNumber($company, 'invoice');
        $invoice->invoice_number = $numberData['formatted'];
        $invoice->save();

        return new InvoiceResource($invoice->load(['items', 'fiscalRecords', 'currencyRelation', 'bankAccount']));
    }

    #[Endpoint(operationId: 'createRefundInvoice', title: 'Create refund invoice', description: 'Create refund/storno invoice from original')]
    public function createRefund(Company $company, Invoice $invoice): InvoiceResource|JsonResponse
    {
        if ($invoice->status === DocumentStatusEnum::RefundCreated || $invoice->status === DocumentStatusEnum::Refunded) {
            return response()->json([
                'success' => false,
                'message' => 'Storno fakturu nije moguće kreirati iz storno računa.',
            ], 422);
        }

        if (! $invoice->originalFiscalRecord()?->fiscal_invoice_number) {
            return response()->json([
                'success' => false,
                'message' => 'Račun mora biti fiskalizovan prije kreiranja storno fakture.',
            ], 422);
        }

        if ($invoice->refund_invoice_id) {
            return response()->json([
                'success' => false,
                'message' => 'Storno faktura je već kreirana.',
            ], 422);
        }

        $invoice->load(['items']);

        $refundInvoice = Invoice::create([
            'invoice_number' => '',
            'company_id' => $invoice->company_id,
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
            'currency' => $invoice->currency,
            'currency_id' => $invoice->currency_id,
            'bank_account_id' => $invoice->bank_account_id,
            'invoice_template' => $invoice->invoice_template,
            'payment_type' => $invoice->payment_type,
            'subtotal' => abs($invoice->subtotal),
            'tax_total' => abs($invoice->tax_total),
            'discount_total' => abs($invoice->discount_total),
            'total' => abs($invoice->total),
        ]);

        $numberData = $this->numberService->reserveNumber($company, 'invoice');
        $refundInvoice->invoice_number = $numberData['formatted'];
        $refundInvoice->save();

        foreach ($invoice->items as $item) {
            $refundInvoice->items()->create([
                'article_id' => $item->article_id,
                'name' => $item->name,
                'description' => $item->description,
                'quantity' => $item->quantity,
                'unit_price' => abs($item->unit_price),
                'subtotal' => abs($item->subtotal),
                'tax_rate' => $item->tax_rate,
                'tax_label' => $item->tax_label ?? 'A',
                'tax_amount' => abs($item->tax_amount),
                'total' => abs($item->total),
            ]);
        }

        $invoice->update(['refund_invoice_id' => $refundInvoice->id]);

        return new InvoiceResource($refundInvoice->load(['items', 'fiscalRecords', 'currencyRelation', 'bankAccount', 'originalInvoice']));
    }

}
