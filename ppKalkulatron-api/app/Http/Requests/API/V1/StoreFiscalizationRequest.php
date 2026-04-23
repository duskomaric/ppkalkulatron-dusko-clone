<?php

namespace App\Http\Requests\API\V1;

use App\Models\CompanySetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreFiscalizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'localDeviceResponse' => ['nullable', 'array'],
            'request_id' => ['nullable', 'string', 'max:64'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $company = $this->route('company');
            if (! $company) {
                return;
            }

            $deviceMode = CompanySetting::get('ofs_device_mode', 'cloud', $company->id);
            if ($deviceMode === 'local' && ! $this->filled('localDeviceResponse')) {
                $validator->errors()->add('localDeviceResponse', 'Nedostaje odgovor lokalnog uređaja.');
            }
        });
    }
}
