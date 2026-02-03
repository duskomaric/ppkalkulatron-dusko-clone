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
            'source_type' => $this->source_type,
            'source_id' => $this->source_id,
            'currency' => $this->currency,
            'invoice_template' => $this->invoice_template,
            'invoice_template_label' => $this->invoice_template?->getLabel(),
            'is_fiscalized' => $this->is_fiscalized,
            'fiscal_invoice_number' => $this->fiscal_invoice_number,
            'fiscal_counter' => $this->fiscal_counter,
            'fiscal_verification_url' => $this->fiscal_verification_url,
            'fiscalized_at' => $this->fiscalized_at,
            'fiscal_meta' => $this->fiscal_meta,
            'subtotal' => $this->subtotal,
            'tax_total' => $this->tax_total,
            'discount_total' => $this->discount_total,
            'total' => number_format($this->total/100, 2),
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
