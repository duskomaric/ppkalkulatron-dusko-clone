<?php

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'contract_number' => $this->contract_number,
            'company_id' => $this->company_id,
            'client_id' => $this->client_id,
            'status' => $this->status,
            'status_label' => $this->status?->getLabel(),
            'status_color' => $this->status?->getColor(),
            'language' => $this->language,
            'language_label' => $this->language?->getLabel(),
            'date' => $this->date,
            'due_date' => $this->due_date,
            'notes' => $this->notes,
            'source_type' => $this->source_type,
            'source_id' => $this->source_id,
            'currency' => $this->currency,
            'contract_template' => $this->contract_template,
            'contract_template_label' => $this->contract_template?->getLabel(),
            'file_paths' => $this->file_paths,
            'files_count' => $this->files_count,
            'subtotal' => $this->subtotal,
            'tax_total' => $this->tax_total,
            'discount_total' => $this->discount_total,
            'total' => $this->total,
            'items' => ContractItemResource::collection($this->whenLoaded('items')),
            'source' => QuoteResource::make($this->whenLoaded('source')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
