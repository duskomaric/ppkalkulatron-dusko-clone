<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\StoreCurrencyRequest;
use App\Http\Requests\API\V1\UpdateCurrencyRequest;
use App\Http\Resources\API\V1\CurrencyResource;
use App\Models\Company;
use App\Models\Currency;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Currencies', weight: 5)]
class CurrencyController extends Controller
{
    #[Endpoint(operationId: 'getCurrencies', title: 'Get currencies', description: 'Get all currencies')]
    public function index(Company $company): AnonymousResourceCollection
    {
        return CurrencyResource::collection($company->currencies()->latest()->paginate(20));
    }

    #[Endpoint(operationId: 'storeCurrency', title: 'Store currency', description: 'Create a new currency')]
    public function store(StoreCurrencyRequest $request, Company $company): CurrencyResource
    {
        $validated = $request->validated();
        $validated['code'] = strtoupper($validated['code']);

        $currency = $company->currencies()->create($validated);

        return new CurrencyResource($currency);
    }

    #[Endpoint(operationId: 'showCurrency', title: 'Show currency', description: 'Get currency')]
    public function show(Company $company, Currency $currency): CurrencyResource
    {
        return new CurrencyResource($currency);
    }

    #[Endpoint(operationId: 'updateCurrency', title: 'Update currency', description: 'Update currency')]
    public function update(UpdateCurrencyRequest $request, Company $company, Currency $currency): CurrencyResource
    {
        $validated = $request->validated();

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper($validated['code']);
        }

        $currency->update($validated);

        return new CurrencyResource($currency);
    }

    #[Endpoint(operationId: 'destroyCurrency', title: 'Destroy currency', description: 'Remove currency')]
    public function destroy(Company $company, Currency $currency): \Illuminate\Http\JsonResponse
    {
        $currency->delete();

        return response()->json(['message' => 'Currency deleted successfully']);
    }
}
