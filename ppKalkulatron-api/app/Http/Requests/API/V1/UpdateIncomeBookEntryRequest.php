<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateIncomeBookEntryRequest extends FormRequest
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
            'entry_number' => ['required', 'integer', 'min:1'],
            'booking_date' => ['required', 'date'],
            'bank_account_id' => ['present', 'nullable', 'integer', 'exists:bank_accounts,id'],
            'payment_date' => ['present', 'nullable', 'date'],
            'description' => ['required', 'string', 'max:255'],
            'invoice_id' => ['present', 'nullable', 'integer', 'exists:invoices,id'],
            'amount_services' => ['required', 'integer', 'min:0'],
            'amount_goods' => ['required', 'integer', 'min:0'],
            'amount_products' => ['required', 'integer', 'min:0'],
            'amount_other_income' => ['required', 'integer', 'min:0'],
            'amount_financial_income' => ['required', 'integer', 'min:0'],
            'total_amount' => ['required', 'integer', 'min:0'],
            'vat_amount' => ['required', 'integer', 'min:0'],
        ];
    }
}
