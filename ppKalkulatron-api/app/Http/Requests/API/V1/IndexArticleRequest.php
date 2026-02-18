<?php

namespace App\Http\Requests\API\V1;

use App\Models\Enums\ArticleTypeEnum;
use App\Models\Enums\TaxRateEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $taxRates = array_map(fn (TaxRateEnum $e) => $e->value, TaxRateEnum::cases());
        $taxRates[] = 'none';

        return [
            'search' => ['nullable', 'string'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'type' => ['nullable', Rule::in(array_column(ArticleTypeEnum::cases(), 'value'))],
            'tax_rate' => ['nullable', Rule::in($taxRates)],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('search')) {
            $search = trim((string) $this->input('search'));
            $this->merge(['search' => $search !== '' ? $search : null]);
        }
    }
}
