<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\API\V1\UserResource;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Enums\DocumentFrequencyEnum;
use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\LanguageEnum;
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

        return response()->json([
            'data' => [
                'user' => UserResource::make($user),
                'company_settings' => CompanySetting::resolved($company->id),
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
            ],
        ]);
    }
}
