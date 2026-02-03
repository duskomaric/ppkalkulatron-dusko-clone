<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\StoreInvoiceRequest;
use App\Http\Requests\API\V1\UpdateInvoiceRequest;
use App\Http\Requests\API\V1\CreateFromProformaRequest;
use App\Http\Requests\API\V1\CreateFromContractRequest;
use App\Http\Resources\API\V1\InvoiceResource;
use App\Models\Company;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Proforma;
use App\Services\DocumentConversionService;
use App\Services\DocumentNumberService;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Invoices', weight: 5)]
class InvoiceController extends Controller
{
    public function __construct(
        private DocumentNumberService $numberService,
        private DocumentConversionService $conversionService
    ) {
    }

    #[Endpoint(operationId: 'getInvoices', title: 'Get invoices', description: 'Get all invoices')]
    public function index(Company $company): AnonymousResourceCollection
    {
        return InvoiceResource::collection(
            $company->invoices()
                ->with(['items', 'source', 'client'])
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

        // Reserve invoice number if not provided
        if (empty($data['invoice_number'])) {
            $numberData = $this->numberService->reserveNumber($company, 'invoice');
            $data['invoice_number'] = $numberData['formatted'];
        }

        $invoice = $company->invoices()->create($data);

        // Create items with snapshot data
        foreach ($items as $itemData) {
            $invoice->items()->create($itemData);
        }

        return new InvoiceResource($invoice->load('items'));
    }

    #[Endpoint(operationId: 'showInvoice', title: 'Show invoice', description: 'Get invoice')]
    public function show(Company $company, Invoice $invoice): InvoiceResource
    {
        return new InvoiceResource($invoice->load(['items', 'source', 'parent', 'children']));
    }

    #[Endpoint(operationId: 'updateInvoice', title: 'Update invoice', description: 'Update invoice')]
    public function update(UpdateInvoiceRequest $request, Company $company, Invoice $invoice): InvoiceResource
    {
        $invoice->update($request->validated());

        // Update items if provided
        if ($request->has('items')) {
            $invoice->items()->delete();
            foreach ($request->input('items') as $itemData) {
                $invoice->items()->create($itemData);
            }
        }

        return new InvoiceResource($invoice->load('items'));
    }

    #[Endpoint(operationId: 'destroyInvoice', title: 'Destroy invoice', description: 'Remove invoice')]
    public function destroy(Company $company, Invoice $invoice): JsonResponse
    {
        $invoice->delete();
        return response()->json(['message' => 'Invoice deleted successfully']);
    }

    #[Endpoint(operationId: 'createInvoiceFromProforma', title: 'Create invoice from proforma', description: 'Create invoice from proforma')]
    public function createFromProforma(CreateFromProformaRequest $request, Company $company, Proforma $proforma): InvoiceResource
    {
        abort_if($proforma->company_id !== $company->id, 404);

        $invoice = $this->conversionService->convertProformaToInvoice($proforma);

        // Reserve invoice number
        $numberData = $this->numberService->reserveNumber($company, 'invoice');
        $invoice->invoice_number = $numberData['formatted'];
        $invoice->save();

        return new InvoiceResource($invoice->load('items'));
    }

    #[Endpoint(operationId: 'createInvoiceFromContract', title: 'Create invoice from contract', description: 'Create invoice from contract')]
    public function createFromContract(CreateFromContractRequest $request, Company $company, Contract $contract): InvoiceResource
    {
        abort_if($contract->company_id !== $company->id, 404);

        $invoice = $this->conversionService->convertContractToInvoice($contract);

        // Reserve invoice number
        $numberData = $this->numberService->reserveNumber($company, 'invoice');
        $invoice->invoice_number = $numberData['formatted'];
        $invoice->save();

        return new InvoiceResource($invoice->load('items'));
    }
}
