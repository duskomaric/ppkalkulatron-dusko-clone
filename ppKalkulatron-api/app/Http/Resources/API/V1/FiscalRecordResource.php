<?php

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FiscalRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type?->value,
            'type_label' => $this->type?->getLabel(),
            'fiscal_invoice_number' => $this->fiscal_invoice_number,
            'fiscal_counter' => $this->fiscal_counter,
            'request_id' => $this->request_id,
            'verification_url' => $this->verification_url,
            'fiscalized_at' => $this->fiscalized_at?->timezone('Europe/Sarajevo')->format('d.m.Y H:i'),
            'fiscal_receipt_image_path' => $this->fiscal_receipt_image_path,
        ];
    }
}
