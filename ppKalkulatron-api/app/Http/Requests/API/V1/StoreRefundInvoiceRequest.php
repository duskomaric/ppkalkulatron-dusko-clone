<?php

namespace App\Http\Requests\API\V1;

use App\Models\Enums\DocumentStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreRefundInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $invoice = $this->route('invoice');

            if (! $invoice) {
                $validator->errors()->add('invoice', 'Račun nije pronađen.');
                return;
            }

            if ($invoice->status === DocumentStatusEnum::RefundCreated || $invoice->status === DocumentStatusEnum::Refunded) {
                $validator->errors()->add('invoice', 'Storno fakturu nije moguće kreirati iz storno računa.');
            }

            if (! $invoice->originalFiscalRecord()?->fiscal_invoice_number) {
                $validator->errors()->add('invoice', 'Račun mora biti fiskalizovan prije kreiranja storno fakture.');
            }

            if ($invoice->refund_invoice_id) {
                $validator->errors()->add('invoice', 'Storno faktura je već kreirana.');
            }
        });
    }
}
