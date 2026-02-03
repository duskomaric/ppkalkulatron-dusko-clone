<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\StoreProformaRequest;
use App\Http\Requests\API\V1\UpdateProformaRequest;
use App\Http\Requests\API\V1\CreateFromQuoteRequest;
use App\Http\Resources\API\V1\ProformaResource;
use App\Http\Resources\API\V1\InvoiceResource;
use App\Models\Company;
use App\Models\Proforma;
use App\Models\Quote;
use App\Services\DocumentConversionService;
use App\Services\DocumentNumberService;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Proformas', weight: 6)]
class ProformaController extends Controller
{
    public function __construct(
        private DocumentNumberService $numberService,
        private DocumentConversionService $conversionService
    ) {
    }

    #[Endpoint(operationId: 'getProformas', title: 'Get proformas', description: 'Get all proformas')]
    public function index(Company $company): AnonymousResourceCollection
    {
        return ProformaResource::collection($company->proformas()->latest()->paginate(20));
    }

    #[Endpoint(operationId: 'storeProforma', title: 'Store proforma', description: 'Create a new proforma')]
    public function store(StoreProformaRequest $request, Company $company): ProformaResource
    {
        $data = $request->validated();
        
        // Reserve proforma number if not provided
        if (empty($data['proforma_number'])) {
            $numberData = $this->numberService->reserveNumber($company, 'proforma');
            $data['proforma_number'] = $numberData['formatted'];
        }

        $proforma = $company->proformas()->create($data);

        // Create items with snapshot data
        if ($request->has('items')) {
            foreach ($request->input('items') as $itemData) {
                $proforma->items()->create($itemData);
            }
        }

        return new ProformaResource($proforma->load('items'));
    }

    #[Endpoint(operationId: 'showProforma', title: 'Show proforma', description: 'Get proforma')]
    public function show(Company $company, Proforma $proforma): ProformaResource
    {
        return new ProformaResource($proforma->load(['items', 'source']));
    }

    #[Endpoint(operationId: 'updateProforma', title: 'Update proforma', description: 'Update proforma')]
    public function update(UpdateProformaRequest $request, Company $company, Proforma $proforma): ProformaResource
    {
        $proforma->update($request->validated());

        // Update items if provided
        if ($request->has('items')) {
            $proforma->items()->delete();
            foreach ($request->input('items') as $itemData) {
                $proforma->items()->create($itemData);
            }
        }

        return new ProformaResource($proforma->load('items'));
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
        abort_if($quote->company_id !== $company->id, 404);

        $proforma = $this->conversionService->convertQuoteToProforma($quote);

        // Reserve proforma number
        $numberData = $this->numberService->reserveNumber($company, 'proforma');
        $proforma->proforma_number = $numberData['formatted'];
        $proforma->save();

        return new ProformaResource($proforma->load('items'));
    }

    #[Endpoint(operationId: 'convertProformaToInvoice', title: 'Convert proforma to invoice', description: 'Convert proforma to invoice')]
    public function convertToInvoice(Company $company, Proforma $proforma): InvoiceResource
    {
        abort_if($proforma->company_id !== $company->id, 404);

        $invoice = $this->conversionService->convertProformaToInvoice($proforma);

        // Reserve invoice number
        $numberData = $this->numberService->reserveNumber($company, 'invoice');
        $invoice->invoice_number = $numberData['formatted'];
        $invoice->save();

        return new InvoiceResource($invoice->load('items'));
    }
}
