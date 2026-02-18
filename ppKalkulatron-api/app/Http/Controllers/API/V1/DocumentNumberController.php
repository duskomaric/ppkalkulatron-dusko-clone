<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\ReserveNumberRequest;
use App\Models\Company;
use App\Services\DocumentNumberService;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;

#[Group('Document Numbers', weight: 9)]
class DocumentNumberController extends Controller
{
    #[Endpoint(operationId: 'getNextNumber', title: 'Get next number', description: 'Preview next document number without reserving')]
    public function getNextNumber(Company $company, ReserveNumberRequest $request, DocumentNumberService $numberService): JsonResponse
    {
        $type = $request->query('type') ?? $request->input('type');
        $year = $request->query('year') ?? $request->input('year');

        $result = $numberService->getNextNumber($company, $type, $year);

        return response()->json($result);
    }

    #[Endpoint(operationId: 'reserveNumber', title: 'Reserve number', description: 'Reserve and return next document number')]
    public function reserveNumber(Company $company, ReserveNumberRequest $request, DocumentNumberService $numberService): JsonResponse
    {
        $type = $request->input('type');
        $year = $request->input('year');

        $result = $numberService->reserveNumber($company, $type, $year);

        return response()->json($result);
    }
}
