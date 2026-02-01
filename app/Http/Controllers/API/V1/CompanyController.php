<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\StoreCompanyRequest;
use App\Http\Requests\API\V1\UpdateCompanyRequest;
use App\Http\Resources\API\V1\CompanyResource;
use App\Models\Company;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Companies', weight: 2)]
class CompanyController extends Controller
{
    #[Endpoint(operationId: 'getCompanies', title: 'Get companies', description: 'Get all companies')]
    public function index(): AnonymousResourceCollection
    {
        $companies = Company::query()->with('users')->latest()->get();

        return CompanyResource::collection($companies);
    }

    #[Endpoint(operationId: 'storeCompany', title: 'Store company', description: 'Create a new company')]
    public function store(StoreCompanyRequest $request): CompanyResource
    {
        $validated = $request->validated();
        $company = Company::create($validated);

        return new CompanyResource($company);
    }

    #[Endpoint(operationId: 'showCompany', title: 'Show company', description: 'Get company')]
    public function show(Company $company): CompanyResource
    {
        $company->load('users');

        return new CompanyResource($company);
    }

    #[Endpoint(operationId: 'updateCompany', title: 'Update company', description: 'Update company')]
    public function update(UpdateCompanyRequest $request, Company $company): CompanyResource
    {
        $validated = $request->validated();
        $company->update($validated);

        return new CompanyResource($company);
    }

    #[Endpoint(operationId: 'destroyCompany', title: 'Destroy company', description: 'Remove company')]
    public function destroy(Company $company): \Illuminate\Http\JsonResponse
    {
        $company->delete();

        return response()->json(['message' => 'Company deleted successfully']);
    }
}
