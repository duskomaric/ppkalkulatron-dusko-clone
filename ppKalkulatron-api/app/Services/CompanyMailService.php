<?php

namespace App\Services;

use App\Models\Company;
use App\Models\CompanySetting;
use Illuminate\Contracts\Mail\Mailer;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class CompanyMailService
{
    public function resolveFrom(Company $company): array
    {
        $fromAddress = CompanySetting::get('mail_from_address', null, $company->id)
            ?: config('mail.from.address');
        $fromName = CompanySetting::get('mail_from_name', null, $company->id)
            ?: config('mail.from.name');

        return [$fromAddress, $fromName];
    }

    public function resolveMailer(Company $company): ?Mailer
    {
        $mailHost = CompanySetting::get('mail_host', null, $company->id);
        if (! $mailHost) {
            return null;
        }

        $mailerName = 'company_smtp_' . $company->id;

        config([
            'mail.mailers.' . $mailerName => [
                'transport' => 'smtp',
                'host' => $mailHost,
                'port' => (int) (CompanySetting::get('mail_port', 587, $company->id) ?: 587),
                'encryption' => CompanySetting::get('mail_encryption', null, $company->id) ?: null,
                'username' => CompanySetting::get('mail_username', null, $company->id) ?: null,
                'password' => CompanySetting::get('mail_password', null, $company->id) ?: null,
                'timeout' => null,
            ],
        ]);

        return Mail::mailer($mailerName);
    }

    public function send(Company $company, string|array $to, Mailable $mailable): void
    {
        $mailer = $this->resolveMailer($company);

        if ($mailer) {
            $mailer->to($to)->send($mailable);
            return;
        }

        Mail::to($to)->send($mailable);
    }

    public function createTempPdfPath(): string
    {
        return storage_path('app/private/temp-' . Str::random(16) . '.pdf');
    }

    public function cleanupTempFile(?string $path): void
    {
        if ($path && file_exists($path)) {
            @unlink($path);
        }
    }
}
