<?php

namespace App\Http\Requests\API\V1;

use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\LanguageEnum;
use Illuminate\Foundation\Http\FormRequest;

class UpdateQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quote_number' => 'sometimes|string|max:255',
            'client_id' => 'sometimes|exists:clients,id',
            'status' => 'sometimes|in:' . DocumentStatusEnum::Created->value,
            'language' => 'sometimes|in:' . implode(',', array_column(LanguageEnum::cases(), 'value')),
            'date' => 'sometimes|date',
            'valid_until' => 'sometimes|nullable|date|after_or_equal:date',
            'notes' => 'sometimes|nullable|string',
            'currency_id' => 'sometimes|nullable|exists:currencies,id',
            'bank_account_id' => 'sometimes|nullable|exists:bank_accounts,id',
            'quote_template' => 'sometimes|in:' . implode(',', array_column(DocumentTemplateEnum::cases(), 'value')),
            'subtotal' => 'sometimes|integer|min:0',
            'tax_total' => 'sometimes|integer|min:0',
            'discount_total' => 'sometimes|integer|min:0',
            'total' => 'sometimes|integer|min:0',
            'items' => 'sometimes|array',
            'items.*.article_id' => 'sometimes|nullable|exists:articles,id',
            'items.*.name' => 'sometimes|required|string|max:255',
            'items.*.description' => 'sometimes|nullable|string',
            'items.*.quantity' => 'sometimes|required|integer|min:1',
            'items.*.unit_price' => 'sometimes|required|integer|min:0',
            'items.*.subtotal' => 'sometimes|required|integer|min:0',
            'items.*.tax_rate' => 'sometimes|required|integer|min:0|max:10000',
            'items.*.tax_amount' => 'sometimes|required|integer|min:0',
            'items.*.total' => 'sometimes|required|integer|min:0',
        ];
    }
}
