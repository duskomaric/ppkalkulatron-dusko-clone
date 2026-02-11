<?php

namespace App\Http\Requests\API\V1;

use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\LanguageEnum;
use Illuminate\Foundation\Http\FormRequest;

class StoreContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contract_number' => 'nullable|string|max:255',
            'client_id' => 'required|exists:clients,id',
            'status' => 'nullable|in:draft,sent,paid,cancelled,partial,overdue',
            'language' => 'nullable|in:' . implode(',', array_column(LanguageEnum::cases(), 'value')),
            'date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:date',
            'notes' => 'nullable|string',
            'currency' => 'nullable|string|max:3',
            'contract_template' => 'nullable|in:' . implode(',', array_column(DocumentTemplateEnum::cases(), 'value')),
            'subtotal' => 'nullable|integer|min:0',
            'tax_total' => 'nullable|integer|min:0',
            'discount_total' => 'nullable|integer|min:0',
            'total' => 'nullable|integer|min:0',
            'items' => 'nullable|array',
            'items.*.article_id' => 'nullable|exists:articles,id',
            'items.*.name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|integer|min:0',
            'items.*.subtotal' => 'required|integer|min:0',
            'items.*.tax_rate' => 'required|integer|min:0|max:10000',
            'items.*.tax_amount' => 'required|integer|min:0',
            'items.*.total' => 'required|integer|min:0',
        ];
    }
}
