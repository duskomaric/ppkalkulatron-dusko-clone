<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IncomeBookEntryResource extends JsonResource
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
            'entry_number' => $this->entry_number,
            'booking_date' => $this->booking_date ? $this->booking_date->format('Y-m-d') : null,
            'description' => $this->description,
            'amount_services' => $this->amount_services,
            'amount_goods' => $this->amount_goods,
            'amount_products' => $this->amount_products,
            'amount_other_income' => $this->amount_other_income,
            'amount_financial_income' => $this->amount_financial_income,
            'total_amount' => $this->total_amount,
            'vat_amount' => $this->vat_amount,
            
            // Bank info
            'bank_account' => new BankAccountResource($this->whenLoaded('bankAccount')),
            'bank_account_id' => $this->bank_account_id,
            'payment_date' => $this->payment_date ? $this->payment_date->format('Y-m-d') : null,
            
            // Related invoice
            'invoice' => new InvoiceResource($this->whenLoaded('invoice')),
            'invoice_id' => $this->invoice_id,
            
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
