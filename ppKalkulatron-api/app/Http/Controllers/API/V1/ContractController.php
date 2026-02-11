<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\StoreContractRequest;
use App\Http\Requests\API\V1\UpdateContractRequest;
use App\Http\Requests\API\V1\UploadFileRequest;
use App\Http\Resources\API\V1\ContractResource;
use App\Http\Resources\API\V1\InvoiceResource;
use App\Models\Company;
use App\Models\Contract;
use App\Services\DocumentConversionService;
use App\Services\DocumentNumberService;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

#[Group('Contracts', weight: 7)]
class ContractController extends Controller
{
    public function __construct(
        private DocumentNumberService $numberService,
        private DocumentConversionService $conversionService
    ) {
    }

    #[Endpoint(operationId: 'getContracts', title: 'Get contracts', description: 'Get all contracts')]
    public function index(Company $company): AnonymousResourceCollection
    {
        return ContractResource::collection($company->contracts()->latest()->paginate(20));
    }

    #[Endpoint(operationId: 'storeContract', title: 'Store contract', description: 'Create a new contract')]
    public function store(StoreContractRequest $request, Company $company): ContractResource
    {
        $data = $request->validated();
        
        // Reserve contract number if not provided
        if (empty($data['contract_number'])) {
            $numberData = $this->numberService->reserveNumber($company, 'contract');
            $data['contract_number'] = $numberData['formatted'];
        }

        $contract = $company->contracts()->create($data);

        // Create items with snapshot data
        if ($request->has('items')) {
            foreach ($request->input('items') as $itemData) {
                $contract->items()->create($itemData);
            }
        }

        return new ContractResource($contract->load('items'));
    }

    #[Endpoint(operationId: 'showContract', title: 'Show contract', description: 'Get contract')]
    public function show(Company $company, Contract $contract): ContractResource
    {
        return new ContractResource($contract->load(['items', 'source']));
    }

    #[Endpoint(operationId: 'updateContract', title: 'Update contract', description: 'Update contract')]
    public function update(UpdateContractRequest $request, Company $company, Contract $contract): ContractResource
    {
        $contract->update($request->validated());

        // Update items if provided
        if ($request->has('items')) {
            $contract->items()->delete();
            foreach ($request->input('items') as $itemData) {
                $contract->items()->create($itemData);
            }
        }

        return new ContractResource($contract->load('items'));
    }

    #[Endpoint(operationId: 'destroyContract', title: 'Destroy contract', description: 'Remove contract')]
    public function destroy(Company $company, Contract $contract): JsonResponse
    {
        // Delete associated files
        if ($contract->file_paths) {
            foreach ($contract->file_paths as $filePath) {
                if (Storage::exists($filePath)) {
                    Storage::delete($filePath);
                }
            }
        }

        $contract->delete();
        return response()->json(['message' => 'Contract deleted successfully']);
    }

    #[Endpoint(operationId: 'uploadContractFile', title: 'Upload contract file', description: 'Upload file to contract')]
    public function uploadFile(UploadFileRequest $request, Company $company, Contract $contract): JsonResponse
    {
        abort_if($contract->company_id !== $company->id, 404);

        $file = $request->file('file');
        $path = $file->store("contracts/{$company->id}/{$contract->id}", 'local');

        $contract->addFile($path);

        return response()->json([
            'message' => 'File uploaded successfully',
            'file_path' => $path,
        ]);
    }

    #[Endpoint(operationId: 'downloadContractFile', title: 'Download contract file', description: 'Download file from contract')]
    public function downloadFile(Company $company, Contract $contract, int $fileIndex): StreamedResponse|JsonResponse
    {
        abort_if($contract->company_id !== $company->id, 404);

        $files = $contract->file_paths ?? [];
        if (!isset($files[$fileIndex])) {
            return response()->json(['message' => 'File not found'], 404);
        }

        $filePath = $files[$fileIndex];
        if (!Storage::exists($filePath)) {
            return response()->json(['message' => 'File not found on disk'], 404);
        }

        return Storage::download($filePath);
    }

    #[Endpoint(operationId: 'deleteContractFile', title: 'Delete contract file', description: 'Delete file from contract')]
    public function deleteFile(Company $company, Contract $contract, int $fileIndex): JsonResponse
    {
        abort_if($contract->company_id !== $company->id, 404);

        if (!$contract->removeFile($fileIndex)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return response()->json(['message' => 'File deleted successfully']);
    }

    #[Endpoint(operationId: 'convertContractToInvoice', title: 'Convert contract to invoice', description: 'Convert contract to invoice')]
    public function convertToInvoice(Company $company, Contract $contract): InvoiceResource
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
