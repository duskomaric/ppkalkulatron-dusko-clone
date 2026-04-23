<?php

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'article_id' => $this->article_id,
            'name' => $this->name,
            'description' => $this->description,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'subtotal' => $this->subtotal,
            'tax_rate' => $this->tax_rate,
            'tax_label' => $this->tax_label,
            'tax_amount' => $this->tax_amount,
            'total' => $this->total,
            'unit_price_bam' => $this->unit_price_bam,
            'subtotal_bam' => $this->subtotal_bam,
            'tax_amount_bam' => $this->tax_amount_bam,
            'total_bam' => $this->total_bam,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'article' => ArticleResource::make($this->whenLoaded('article')),
        ];
    }
}
