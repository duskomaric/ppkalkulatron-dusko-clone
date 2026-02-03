<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\StoreQuoteRequest;
use App\Http\Requests\API\V1\UpdateQuoteRequest;
use App\Http\Resources\API\V1\QuoteResource;
use App\Http\Resources\API\V1\ProformaResource;
use App\Models\Company;
use App\Models\Quote;
use App\Services\DocumentConversionService;
use App\Services\DocumentNumberService;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Quotes', weight: 8)]
class QuoteController extends Controller
{
    public function __construct(
        private DocumentNumberService $numberService,
        private DocumentConversionService $conversionService
    ) {
    }

    #[Endpoint(operationId: 'getQuotes', title: 'Get quotes', description: 'Get all quotes')]
    public function index(Company $company): AnonymousResourceCollection
    {
        return QuoteResource::collection($company->quotes()->latest()->paginate(20));
    }

    #[Endpoint(operationId: 'storeQuote', title: 'Store quote', description: 'Create a new quote')]
    public function store(StoreQuoteRequest $request, Company $company): QuoteResource
    {
        $data = $request->validated();
        
        // Reserve quote number if not provided
        if (empty($data['quote_number'])) {
            $numberData = $this->numberService->reserveNumber($company, 'quote');
            $data['quote_number'] = $numberData['formatted'];
        }

        $quote = $company->quotes()->create($data);

        // Create items with snapshot data
        if ($request->has('items')) {
            foreach ($request->input('items') as $itemData) {
                $quote->items()->create($itemData);
            }
        }

        return new QuoteResource($quote->load('items'));
    }

    #[Endpoint(operationId: 'showQuote', title: 'Show quote', description: 'Get quote')]
    public function show(Company $company, Quote $quote): QuoteResource
    {
        return new QuoteResource($quote->load('items'));
    }

    #[Endpoint(operationId: 'updateQuote', title: 'Update quote', description: 'Update quote')]
    public function update(UpdateQuoteRequest $request, Company $company, Quote $quote): QuoteResource
    {
        $quote->update($request->validated());

        // Update items if provided
        if ($request->has('items')) {
            $quote->items()->delete();
            foreach ($request->input('items') as $itemData) {
                $quote->items()->create($itemData);
            }
        }

        return new QuoteResource($quote->load('items'));
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
        abort_if($quote->company_id !== $company->id, 404);

        $proforma = $this->conversionService->convertQuoteToProforma($quote);

        // Reserve proforma number
        $numberData = $this->numberService->reserveNumber($company, 'proforma');
        $proforma->proforma_number = $numberData['formatted'];
        $proforma->save();

        return new ProformaResource($proforma->load('items'));
    }
}
