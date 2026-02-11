<?php

namespace App\Http\Requests\API\V1;

use Illuminate\Foundation\Http\FormRequest;

class SendInvoiceEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'to' => 'required|email',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'attach_pdf' => 'boolean',
            'attach_fiscal_record_ids' => 'sometimes|array',
            'attach_fiscal_record_ids.*' => 'integer|exists:fiscal_records,id',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'attach_pdf' => $this->boolean('attach_pdf', true),
        ]);
    }
}
