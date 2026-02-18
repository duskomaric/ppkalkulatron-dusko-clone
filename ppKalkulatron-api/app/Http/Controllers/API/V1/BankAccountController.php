<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\StoreBankAccountRequest;
use App\Http\Requests\API\V1\UpdateBankAccountRequest;
use App\Http\Resources\API\V1\BankAccountResource;
use App\Models\Company;
use App\Models\BankAccount;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Bank Accounts', weight: 6)]
class BankAccountController extends Controller
{
    #[Endpoint(operationId: 'getCompanyBankAccounts', title: 'Get bank accounts', description: 'Get all bank accounts')]
    public function index(Company $company): AnonymousResourceCollection
    {
        return BankAccountResource::collection($company->bankAccounts()->latest()->paginate(20));
    }

    #[Endpoint(operationId: 'storeCompanyBankAccount', title: 'Store bank account', description: 'Create a new bank account')]
    public function store(StoreBankAccountRequest $request, Company $company): BankAccountResource
    {
        $validated = $request->validated();

        if (($validated['is_default'] ?? false) === true) {
            $company->bankAccounts()->update(['is_default' => false]);
        }

        $bankAccount = $company->bankAccounts()->create($validated);

        return new BankAccountResource($bankAccount);
    }

    #[Endpoint(operationId: 'showCompanyBankAccount', title: 'Show bank account', description: 'Get bank account')]
    public function show(Company $company, BankAccount $bankAccount): BankAccountResource
    {
        return new BankAccountResource($bankAccount);
    }

    #[Endpoint(operationId: 'updateCompanyBankAccount', title: 'Update bank account', description: 'Update bank account')]
    public function update(UpdateBankAccountRequest $request, Company $company, BankAccount $bankAccount): BankAccountResource
    {
        $validated = $request->validated();

        if (($validated['is_default'] ?? false) === true) {
            $company->bankAccounts()->whereKeyNot($bankAccount->getKey())->update(['is_default' => false]);
        }

        $bankAccount->update($validated);

        return new BankAccountResource($bankAccount);
    }

}
