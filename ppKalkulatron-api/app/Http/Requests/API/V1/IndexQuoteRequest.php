<?php

namespace App\Http\Requests\API\V1;

use App\Models\Enums\DocumentStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string'],
            'status' => ['nullable', Rule::in(array_column(DocumentStatusEnum::cases(), 'value'))],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
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
