<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\StoreInvoiceRequest;
use App\Http\Requests\API\V1\UpdateInvoiceRequest;
use App\Http\Requests\API\V1\CreateFromProformaRequest;
use App\Http\Requests\API\V1\CreateFromContractRequest;
use App\Http\Resources\API\V1\InvoiceResource;
use App\Models\BankAccount;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Contract;
use App\Models\Currency;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\DocumentTypeEnum;
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
    public function index(Company $company): AnonymousResourceCollection
    {
        return InvoiceResource::collection(
            $company->invoices()
                ->with(['items', 'source', 'client', 'fiscalRecords', 'currencyRelation', 'bankAccount'])
                ->latest()
                ->paginate(20)
        );
    }

    #[Endpoint(operationId: 'storeInvoice', title: 'Store invoice', description: 'Create a new invoice')]
    public function store(StoreInvoiceRequest $request, Company $company): InvoiceResource
    {
        $data = $request->validated();

        // Extract items before creating invoice
        $items = $data['items'] ?? [];
        unset($data['items']);

        // Apply invoice defaults from CompanySettings
        $data = $this->applyInvoiceDefaults($company, $data);

        // Resolve currency_id from currency (string) or default
        if (empty($data['currency_id']) && ! empty($data['currency'])) {
            $currency = Currency::where('company_id', $company->id)->where('code', $data['currency'])->first();
            $data['currency_id'] = $currency?->id;
        }
        if (empty($data['currency_id'])) {
            $defaultCode = CompanySetting::get('default_invoice_currency', 'BAM', $company->id);
            $currency = Currency::where('company_id', $company->id)->where('code', $defaultCode)->first();
            $data['currency_id'] = $currency?->id;
        }
        if (empty($data['currency_id'])) {
            $data['currency'] = $data['currency'] ?? CompanySetting::get('default_invoice_currency', 'BAM', $company->id);
        } else {
            $currency = Currency::find($data['currency_id']);
            $data['currency'] = $currency?->code ?? $data['currency'] ?? 'BAM';
        }

        // Resolve bank_account_id from BankAccount.is_default when not provided
        if (empty($data['bank_account_id'])) {
            $defaultBank = BankAccount::where('company_id', $company->id)->where('is_default', true)->first();
            $data['bank_account_id'] = $defaultBank?->id;
        }

        // Reserve invoice number if not provided
        if (empty($data['invoice_number'])) {
            $numberData = $this->numberService->reserveNumber($company, 'invoice');
            $data['invoice_number'] = $numberData['formatted'];
        }

        // New invoices default to open (not fiscalized)
        $data['status'] = $data['status'] ?? DocumentStatusEnum::Created->value;

        $invoice = $company->invoices()->create($data);

        foreach ($items as $itemData) {
            $itemData = $this->ensureItemTaxLabel($itemData);
            $invoice->items()->create($itemData);
        }

        return new InvoiceResource($invoice->load(['items', 'fiscalRecords', 'currencyRelation', 'bankAccount']));
    }

    #[Endpoint(operationId: 'showInvoice', title: 'Show invoice', description: 'Get invoice')]
    public function show(Company $company, Invoice $invoice): InvoiceResource
    {
        return new InvoiceResource($invoice->load(['client', 'items', 'source', 'parent', 'children', 'fiscalRecords', 'currencyRelation', 'bankAccount']));
    }

    #[Endpoint(operationId: 'downloadInvoicePdf', title: 'Download invoice PDF', description: 'Export invoice as PDF')]
    public function downloadPdf(Company $company, Invoice $invoice): Response
    {
        abort_if($invoice->company_id !== $company->id, 404);

        return $this->pdfService->download($invoice)->toResponse(request());
    }

    #[Endpoint(operationId: 'sendInvoiceEmail', title: 'Send invoice email', description: 'Send invoice and fiscal receipt via email')]
    public function sendEmail(\App\Http\Requests\API\V1\SendInvoiceEmailRequest $request, Company $company, Invoice $invoice): JsonResponse
    {
        abort_if($invoice->company_id !== $company->id, 404);

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

        $invoice->update($data);

        if ($items !== null) {
            $invoice->items()->delete();
            foreach ($items as $itemData) {
                $itemData = $this->ensureItemTaxLabel($itemData);
                $invoice->items()->create($itemData);
            }
        }

        return new InvoiceResource($invoice->load(['items', 'fiscalRecords', 'currencyRelation', 'bankAccount']));
    }

    #[Endpoint(operationId: 'destroyInvoice', title: 'Destroy invoice', description: 'Remove invoice')]
    public function destroy(Company $company, Invoice $invoice): JsonResponse
    {
        $invoice->delete();
        return response()->json(['message' => 'Invoice deleted successfully']);
    }

    private function applyInvoiceDefaults(Company $company, array $data): array
    {
        $defaults = [
            'invoice_template' => CompanySetting::get('default_invoice_template', 'classic', $company->id),
            'language' => CompanySetting::get('default_invoice_language', 'sr-Latn', $company->id),
        ];

        $dueDays = (int) CompanySetting::get('default_invoice_due_days', 14, $company->id);
        $date = isset($data['date']) ? Carbon::parse($data['date']) : now();
        $defaults['due_date'] = $date->copy()->addDays($dueDays)->format('Y-m-d');

        // Notes: default_invoice_notes iz podešavanja
        if (empty($data['notes'])) {
            $defaults['notes'] = (string) CompanySetting::get('default_invoice_notes', '', $company->id);
        }

        foreach ($defaults as $key => $value) {
            if (! isset($data[$key]) || $data[$key] === '' || $data[$key] === null) {
                $data[$key] = $value;
            }
        }

        return $data;
    }

    private function ensureItemTaxLabel(array $itemData): array
    {
        if (empty($itemData['tax_label']) && ! empty($itemData['article_id'])) {
            $article = \App\Models\Article::find($itemData['article_id']);
            if ($article?->tax_rate) {
                $itemData['tax_label'] = $article->tax_rate;
            }
        }
        $itemData['tax_label'] ??= 'A';

        return $itemData;
    }

    #[Endpoint(operationId: 'createInvoiceFromProforma', title: 'Create invoice from proforma', description: 'Create invoice from proforma')]
    public function createFromProforma(CreateFromProformaRequest $request, Company $company, Proforma $proforma): InvoiceResource
    {
        abort_if($proforma->company_id !== $company->id, 404);

        $proforma->load(['items.article']);
        $invoice = $this->conversionService->convertProformaToInvoice($proforma);

        // Reserve invoice number
        $numberData = $this->numberService->reserveNumber($company, 'invoice');
        $invoice->invoice_number = $numberData['formatted'];
        $invoice->save();

        return new InvoiceResource($invoice->load(['items', 'fiscalRecords', 'currencyRelation', 'bankAccount']));
    }

    #[Endpoint(operationId: 'createInvoiceFromContract', title: 'Create invoice from contract', description: 'Create invoice from contract')]
    public function createFromContract(CreateFromContractRequest $request, Company $company, Contract $contract): InvoiceResource
    {
        abort_if($contract->company_id !== $company->id, 404);

        $contract->load(['items.article']);
        $invoice = $this->conversionService->convertContractToInvoice($contract);

        // Reserve invoice number
        $numberData = $this->numberService->reserveNumber($company, 'invoice');
        $invoice->invoice_number = $numberData['formatted'];
        $invoice->save();

        return new InvoiceResource($invoice->load(['items', 'fiscalRecords', 'currencyRelation', 'bankAccount']));
    }

}
