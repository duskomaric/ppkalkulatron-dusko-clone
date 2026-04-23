<?php

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BankAccountResource extends JsonResource
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
            'bank_name' => $this->bank_name,
            'account_number' => $this->account_number,
            'swift' => $this->swift,
            'show_on_documents' => $this->show_on_documents,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
