<?php

namespace App\Http\Requests\API\V1;

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

            $layout = $settings['ofs_receipt_layout'] ?? null;
            $format = $settings['ofs_receipt_image_format'] ?? null;

            if (!$layout || !$format) {
                return;
            }

            $allowed = $layout === 'Invoice'
                ? ['Pdf', 'Html']
                : ['Png', 'Pdf', 'Html'];

            if (!in_array($format, $allowed, true)) {
                $validator->errors()->add(
                    'settings.ofs_receipt_image_format',
                    "Invalid receipt image format '{$format}' for layout '{$layout}'."
                );
            }
        });
    }
}
