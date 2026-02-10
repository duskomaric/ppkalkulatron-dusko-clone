<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\StoreQuoteRequest;
use App\Http\Requests\API\V1\UpdateQuoteRequest;
use App\Http\Requests\API\V1\SendQuoteEmailRequest;
use App\Http\Resources\API\V1\QuoteResource;
use App\Http\Resources\API\V1\ProformaResource;
use App\Mail\QuoteMail;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Quote;
use App\Services\DocumentConversionService;
use App\Services\DocumentNumberService;
use App\Services\QuotePdfService;
use Carbon\Carbon;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

#[Group('Quotes', weight: 8)]
class QuoteController extends Controller
{
    public function __construct(
        private DocumentNumberService $numberService,
        private DocumentConversionService $conversionService,
        private QuotePdfService $pdfService
    ) {
    }

    #[Endpoint(operationId: 'getQuotes', title: 'Get quotes', description: 'Get all quotes')]
    public function index(Request $request, Company $company): AnonymousResourceCollection
    {
        $query = $company->quotes()
            ->with(['items', 'client', 'bankAccount'])
            ->latest();

        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('quote_number', 'like', '%' . $search . '%')
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

        return QuoteResource::collection($query->paginate(20));
    }

    #[Endpoint(operationId: 'storeQuote', title: 'Store quote', description: 'Create a new quote')]
    public function store(StoreQuoteRequest $request, Company $company): QuoteResource
    {
        $data = $request->validated();

        $items = $data['items'] ?? [];
        unset($data['items']);

        if (empty($data['quote_number'])) {
            $numberData = $this->numberService->reserveNumber($company, 'quote');
            $data['quote_number'] = $numberData['formatted'];
        }

        $quote = $company->quotes()->create($data);

        foreach ($items as $itemData) {
            $quote->items()->create($itemData);
        }

        return new QuoteResource($quote->load(['items', 'client', 'bankAccount']));
    }

    #[Endpoint(operationId: 'showQuote', title: 'Show quote', description: 'Get quote')]
    public function show(Company $company, Quote $quote): QuoteResource
    {
        return new QuoteResource($quote->load(['items', 'client', 'bankAccount']));
    }

    #[Endpoint(operationId: 'downloadQuotePdf', title: 'Download quote PDF', description: 'Export quote as PDF')]
    public function downloadPdf(Company $company, Quote $quote): Response
    {
        return $this->pdfService->download($quote)->toResponse(request());
    }

    #[Endpoint(operationId: 'sendQuoteEmail', title: 'Send quote email', description: 'Send quote via email')]
    public function sendEmail(SendQuoteEmailRequest $request, Company $company, Quote $quote): JsonResponse
    {
        $quote->load(['client', 'company']);

        $pdfPath = null;
        if ($request->boolean('attach_pdf')) {
            $pdfPath = storage_path('app/private/temp-' . Str::random(16) . '.pdf');
            $this->pdfService->save($quote, $pdfPath);
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
            $mailable = new QuoteMail(
                quote: $quote,
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
                'message' => 'Ponuda uspješno poslata na email.',
            ]);
        } finally {
            if ($pdfPath && file_exists($pdfPath)) {
                @unlink($pdfPath);
            }
        }
    }

    #[Endpoint(operationId: 'updateQuote', title: 'Update quote', description: 'Update quote')]
    public function update(UpdateQuoteRequest $request, Company $company, Quote $quote): QuoteResource
    {
        $quote->update($request->validated());

        if ($request->has('items')) {
            $quote->items()->delete();
            foreach ($request->input('items') as $itemData) {
                $quote->items()->create($itemData);
            }
        }

        return new QuoteResource($quote->load(['items', 'client', 'bankAccount']));
    }

    #[Endpoint(operationId: 'destroyQuote', title: 'Destroy quote', description: 'Remove quote')]
    public function destroy(Company $company, Quote $quote): JsonResponse
    {
        $quote->delete();
        return response()->json(['message' => 'Quote deleted successfully']);
    }

    #[Endpoint(operationId: 'convertQuoteToProforma', title: 'Convert quote to proforma', description: 'Convert quote to proforma')]
    public function convertToProforma(Company $company, Quote $quote): ProformaResource
    {
        $proforma = $this->conversionService->convertQuoteToProforma($quote);

        // Reserve proforma number
        $numberData = $this->numberService->reserveNumber($company, 'proforma');
        $proforma->proforma_number = $numberData['formatted'];
        $proforma->save();

        return new ProformaResource($proforma->load('items'));
    }

}
