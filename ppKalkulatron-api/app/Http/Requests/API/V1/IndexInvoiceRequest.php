<?php

namespace App\Http\Requests\API\V1;

use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\FiscalPaymentTypeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexInvoiceRequest extends FormRequest
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
            'payment_type' => ['nullable', Rule::in(array_column(FiscalPaymentTypeEnum::cases(), 'value'))],
            'created_from' => ['nullable', 'date'],
            'created_to' => ['nullable', 'date'],
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
