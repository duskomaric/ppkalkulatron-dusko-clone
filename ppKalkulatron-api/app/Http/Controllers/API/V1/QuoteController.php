<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\IndexQuoteRequest;
use App\Http\Requests\API\V1\StoreQuoteRequest;
use App\Http\Requests\API\V1\UpdateQuoteRequest;
use App\Http\Requests\API\V1\SendQuoteEmailRequest;
use App\Http\Resources\API\V1\QuoteResource;
use App\Http\Resources\API\V1\ProformaResource;
use App\Mail\QuoteMail;
use App\Models\Company;
use App\Models\Quote;
use App\Services\CompanyMailService;
use App\Services\DocumentConversionService;
use App\Services\DocumentNumberService;
use App\Services\QuotePdfService;
use Carbon\Carbon;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Quotes', weight: 8)]
class QuoteController extends Controller
{
    #[Endpoint(operationId: 'getQuotes', title: 'Get quotes', description: 'Get all quotes')]
    public function index(IndexQuoteRequest $request, Company $company): AnonymousResourceCollection
    {
        $query = $company->quotes()
            ->with(['items', 'client', 'bankAccount', 'currency'])
            ->latest();

        $query
            ->when($request->validated('search'), function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('quote_number', 'like', '%' . $search . '%')
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

        return QuoteResource::collection($query->paginate(20));
    }

    #[Endpoint(operationId: 'storeQuote', title: 'Store quote', description: 'Create a new quote')]
    public function store(StoreQuoteRequest $request, Company $company, DocumentNumberService $numberService): QuoteResource
    {
        $quote = $company->quotes()->create(
            $request->safe()
                ->merge([
                    'quote_number' => $request->validated('quote_number')
                        ?: $numberService->reserveNumber($company, 'quote')['formatted'],
                ])
                ->except('items')
        );

        $quote->items()->createMany($request->validated('items') ?? []);

        return new QuoteResource($quote->load(['items', 'client', 'bankAccount', 'currency']));
    }

    #[Endpoint(operationId: 'showQuote', title: 'Show quote', description: 'Get quote')]
    public function show(Company $company, Quote $quote): QuoteResource
    {
        return new QuoteResource($quote->load(['items', 'client', 'bankAccount', 'currency']));
    }

    #[Endpoint(operationId: 'downloadQuotePdf', title: 'Download quote PDF', description: 'Export quote as PDF')]
    public function downloadPdf(Company $company, Quote $quote, QuotePdfService $pdfService): Response
    {
        return $pdfService->download($quote)->toResponse(request());
    }

    #[Endpoint(operationId: 'sendQuoteEmail', title: 'Send quote email', description: 'Send quote via email')]
    public function sendEmail(SendQuoteEmailRequest $request, Company $company, Quote $quote, CompanyMailService $mailService, QuotePdfService $pdfService): JsonResponse
    {
        $quote->load(['client', 'company']);
        $pdfPath = null;
        if ($request->boolean('attach_pdf')) {
            $pdfPath = $mailService->createTempPdfPath();
            $pdfService->save($quote, $pdfPath);
        }

        try {
            [$fromAddress, $fromName] = $mailService->resolveFrom($company);

            $mailable = new QuoteMail(
                quote: $quote,
                emailSubject: $request->validated('subject'),
                body: $request->validated('body'),
                pdfPath: $pdfPath,
                fromAddress: $fromAddress,
                fromName: $fromName,
            );

            $mailService->send($company, $request->validated('to'), $mailable);

            return response()->json([
                'success' => true,
                'message' => 'Ponuda uspješno poslata na email.',
            ]);
        } finally {
            $mailService->cleanupTempFile($pdfPath);
        }
    }

    #[Endpoint(operationId: 'updateQuote', title: 'Update quote', description: 'Update quote')]
    public function update(UpdateQuoteRequest $request, Company $company, Quote $quote): QuoteResource
    {
        $quote->update($request->safe()->except('items'));

        if ($request->has('items')) {
            $quote->items()->delete();
            $quote->items()->createMany($request->validated('items') ?? []);
        }

        return new QuoteResource($quote->load(['items', 'client', 'bankAccount', 'currency']));
    }

    #[Endpoint(operationId: 'destroyQuote', title: 'Destroy quote', description: 'Remove quote')]
    public function destroy(Company $company, Quote $quote): JsonResponse
    {
        $quote->delete();
        return response()->json(['message' => 'Quote deleted successfully']);
    }

    #[Endpoint(operationId: 'convertQuoteToProforma', title: 'Convert quote to proforma', description: 'Convert quote to proforma')]
    public function convertToProforma(Company $company, Quote $quote, DocumentConversionService $conversionService, DocumentNumberService $numberService): ProformaResource
    {
        $proforma = $conversionService->convertQuoteToProforma($quote);

        // Reserve proforma number
        $numberData = $numberService->reserveNumber($company, 'proforma');
        $proforma->proforma_number = $numberData['formatted'];
        $proforma->save();

        return new ProformaResource($proforma->load('items'));
    }

}
