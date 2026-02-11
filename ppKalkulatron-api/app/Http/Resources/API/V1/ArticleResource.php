<?php

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'name' => $this->name,
            'description' => $this->description,
            'prices_meta' => $this->prices_meta,
            'unit' => $this->unit,
            'tax_rate' => $this->taxRateEnum() ? [
                'label' => $this->taxRateEnum()->value,
                'rate' => $this->taxRateEnum()->rate(),
            ] : null,
            'is_active' => $this->is_active,
            'type' => $this->type,
            'type_label' => $this->type?->getLabel(),
            'type_color' => $this->type?->getColor(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'company' => CompanyResource::make($this->whenLoaded('company')),
        ];
    }
}
