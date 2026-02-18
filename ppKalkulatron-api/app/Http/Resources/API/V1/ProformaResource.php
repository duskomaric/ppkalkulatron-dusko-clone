<?php

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\API\V1\ClientResource;
use App\Http\Resources\API\V1\BankAccountResource;
use App\Http\Resources\API\V1\CurrencyResource;

class ProformaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'proforma_number' => $this->proforma_number,
            'company_id' => $this->company_id,
            'client_id' => $this->client_id,
            'client' => ClientResource::make($this->whenLoaded('client')),
            'status' => $this->status,
            'status_label' => $this->status?->getLabel(),
            'status_color' => $this->status?->getColor(),
            'language' => $this->language,
            'language_label' => $this->language?->getLabel(),
            'date' => $this->date->timezone('Europe/Sarajevo')->format('d.m.Y'),
            'due_date' => $this->due_date->timezone('Europe/Sarajevo')->format('d.m.Y'),
            'notes' => $this->notes,
            'source_type' => $this->source_type,
            'source_id' => $this->source_id,
            'currency_id' => $this->currency_id,
            'currency' => $this->currency?->code ?? null,
            'currency_relation' => $this->whenLoaded('currency', fn () => CurrencyResource::make($this->currency)),
            'bank_account_id' => $this->bank_account_id,
            'bank_account' => $this->whenLoaded('bankAccount', fn () => BankAccountResource::make($this->bankAccount)),
            'proforma_template' => $this->proforma_template,
            'proforma_template_label' => $this->proforma_template?->getLabel(),
            'subtotal' => $this->subtotal,
            'tax_total' => $this->tax_total,
            'discount_total' => $this->discount_total,
            'total' => $this->total,
            'items' => ProformaItemResource::collection($this->whenLoaded('items')),
            'source' => QuoteResource::make($this->whenLoaded('source')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
