<?php

namespace App\Http\Requests\API\V1;

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
            'client_id' => 'required|exists:clients,id',
            'status' => 'nullable|in:draft,sent,paid,cancelled,partial,overdue',
            'language' => 'nullable|in:en,sr-Latn,sr-Cyrl,fr,de,it,ru',
            'date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:date',
            'notes' => 'nullable|string',
            'is_recurring' => 'nullable|boolean',
            'frequency' => 'nullable|in:weekly,monthly,quarterly,yearly',
            'next_invoice_date' => 'nullable|date|required_if:is_recurring,true',
            'currency' => 'nullable|string|max:3',
            'invoice_template' => 'nullable|in:classic,modern,minimal',
            'subtotal' => 'nullable|integer|min:0',
            'tax_total' => 'nullable|integer|min:0',
            'discount_total' => 'nullable|integer|min:0',
            'total' => 'nullable|integer|min:0',
            'items' => 'nullable|array',
            'items.*.article_id' => 'nullable|exists:articles,id',
            'items.*.name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|integer|min:0',
            'items.*.subtotal' => 'required|integer|min:0',
            'items.*.tax_rate' => 'required|integer|min:0|max:10000',
            'items.*.tax_amount' => 'required|integer|min:0',
            'items.*.total' => 'required|integer|min:0',
        ];
    }
}
