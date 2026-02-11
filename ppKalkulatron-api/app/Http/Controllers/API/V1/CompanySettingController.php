<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\UpdateCompanySettingsRequest;
use App\Http\Resources\API\V1\CompanySettingResource;
use App\Models\Company;
use App\Models\CompanySetting;
use Illuminate\Validation\ValidationException;

class CompanySettingController extends Controller
{
    public function show(Company $company): \Illuminate\Http\JsonResponse
    {
        return CompanySettingResource::make([
            'company_id' => $company->id,
            'settings' => CompanySetting::resolved($company->id),
        ])->response();
    }

    public function update(UpdateCompanySettingsRequest $request, Company $company): \Illuminate\Http\JsonResponse
    {
        $settings = $request->validated('settings');

        try {
            foreach ($settings as $key => $value) {
                CompanySetting::set((string) $key, $value, $company->id);
            }
        } catch (\InvalidArgumentException $e) {
            throw ValidationException::withMessages(['settings' => [$e->getMessage()]]);
        }

        return CompanySettingResource::make([
            'company_id' => $company->id,
            'settings' => CompanySetting::resolved($company->id),
        ])->response();
    }
}
