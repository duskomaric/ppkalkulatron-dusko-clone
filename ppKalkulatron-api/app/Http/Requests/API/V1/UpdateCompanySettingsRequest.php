<?php

namespace App\Http\Requests\API\V1;

use App\Models\CompanySetting;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCompanySettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'settings' => 'required|array',
            // Allow passthrough of all company setting keys, while keeping strict validation for fiscal fields below.
            'settings.*' => 'nullable',
            'settings.ofs_receipt_layout' => 'sometimes|nullable|in:Slip,Invoice',
            'settings.ofs_receipt_image_format' => 'sometimes|nullable|in:Png,Pdf,Html',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $settings = $this->input('settings', []);
            if (!is_array($settings)) {
                return;
            }

            $company = $this->route('company');

            // Layout and format can arrive in separate requests. Checking only when both are
            // present let "Invoice" be saved on top of a stored "Png" — a combination the device
            // answers with a blank one-pixel receipt — so fall back to what is stored.
            $layout = $settings['ofs_receipt_layout']
                ?? ($company ? CompanySetting::get('ofs_receipt_layout', 'Slip', $company->id) : null);
            $format = $settings['ofs_receipt_image_format']
                ?? ($company ? CompanySetting::get('ofs_receipt_image_format', 'Png', $company->id) : null);

            if (!$layout || !$format) {
                return;
            }

            $allowed = CompanySetting::allowedReceiptImageFormats($layout);

            if (!in_array($format, $allowed, true)) {
                $key = array_key_exists('ofs_receipt_image_format', $settings)
                    ? 'settings.ofs_receipt_image_format'
                    : 'settings.ofs_receipt_layout';

                $validator->errors()->add($key, sprintf(
                    'Layout "%s" ne podržava format "%s". Dozvoljeno: %s.',
                    $layout,
                    $format,
                    implode(', ', $allowed),
                ));
            }
        });
    }
}
