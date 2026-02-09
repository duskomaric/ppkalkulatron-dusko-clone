<?php

namespace App\Services;

use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\DocumentCounter;
use Illuminate\Support\Facades\DB;

class DocumentNumberService
{
    /**
     * Get the next number without incrementing (preview)
     */
    public function getNextNumber(Company $company, string $type, ?int $year = null): array
    {
        $year = $this->resolveYear($company, $type, $year);

        $counter = DocumentCounter::where('company_id', $company->id)
            ->where('type', $type)
            ->where('year', $year)
            ->first();

        $startingNumber = $this->getStartingNumber($company, $type);
        $nextNumber = $counter ? $counter->getNextNumber() : $startingNumber;
        $formatted = $this->formatNumber($company, $type, $year, $nextNumber);

        return [
            'number' => $nextNumber,
            'formatted' => $formatted,
        ];
    }

    /**
     * Reserve the next number (increment counter)
     */
    public function reserveNumber(Company $company, string $type, ?int $year = null): array
    {
        $year = $this->resolveYear($company, $type, $year);

        return DB::transaction(function () use ($company, $type, $year) {
            $counter = DocumentCounter::lockForUpdate()
                ->where('company_id', $company->id)
                ->where('type', $type)
                ->where('year', $year)
                ->first();

            $startingNumber = $this->getStartingNumber($company, $type);
            if (!$counter) {
                $counter = DocumentCounter::create([
                    'company_id' => $company->id,
                    'type' => $type,
                    'year' => $year,
                    'last_number' => $startingNumber - 1,
                ]);
            }

            $nextNumber = $counter->incrementCounter();
            $formatted = $this->formatNumber($company, $type, $year, $nextNumber);

            return [
                'number' => $nextNumber,
                'formatted' => $formatted,
            ];
        });
    }

    protected function resolveYear(Company $company, string $type, ?int $year): int
    {
        $resetYearly = $type === 'invoice'
            ? CompanySetting::get('invoice_numbering_reset_yearly', true, $company->id)
            : true;

        if (!$resetYearly) {
            return 0;
        }

        return $year ?? (int) date('Y');
    }

    protected function getStartingNumber(Company $company, string $type): int
    {
        if ($type !== 'invoice') {
            return 1;
        }

        return (int) CompanySetting::get('invoice_numbering_starting_number', 1, $company->id);
    }

    /**
     * Format the document number using CompanySettings for invoice
     */
    protected function formatNumber(Company $company, string $type, int $year, int $number): string
    {
        $padZeros = 3;
        $prefix = strtoupper(substr($type, 0, 3));

        if ($type === 'invoice') {
            $prefix = (string) CompanySetting::get('invoice_numbering_prefix', '', $company->id) ?: 'INV';
            $padZeros = (int) CompanySetting::get('invoice_numbering_pad_zeros', 4, $company->id);
        } else {
            $prefix = match ($type) {
                'proforma' => 'PRO',
                'contract' => 'CON',
                'quote' => 'QUO',
                default => $prefix,
            };
        }

        $padded = str_pad((string) $number, max(1, $padZeros), '0', STR_PAD_LEFT);

        return $year > 0
            ? sprintf('%s-%d-%s', $prefix, $year, $padded)
            : sprintf('%s-%s', $prefix, $padded);
    }
}
