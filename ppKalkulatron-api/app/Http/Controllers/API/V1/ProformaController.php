<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\StoreProformaRequest;
use App\Http\Requests\API\V1\UpdateProformaRequest;
use App\Http\Requests\API\V1\CreateFromQuoteRequest;
use App\Http\Requests\API\V1\SendProformaEmailRequest;
use App\Http\Resources\API\V1\ProformaResource;
use App\Http\Resources\API\V1\InvoiceResource;
use App\Mail\ProformaMail;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Currency;
use App\Models\Proforma;
use App\Models\Quote;
use App\Services\DocumentConversionService;
use App\Services\DocumentNumberService;
use App\Services\ProformaPdfService;
use Carbon\Carbon;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

#[Group('Proformas', weight: 6)]
class ProformaController extends Controller
{
    public function __construct(
        private DocumentNumberService $numberService,
        private DocumentConversionService $conversionService,
        private ProformaPdfService $pdfService
    ) {
    }

    #[Endpoint(operationId: 'getProformas', title: 'Get proformas', description: 'Get all proformas')]
    public function index(Request $request, Company $company): AnonymousResourceCollection
    {
        $query = $company->proformas()
            ->with(['items', 'client', 'source', 'bankAccount', 'currency'])
            ->latest();

        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('proforma_number', 'like', '%' . $search . '%')
                    ->orWhereHas('client', function ($clientQuery) use ($search) {
                        $clientQuery->where('name', 'like', '%' . $search . '%');
                    });
            });
        }

        $status = $request->query('status');
        if ($status) {
            $query->where('status', $status);
        }

        $dateFrom = $request->query('date_from');
        if ($dateFrom) {
            try {
                $from = Carbon::parse($dateFrom)->toDateString();
                $query->whereDate('date', '>=', $from);
            } catch (\Throwable $e) {
            }
        }

        $dateTo = $request->query('date_to');
        if ($dateTo) {
            try {
                $to = Carbon::parse($dateTo)->toDateString();
                $query->whereDate('date', '<=', $to);
            } catch (\Throwable $e) {
            }
        }

        return ProformaResource::collection($query->paginate(20));
    }

    #[Endpoint(operationId: 'storeProforma', title: 'Store proforma', description: 'Create a new proforma')]
    public function store(StoreProformaRequest $request, Company $company): ProformaResource
    {
        $data = $request->validated();

        $items = $data['items'] ?? [];
        unset($data['items']);

        // Resolve currency_id - use provided currency_id or default currency
        if (!isset($data['currency_id'])) {
            // Use default currency
            $currency = Currency::where('company_id', $company->id)->where('is_default', true)->first();
            if (!$currency) {
                $currency = $company->currencies()->first();
            }
            if (!$currency) {
                return response()->json(['message' => 'Nema konfigurisane valute za ovu kompaniju.'], 422);
            }
            $data['currency_id'] = $currency->id;
        } else {
            // Validate currency_id belongs to company
            $currency = Currency::where('company_id', $company->id)->where('id', $data['currency_id'])->first();
            if (!$currency) {
                return response()->json(['message' => 'Currency not found'], 422);
            }
        }

        // Reserve proforma number if not provided
        if (empty($data['proforma_number'])) {
            $numberData = $this->numberService->reserveNumber($company, 'proforma');
            $data['proforma_number'] = $numberData['formatted'];
        }

        $proforma = $company->proformas()->create($data);

        foreach ($items as $itemData) {
            $proforma->items()->create($itemData);
        }

        return new ProformaResource($proforma->load(['items', 'client', 'source', 'bankAccount', 'currency']));
    }

    #[Endpoint(operationId: 'showProforma', title: 'Show proforma', description: 'Get proforma')]
    public function show(Company $company, Proforma $proforma): ProformaResource
    {
        return new ProformaResource($proforma->load(['items', 'client', 'source', 'bankAccount', 'currency']));
    }

    #[Endpoint(operationId: 'downloadProformaPdf', title: 'Download proforma PDF', description: 'Export proforma as PDF')]
    public function downloadPdf(Company $company, Proforma $proforma): Response
    {
        return $this->pdfService->download($proforma)->toResponse(request());
    }

    #[Endpoint(operationId: 'sendProformaEmail', title: 'Send proforma email', description: 'Send proforma via email')]
    public function sendEmail(SendProformaEmailRequest $request, Company $company, Proforma $proforma): JsonResponse
    {
        $proforma->load(['client', 'company']);

        $pdfPath = null;
        if ($request->boolean('attach_pdf')) {
            $pdfPath = storage_path('app/private/temp-' . Str::random(16) . '.pdf');
            $this->pdfService->save($proforma, $pdfPath);
        }

        $fromAddress = CompanySetting::get('mail_from_address', null, $company->id) ?: config('mail.from.address');
        $fromName = CompanySetting::get('mail_from_name', null, $company->id) ?: config('mail.from.name');

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

        try {
            $mailable = new ProformaMail(
                proforma: $proforma,
                emailSubject: $request->validated('subject'),
                body: $request->validated('body'),
                pdfPath: $pdfPath,
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
                'message' => 'Predračun uspješno poslat na email.',
            ]);
        } finally {
            if ($pdfPath && file_exists($pdfPath)) {
                @unlink($pdfPath);
            }
        }
    }

    #[Endpoint(operationId: 'updateProforma', title: 'Update proforma', description: 'Update proforma')]
    public function update(UpdateProformaRequest $request, Company $company, Proforma $proforma): ProformaResource
    {
        $data = $request->validated();

        // Validate currency_id if provided
        if (isset($data['currency_id'])) {
            $currency = Currency::where('company_id', $company->id)->where('id', $data['currency_id'])->first();
            if (!$currency) {
                return response()->json(['message' => 'Currency not found'], 422);
            }
        }

        $proforma->update($data);

        // Update items if provided
        if ($request->has('items')) {
            $proforma->items()->delete();
            foreach ($request->input('items') as $itemData) {
                $proforma->items()->create($itemData);
            }
        }

        return new ProformaResource($proforma->load(['items', 'client', 'source', 'bankAccount', 'currency']));
    }

    #[Endpoint(operationId: 'destroyProforma', title: 'Destroy proforma', description: 'Remove proforma')]
    public function destroy(Company $company, Proforma $proforma): JsonResponse
    {
        $proforma->delete();
        return response()->json(['message' => 'Proforma deleted successfully']);
    }

    #[Endpoint(operationId: 'createProformaFromQuote', title: 'Create proforma from quote', description: 'Create proforma from quote')]
    public function createFromQuote(CreateFromQuoteRequest $request, Company $company, Quote $quote): ProformaResource
    {
        $proforma = $this->conversionService->convertQuoteToProforma($quote);

        // Reserve proforma number
        $numberData = $this->numberService->reserveNumber($company, 'proforma');
        $proforma->proforma_number = $numberData['formatted'];
        $proforma->save();

        return new ProformaResource($proforma->load(['items', 'client', 'source', 'bankAccount', 'currency']));
    }

    #[Endpoint(operationId: 'convertProformaToInvoice', title: 'Convert proforma to invoice', description: 'Convert proforma to invoice')]
    public function convertToInvoice(Company $company, Proforma $proforma): InvoiceResource
    {
        $invoice = $this->conversionService->convertProformaToInvoice($proforma);

        // Reserve invoice number
        $numberData = $this->numberService->reserveNumber($company, 'invoice');
        $invoice->invoice_number = $numberData['formatted'];
        $invoice->save();

        return new InvoiceResource($invoice->load('items'));
    }

}
