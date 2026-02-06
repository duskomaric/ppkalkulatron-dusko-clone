<?php

namespace App\Http\Requests\API\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreCurrencyRequest extends FormRequest
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

        return [
            'code' => 'required|string|size:3|unique:currencies,code,NULL,id,company_id,' . $companyId,
            'symbol' => 'required|string|max:10',
            'name' => 'required|string|max:255',
            'is_default' => 'sometimes|boolean',
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
            'code.required' => 'Currency code is required.',
            'code.size' => 'Currency code must be exactly 3 characters.',
            'name.required' => 'Currency name is required.',
        ];
    }
}
