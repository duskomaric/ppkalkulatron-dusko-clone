<?php

namespace App\Http\Resources\API\V1;

use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'language' => $this->language->value,
            'language_label' => $this->language->getLabel(),
            'role' => [
                'value' => $this->role->value,
                'label' => $this->role->getLabel(),
                'color' => $this->role->getColor(),
            ],
            'is_active' => $this->is_active,
            'last_seen_at' => $this->last_seen_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'companies' => $this->whenLoaded('companies', function () {
                CompanySetting::resolvedMany($this->companies->pluck('id')->all());
                return CompanyResource::collection($this->companies);
            }),
        ];
    }
}
