<?php

namespace App\Http\Requests\API\V1;

use App\Models\Enums\DocumentFrequencyEnum;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\FiscalPaymentTypeEnum;
use App\Models\Enums\LanguageEnum;
use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invoice_number' => 'nullable|string|max:255',
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'status' => 'nullable|in:' . implode(',', array_column(DocumentStatusEnum::cases(), 'value')),
            'language' => 'required|in:' . implode(',', array_column(LanguageEnum::cases(), 'value')),
            'date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:date',
            'notes' => 'nullable|string',
            'is_recurring' => 'nullable|boolean',
            'frequency' => 'nullable|in:' . implode(',', array_column(DocumentFrequencyEnum::cases(), 'value')),
            'next_invoice_date' => 'nullable|date|required_if:is_recurring,true',
            'currency' => 'required|string|size:3',
            'currency_id' => 'nullable|exists:currencies,id',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'invoice_template' => 'required|in:' . implode(',', array_column(DocumentTemplateEnum::cases(), 'value')),
            'payment_type' => 'required|in:' . implode(',', array_column(FiscalPaymentTypeEnum::cases(), 'value')),
            'subtotal' => 'required|integer|min:0',
            'tax_total' => 'required|integer|min:0',
            'discount_total' => 'required|integer|min:0',
            'total' => 'required|integer|min:0',
            'items' => 'required|array|min:1',
            'items.*.article_id' => 'nullable|exists:articles,id',
            'items.*.name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|integer|min:0',
            'items.*.subtotal' => 'required|integer|min:0',
            'items.*.tax_rate' => 'required|integer|min:0|max:10000',
            'items.*.tax_label' => 'nullable|string|max:4',
            'items.*.tax_amount' => 'required|integer|min:0',
            'items.*.total' => 'required|integer|min:0',
        ];
    }
}
