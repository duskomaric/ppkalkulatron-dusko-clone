<?php

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'company_id' => $this->company_id,
            'client_id' => $this->client_id,
            'status' => $this->status,
            'status_label' => $this->status?->getLabel(),
            'status_color' => $this->status?->getColor(),
            'language' => $this->language,
            'language_label' => $this->language?->getLabel(),
            'date' => $this->date->timezone('Europe/Sarajevo')->format('d.m.Y'),
            'due_date' => $this->due_date->timezone('Europe/Sarajevo')->format('d.m.Y'),
            'notes' => $this->notes,
            'is_recurring' => $this->is_recurring,
            'frequency' => $this->frequency,
            'frequency_label' => $this->frequency?->getLabel(),
            'next_invoice_date' => $this->next_invoice_date,
            'parent_id' => $this->parent_id,
            'refund_invoice_id' => $this->refund_invoice_id,
            'refund_invoice_number' => $this->whenLoaded('refundInvoice', fn () => $this->refundInvoice?->invoice_number),
            'original_invoice_id' => $this->whenLoaded('originalInvoice', fn () => $this->originalInvoice?->id),
            'original_invoice_number' => $this->whenLoaded('originalInvoice', fn () => $this->originalInvoice?->invoice_number),
            'original_fiscal_invoice_number' => $this->whenLoaded('originalInvoice', fn () => $this->originalInvoice?->fiscal_invoice_number),
            'original_fiscalized_at' => $this->whenLoaded('originalInvoice', fn () => $this->originalInvoice?->fiscalized_at?->format('Y-m-d\TH:i:s')),
            'source_type' => $this->source_type,
            'source_id' => $this->source_id,
            'currency' => $this->currencyRelation?->code ?? $this->currency,
            'currency_id' => $this->currency_id,
            'bank_account_id' => $this->bank_account_id,
            'bank_account' => $this->whenLoaded('bankAccount', fn () => BankAccountResource::make($this->bankAccount)),
            'invoice_template' => $this->invoice_template,
            'invoice_template_label' => $this->invoice_template?->getLabel(),
            'payment_type' => $this->payment_type?->value,
            'payment_type_label' => $this->payment_type?->label(),
            'fiscal_invoice_number' => $this->fiscal_invoice_number,
            'fiscal_counter' => $this->fiscal_counter,
            'fiscal_verification_url' => $this->fiscal_verification_url,
            'fiscalized_at' => $this->fiscalized_at,
            'fiscal_meta' => $this->fiscal_meta,
            'fiscal_receipt_image_path' => $this->fiscal_receipt_image_path,
            'fiscal_records' => FiscalRecordResource::collection(
                $this->whenLoaded('fiscalRecords', fn () => $this->fiscalRecords->sortBy(fn ($r) => $r->fiscalized_at?->format('Y-m-d H:i:s') ?? '9999'))
            ),
            'subtotal' => $this->subtotal,
            'tax_total' => $this->tax_total,
            'discount_total' => $this->discount_total,
            'total' => $this->total,
            'items' => InvoiceItemResource::collection($this->whenLoaded('items')),
            'client' => $this->whenLoaded('client', function () {
                return ClientResource::make($this->client);
            }),
            'source' => $this->whenLoaded('source', function () {
                return match ($this->source_type) {
                    'App\Models\Proforma' => ProformaResource::make($this->source),
                    'App\Models\Contract' => ContractResource::make($this->source),
                    default => null,
                };
            }),
            'parent' => InvoiceResource::make($this->whenLoaded('parent')),
            'children' => InvoiceResource::collection($this->whenLoaded('children')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
