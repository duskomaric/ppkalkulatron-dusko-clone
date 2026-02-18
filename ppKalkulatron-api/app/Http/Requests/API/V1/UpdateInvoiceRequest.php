<?php

namespace App\Http\Requests\API\V1;

use App\Models\Enums\DocumentFrequencyEnum;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\FiscalPaymentTypeEnum;
use App\Models\Enums\LanguageEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $company = $this->route('company');
        $currencyRule = Rule::exists('currencies', 'id');
        if ($company) {
            $currencyRule = $currencyRule->where('company_id', $company->id);
        }

        return [
            'invoice_number' => 'sometimes|string|max:255',
            'client_id' => 'sometimes|nullable|exists:clients,id',
            'status' => 'sometimes|in:' . implode(',', array_column(DocumentStatusEnum::cases(), 'value')),
            'language' => 'sometimes|in:' . implode(',', array_column(LanguageEnum::cases(), 'value')),
            'date' => 'sometimes|date',
            'due_date' => 'sometimes|date|after_or_equal:date',
            'notes' => 'sometimes|nullable|string',
            'is_recurring' => 'sometimes|boolean',
            'frequency' => 'sometimes|nullable|in:' . implode(',', array_column(DocumentFrequencyEnum::cases(), 'value')),
            'next_invoice_date' => 'sometimes|nullable|date',
            'currency' => 'sometimes|string|size:3',
            'currency_id' => ['sometimes', 'nullable', $currencyRule],
            'bank_account_id' => 'sometimes|nullable|exists:bank_accounts,id',
            'invoice_template' => 'sometimes|in:' . implode(',', array_column(DocumentTemplateEnum::cases(), 'value')),
            'payment_type' => 'sometimes|in:' . implode(',', array_column(FiscalPaymentTypeEnum::cases(), 'value')),
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
            'items.*.tax_label' => 'sometimes|nullable|string|max:4',
            'items.*.tax_amount' => 'sometimes|required|integer|min:0',
            'items.*.total' => 'sometimes|required|integer|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'currency_id.exists' => 'Valuta nije pronađena za ovu kompaniju.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('client_id') && (string) $this->input('client_id') === '0') {
            $this->merge(['client_id' => null]);
        }
    }
}
