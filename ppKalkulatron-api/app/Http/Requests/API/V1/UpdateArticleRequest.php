<?php

namespace App\Http\Requests\API\V1;

use App\Models\Enums\ArticleTypeEnum;
use App\Models\Enums\TaxRateEnum;
use Illuminate\Foundation\Http\FormRequest;

class UpdateArticleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string|max:1000',
            'prices_meta' => 'sometimes|nullable|array',
            'prices_meta.*' => 'sometimes|numeric|min:0',
            'unit' => 'sometimes|nullable|string|max:10',
            'tax_rate' => 'sometimes|nullable|string|in:' . implode(',', array_column(TaxRateEnum::cases(), 'value')),
            'is_active' => 'sometimes|boolean',
            'type' => 'sometimes|nullable|in:' . implode(',', array_column(ArticleTypeEnum::cases(), 'value')),
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.string' => 'Article name must be a string.',
            'prices_meta.array' => 'Prices must be an array.',
            'prices_meta.*.numeric' => 'All prices must be numeric.',
            'prices_meta.*.min' => 'Prices cannot be negative.',
            'type.in' => 'Type must be one of: goods, services, products.',
        ];
    }
}
