<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\IndexClientRequest;
use App\Http\Requests\API\V1\StoreClientRequest;
use App\Http\Requests\API\V1\UpdateClientRequest;
use App\Http\Resources\API\V1\ClientResource;
use App\Models\Client;
use App\Models\Company;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Clients', weight: 3)]
class ClientController extends Controller
{
    #[Endpoint(operationId: 'getClients', title: 'Get clients', description: 'Get all clients')]
    public function index(IndexClientRequest $request, Company $company): AnonymousResourceCollection
    {
        $query = $company->clients()->latest();

        $query
            ->when($request->validated('search'), fn ($q, $search) => $q->where('name', 'like', '%' . $search . '%'))
            ->when($request->validated('status'), function ($q, $status) {
                if ($status === 'active') {
                    $q->where('is_active', true);
                } elseif ($status === 'inactive') {
                    $q->where('is_active', false);
                }
            });

        return ClientResource::collection($query->paginate(20));
    }

    #[Endpoint(operationId: 'storeClient', title: 'Store client', description: 'Create a new client')]
    public function store(StoreClientRequest $request, Company $company): ClientResource
    {
        $client = $company->clients()->create($request->validated());
        return new ClientResource($client);
    }

    #[Endpoint(operationId: 'showClient', title: 'Show client', description: 'Get client')]
    public function show(Company $company, Client $client): ClientResource
    {
        // Route model binding ensures client belongs to company
        return new ClientResource($client);
    }

    #[Endpoint(operationId: 'updateClient', title: 'Update client', description: 'Update client')]
    public function update(UpdateClientRequest $request, Company $company, Client $client): ClientResource
    {
        // Route model binding ensures client belongs to company
        $client->update($request->validated());
        return new ClientResource($client);
    }

    #[Endpoint(operationId: 'destroyClient', title: 'Destroy client', description: 'Remove client')]
    public function destroy(Company $company, Client $client): \Illuminate\Http\JsonResponse
    {
        //klijent se nalazi na racunu i nije ga moguce obrisati
        if ($client->invoices()->exists()) {
            return response()->json([
                'message' => 'Klijent je koriscen u racunu i ne moze da se obriše',
            ], 422);
        }

        // Route model binding ensures client belongs to company
        $client->delete();
        return response()->json(['message' => 'Client deleted successfully']);
    }
}
