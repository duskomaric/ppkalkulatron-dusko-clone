<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\API\V1\UserResource;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Invoice;
use App\Models\Proforma;
use App\Models\Quote;
use App\Models\Enums\ArticleTypeEnum;
use App\Models\Enums\DocumentFrequencyEnum;
use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\FiscalPaymentTypeEnum;
use App\Models\Enums\LanguageEnum;
use App\Models\Enums\TaxRateEnum;
use App\Models\Enums\UnitEnum;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('User', weight: 1)]
class MeController extends Controller
{
    #[Endpoint(operationId: 'getMe', title: 'Get current user context', description: 'Get current authenticated user with companies and available options for forms (languages, frequencies, templates)')]
    public function show(Request $request, \App\Models\Company $company): JsonResponse
    {
        $user = $request->user();
        $user->load('companies');

        if ($user->isAdmin()) { //TODO: check if needed
            $user->setRelation('companies', Company::query()->get());
        }

        $availableYears = $this->availableYearsForCompany($company);

        return response()->json([
            'data' => [
                'user' => UserResource::make($user),
                'company_settings' => CompanySetting::resolved($company->id),
                'available_years' => $availableYears,
                'languages' => collect(LanguageEnum::cases())->map(fn($lang) => [
                    'value' => $lang->value,
                    'label' => $lang->getLabel(),
                ])->values(),
                'frequencies' => collect(DocumentFrequencyEnum::cases())->map(fn($freq) => [
                    'value' => $freq->value,
                    'label' => $freq->getLabel(),
                ])->values(),
                'templates' => collect(DocumentTemplateEnum::cases())->map(fn($tpl) => [
                    'value' => $tpl->value,
                    'label' => $tpl->getLabel(),
                ])->values(),
                'payment_types' => FiscalPaymentTypeEnum::options(),
                'article_types' => array_map(fn (ArticleTypeEnum $e) => [
                    'value' => $e->value,
                    'label' => $e->getLabel(),
                ], ArticleTypeEnum::cases()),
                'units' => UnitEnum::options(),
                'tax_rates' => TaxRateEnum::options(),
            ],
        ]);
    }

    /**
     * Years that have documents (quotes, proformas, invoices) for this company, plus current year. Sorted descending.
     */
    private function availableYearsForCompany(Company $company): array
    {
        $years = collect();
        foreach ([Quote::class, Proforma::class, Invoice::class] as $model) {
            $years = $years->merge(
                $model::where('company_id', $company->id)->selectRaw('YEAR(date) as y')->distinct()->pluck('y')
            );
        }
        $years = $years->push((int) date('Y'))->unique()->map(fn ($y) => (int) $y)->sort()->values()->all();
        return array_values(array_reverse($years));
    }
}
