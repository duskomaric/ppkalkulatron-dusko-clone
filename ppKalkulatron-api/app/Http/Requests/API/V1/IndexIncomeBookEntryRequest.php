<?php

namespace App\Http\Requests\API\V1;

use Illuminate\Foundation\Http\FormRequest;

class IndexIncomeBookEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
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
