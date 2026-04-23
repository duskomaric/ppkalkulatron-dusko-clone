<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\CalculateIncomeBookEntryAllocationRequest;
use App\Http\Requests\API\V1\IndexIncomeBookEntryRequest;
use App\Http\Requests\API\V1\StoreIncomeBookEntryRequest;
use App\Http\Requests\API\V1\UpdateIncomeBookEntryRequest;
use App\Http\Resources\API\V1\IncomeBookEntryResource;
use App\Models\Company;
use App\Models\Enums\ArticleTypeEnum;
use App\Models\IncomeBookEntry;
use App\Models\Invoice;
use App\Services\IncomeBookEntryPdfService;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

#[Group('Income Book', weight: 10)]
class IncomeBookEntryController extends Controller
{
    #[Endpoint(operationId: 'calculateIncomeBookEntryAllocation', title: 'Calculate allocation', description: 'Calculate income book amounts from invoice and payment amount')]
    public function calculateAllocation(CalculateIncomeBookEntryAllocationRequest $request, Company $company): JsonResponse
    {
        $validated = $request->validated();

        $invoice = Invoice::query()
            ->where('company_id', $company->id)
            ->with('items.article')
            ->findOrFail($validated['invoice_id']);

        $paymentAmount = (int) $validated['payment_amount'];
        $invoiceTotal = (int) ($invoice->total_bam ?? $invoice->total);

        if ($invoiceTotal <= 0) {
            return response()->json([
                'data' => [
                    'invoice_id' => $invoice->id,
                    'payment_amount' => $paymentAmount,
                    'amount_services' => 0,
                    'amount_goods' => 0,
                    'amount_products' => 0,
                    'amount_other_income' => 0,
                    'amount_financial_income' => 0,
                    'total_amount' => 0,
                    'vat_amount' => 0,
                ],
            ]);
        }

        $ratio = $paymentAmount / $invoiceTotal;

        $amountServices = 0;
        $amountGoods = 0;
        $amountProducts = 0;
        $vatAmount = 0;

        foreach ($invoice->items as $item) {
            $itemSubtotal = (int) ($item->subtotal_bam ?? $item->subtotal);
            $itemTaxAmount = (int) ($item->tax_amount_bam ?? $item->tax_amount);
            $allocatedNet = (int) round($itemSubtotal * $ratio);
            $allocatedVat = (int) round($itemTaxAmount * $ratio);

            $type = $item->article?->type?->value ?? ArticleTypeEnum::SERVICES->value;

            if ($type === ArticleTypeEnum::GOODS->value) {
                $amountGoods += $allocatedNet;
            } elseif ($type === ArticleTypeEnum::PRODUCTS->value) {
                $amountProducts += $allocatedNet;
            } else {
                $amountServices += $allocatedNet;
            }

            $vatAmount += $allocatedVat;
        }

        $totalAmount = $amountServices + $amountGoods + $amountProducts;

        return response()->json([
            'data' => [
                'invoice_id' => $invoice->id,
                'payment_amount' => $paymentAmount,
                'amount_services' => $amountServices,
                'amount_goods' => $amountGoods,
                'amount_products' => $amountProducts,
                'amount_other_income' => 0,
                'amount_financial_income' => 0,
                'total_amount' => $totalAmount,
                'vat_amount' => $vatAmount,
            ],
        ]);
    }

    #[Endpoint(operationId: 'downloadIncomeBookPdf', title: 'Download PDF', description: 'Generate and download PDF report')]
    public function downloadPdf(IndexIncomeBookEntryRequest $request, Company $company, IncomeBookEntryPdfService $pdfService)
    {
        $query = $company->incomeBookEntries()
            ->with(['bankAccount', 'invoice.client', 'invoice.currency', 'company'])
            ->orderBy('booking_date', 'asc')
            ->orderBy('entry_number', 'asc');

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('booking_date', [$request->start_date, $request->end_date]);
        }

        $entries = $query->get();

        return $pdfService->download($company, $entries, $request->start_date, $request->end_date);
    }

    #[Endpoint(operationId: 'getIncomeBookEntries', title: 'Get entries', description: 'Display a listing of the resource')]
    public function index(IndexIncomeBookEntryRequest $request, Company $company): AnonymousResourceCollection
    {
        $query = $company->incomeBookEntries()
            ->with(['bankAccount', 'invoice.client', 'invoice.currency'])
            ->orderByDesc('booking_date')
            ->orderByDesc('entry_number');

        $dateRange = null;
        if ($request->filled('year')) {
            $y = (int) $request->year;
            $dateRange = ['from' => "{$y}-01-01", 'to' => "{$y}-12-31"];
        }

        $query
            ->when($request->validated('search'), function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('description', 'like', '%' . $search . '%')
                        ->orWhere('entry_number', 'like', '%' . $search . '%')
                        ->orWhereHas('invoice', function ($invQuery) use ($search) {
                            $invQuery->where('invoice_number', 'like', '%' . $search . '%')
                                ->orWhereHas('client', function ($clientQuery) use ($search) {
                                    $clientQuery->where('name', 'like', '%' . $search . '%');
                                });
                        });
                });
            })
            ->when($request->validated('start_date'), fn ($q, $start) => $q->where('booking_date', '>=', $start))
            ->when($request->validated('end_date'), fn ($q, $end) => $q->where('booking_date', '<=', $end))
            ->when($dateRange, function ($q, $range) {
                $q->whereBetween('booking_date', [$range['from'], $range['to']]);
            });

        return IncomeBookEntryResource::collection($query->paginate(20));
    }

    #[Endpoint(operationId: 'storeIncomeBookEntry', title: 'Store entry', description: 'Store a newly created resource in storage')]
    public function store(StoreIncomeBookEntryRequest $request, Company $company): IncomeBookEntryResource
    {
        $data = $request->validated();

        $used = $company->incomeBookEntries()->pluck('entry_number')->toArray();
        $next = 1;
        while (in_array($next, $used, true)) {
            $next++;
        }
        $data['entry_number'] = $next;

        if (empty($data['payment_date'])) {
            $data['payment_date'] = now()->format('Y-m-d');
        }

        $entry = $company->incomeBookEntries()->create($data);

        return new IncomeBookEntryResource($entry->load(['bankAccount', 'invoice.client', 'invoice.currency']));
    }

    #[Endpoint(operationId: 'showIncomeBookEntry', title: 'Show entry', description: 'Display the specified resource')]
    public function show(Company $company, IncomeBookEntry $incomeBookEntry): IncomeBookEntryResource
    {
        return new IncomeBookEntryResource($incomeBookEntry->load(['bankAccount', 'invoice.client', 'invoice.currency']));
    }

    #[Endpoint(operationId: 'updateIncomeBookEntry', title: 'Update entry', description: 'Update the specified resource in storage')]
    public function update(UpdateIncomeBookEntryRequest $request, Company $company, IncomeBookEntry $incomeBookEntry): IncomeBookEntryResource
    {
        $incomeBookEntry->update($request->validated());

        return new IncomeBookEntryResource($incomeBookEntry->load(['bankAccount', 'invoice.client', 'invoice.currency']));
    }

    #[Endpoint(operationId: 'deleteIncomeBookEntry', title: 'Delete entry', description: 'Remove the specified resource from storage')]
    public function destroy(Company $company, IncomeBookEntry $incomeBookEntry): Response
    {
        $incomeBookEntry->delete();

        return response()->noContent();
    }
}
