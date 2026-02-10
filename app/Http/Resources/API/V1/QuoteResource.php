<?php

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\API\V1\ClientResource;
use App\Http\Resources\API\V1\BankAccountResource;

class QuoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quote_number' => $this->quote_number,
            'company_id' => $this->company_id,
            'client_id' => $this->client_id,
            'client' => ClientResource::make($this->whenLoaded('client')),
            'status' => $this->status,
            'status_label' => $this->status?->getLabel(),
            'status_color' => $this->status?->getColor(),
            'language' => $this->language,
            'language_label' => $this->language?->getLabel(),
            'date' => $this->date->timezone('Europe/Sarajevo')->format('d.m.Y'),
            'valid_until' => $this->valid_until->timezone('Europe/Sarajevo')->format('d.m.Y'),
            'notes' => $this->notes,
            'currency' => $this->currency,
            'bank_account_id' => $this->bank_account_id,
            'bank_account' => $this->whenLoaded('bankAccount', fn () => BankAccountResource::make($this->bankAccount)),
            'quote_template' => $this->quote_template,
            'quote_template_label' => $this->quote_template?->getLabel(),
            'subtotal' => $this->subtotal,
            'tax_total' => $this->tax_total,
            'discount_total' => $this->discount_total,
            'total' => $this->total,
            'items' => QuoteItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
