<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\IndexProformaRequest;
use App\Http\Requests\API\V1\StoreProformaRequest;
use App\Http\Requests\API\V1\UpdateProformaRequest;
use App\Http\Requests\API\V1\CreateFromQuoteRequest;
use App\Http\Requests\API\V1\SendProformaEmailRequest;
use App\Http\Resources\API\V1\ProformaResource;
use App\Http\Resources\API\V1\InvoiceResource;
use App\Mail\ProformaMail;
use App\Models\Company;
use App\Models\Proforma;
use App\Models\Quote;
use App\Services\CompanyMailService;
use App\Services\DocumentConversionService;
use App\Services\DocumentNumberService;
use App\Services\ProformaPdfService;
use Carbon\Carbon;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Proformas', weight: 6)]
class ProformaController extends Controller
{
    #[Endpoint(operationId: 'getProformas', title: 'Get proformas', description: 'Get all proformas')]
    public function index(IndexProformaRequest $request, Company $company): AnonymousResourceCollection
    {
        $query = $company->proformas()
            ->with(['items', 'client', 'source', 'bankAccount', 'currency'])
            ->latest();

        $query
            ->when($request->validated('search'), function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('proforma_number', 'like', '%' . $search . '%')
                        ->orWhereHas('client', function ($clientQuery) use ($search) {
                            $clientQuery->where('name', 'like', '%' . $search . '%');
                        });
                });
            })
            ->when($request->validated('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->validated('date_from'), function ($q, $dateFrom) {
                $from = Carbon::parse($dateFrom)->toDateString();
                $q->whereDate('date', '>=', $from);
            })
            ->when($request->validated('date_to'), function ($q, $dateTo) {
                $to = Carbon::parse($dateTo)->toDateString();
                $q->whereDate('date', '<=', $to);
            });

        return ProformaResource::collection($query->paginate(20));
    }

    #[Endpoint(operationId: 'storeProforma', title: 'Store proforma', description: 'Create a new proforma')]
    public function store(StoreProformaRequest $request, Company $company, DocumentNumberService $numberService): ProformaResource
    {
        $proforma = $company->proformas()->create(
            $request->safe()
                ->merge([
                    'proforma_number' => $request->validated('proforma_number')
                        ?: $numberService->reserveNumber($company, 'proforma')['formatted'],
                ])
                ->except('items')
        );

        $proforma->items()->createMany($request->validated('items') ?? []);

        return new ProformaResource($proforma->load(['items', 'client', 'source', 'bankAccount', 'currency']));
    }

    #[Endpoint(operationId: 'showProforma', title: 'Show proforma', description: 'Get proforma')]
    public function show(Company $company, Proforma $proforma): ProformaResource
    {
        return new ProformaResource($proforma->load(['items', 'client', 'source', 'bankAccount', 'currency']));
    }

    #[Endpoint(operationId: 'downloadProformaPdf', title: 'Download proforma PDF', description: 'Export proforma as PDF')]
    public function downloadPdf(Company $company, Proforma $proforma, ProformaPdfService $pdfService): Response
    {
        return $pdfService->download($proforma)->toResponse(request());
    }

    #[Endpoint(operationId: 'sendProformaEmail', title: 'Send proforma email', description: 'Send proforma via email')]
    public function sendEmail(SendProformaEmailRequest $request, Company $company, Proforma $proforma, CompanyMailService $mailService, ProformaPdfService $pdfService): JsonResponse
    {
        $proforma->load(['client', 'company']);
        $pdfPath = null;
        if ($request->boolean('attach_pdf')) {
            $pdfPath = $mailService->createTempPdfPath();
            $pdfService->save($proforma, $pdfPath);
        }

        try {
            [$fromAddress, $fromName] = $mailService->resolveFrom($company);

            $mailable = new ProformaMail(
                proforma: $proforma,
                emailSubject: $request->validated('subject'),
                body: $request->validated('body'),
                pdfPath: $pdfPath,
                fromAddress: $fromAddress,
                fromName: $fromName,
            );

            $mailService->send($company, $request->validated('to'), $mailable);

            return response()->json([
                'success' => true,
                'message' => 'Predračun uspješno poslat na email.',
            ]);
        } finally {
            $mailService->cleanupTempFile($pdfPath);
        }
    }

    #[Endpoint(operationId: 'updateProforma', title: 'Update proforma', description: 'Update proforma')]
    public function update(UpdateProformaRequest $request, Company $company, Proforma $proforma): ProformaResource
    {
        $proforma->update($request->safe()->except('items'));

        // Update items if provided
        if ($request->has('items')) {
            $proforma->items()->delete();
            $proforma->items()->createMany($request->validated('items') ?? []);
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
    public function createFromQuote(CreateFromQuoteRequest $request, Company $company, Quote $quote, DocumentConversionService $conversionService, DocumentNumberService $numberService): ProformaResource
    {
        $proforma = $conversionService->convertQuoteToProforma($quote);

        // Reserve proforma number
        $numberData = $numberService->reserveNumber($company, 'proforma');
        $proforma->proforma_number = $numberData['formatted'];
        $proforma->save();

        return new ProformaResource($proforma->load(['items', 'client', 'source', 'bankAccount', 'currency']));
    }

    #[Endpoint(operationId: 'convertProformaToInvoice', title: 'Convert proforma to invoice', description: 'Convert proforma to invoice')]
    public function convertToInvoice(Company $company, Proforma $proforma, DocumentConversionService $conversionService, DocumentNumberService $numberService): InvoiceResource
    {
        $invoice = $conversionService->convertProformaToInvoice($proforma);

        // Reserve invoice number
        $numberData = $numberService->reserveNumber($company, 'invoice');
        $invoice->invoice_number = $numberData['formatted'];
        $invoice->save();

        return new InvoiceResource($invoice->load('items'));
    }

}
