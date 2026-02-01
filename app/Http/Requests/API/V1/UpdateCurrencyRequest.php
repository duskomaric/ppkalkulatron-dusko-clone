<?php

namespace App\Http\Requests\API\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCurrencyRequest extends FormRequest
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
        $companyId = $this->route('company')?->id;
        $currencyId = $this->route('currency')?->id;

        return [
            'code' => 'sometimes|string|size:3|unique:currencies,code,' . $currencyId . ',id,company_id,' . $companyId,
            'prefix' => 'sometimes|nullable|string|max:10',
            'name' => 'sometimes|string|max:255',
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
            'code.size' => 'Currency code must be exactly 3 characters.',
        ];
    }
}
