<?php

namespace App\Http\Requests\API\V1;

use Illuminate\Foundation\Http\FormRequest;

class EnterFiscalPinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // OFS odbija sve što nije 4 cifre kodovima 2800 / 2806.
            'pin' => ['required', 'digits:4'],
        ];
    }

    public function messages(): array
    {
        return [
            'pin.digits' => 'PIN sigurnosnog elementa je 4 cifre.',
        ];
    }
}
