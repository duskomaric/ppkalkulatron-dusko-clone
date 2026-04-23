<?php

namespace App\Http\Requests\API\V1;

use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\LanguageEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class StoreProformaRequest extends FormRequest
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
            'proforma_number' => 'nullable|string|max:255',
            'client_id' => 'required|exists:clients,id',
            'language' => 'required|in:' . implode(',', array_column(LanguageEnum::cases(), 'value')),
            'date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:date',
            'notes' => 'nullable|string',
            'currency_id' => ['nullable', $currencyRule],
            'proforma_template' => 'required|in:' . implode(',', array_column(DocumentTemplateEnum::cases(), 'value')),
            'subtotal' => 'required|integer|min:0',
            'tax_total' => 'required|integer|min:0',
            'discount_total' => 'required|integer|min:0',
            'total' => 'required|integer|min:0',
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

    public function messages(): array
    {
        return [
            'currency_id.exists' => 'Valuta nije pronađena za ovu kompaniju.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $company = $this->route('company');
        if (! $company) {
            return;
        }

        if (! $this->filled('currency_id')) {
            $currency = $company->currencies()->where('is_default', true)->first()
                ?? $company->currencies()->first();

            if (! $currency) {
                throw ValidationException::withMessages([
                    'currency_id' => 'Nema konfigurisane valute za ovu kompaniju.',
                ]);
            }

            $this->merge(['currency_id' => $currency->id]);
        }
    }
}
