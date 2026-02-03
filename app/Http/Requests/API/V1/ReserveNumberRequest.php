<?php

namespace App\Http\Requests\API\V1;

use Illuminate\Foundation\Http\FormRequest;

class ReserveNumberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:invoice,proforma,contract,quote',
            'year' => 'nullable|integer|min:2000|max:2100',
        ];
    }

    protected function prepareForValidation(): void
    {
        // For GET requests, merge query parameters into request data
        if ($this->isMethod('GET')) {
            $this->merge([
                'type' => $this->query('type') ?? $this->input('type'),
                'year' => $this->query('year') ?? $this->input('year'),
            ]);
        }
    }
}
