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
            ? CompanySetting::get('document_numbering_reset_yearly', true, $company->id)
            : true;

        if (!$resetYearly) {
            return 0;
        }

        return $year ?? (int) date('Y');
    }

    protected function getStartingNumber(Company $company, string $type): int
    {
        $key = match ($type) {
            'invoice' => 'invoice_numbering_starting_number',
            'quote' => 'quote_numbering_starting_number',
            'proforma' => 'proforma_numbering_starting_number',
            default => null,
        };

        if ($key === null) {
            return 1;
        }

        return max(1, (int) CompanySetting::get($key, 1, $company->id));
    }

    /**
     * Get prefix for document type (trimmed, empty string if not set).
     * Format: PREFIX-broj/godina or broj/godina if no prefix.
     */
    protected function getPrefix(Company $company, string $type): string
    {
        $key = match ($type) {
            'invoice' => 'invoice_numbering_prefix',
            'quote' => 'quote_numbering_prefix',
            'proforma' => 'proforma_numbering_prefix',
            default => null,
        };

        if ($key === null) {
            return '';
        }

        $value = (string) CompanySetting::get($key, '', $company->id);
        // Backward compat: invoice can fall back to document_numbering_prefix
        if ($type === 'invoice' && $value === '') {
            $value = (string) CompanySetting::get('document_numbering_prefix', '', $company->id);
        }

        return trim($value);
    }

    /**
     * Format the document number: PREFIX-broj/godina or broj/godina if no prefix.
     */
    protected function formatNumber(Company $company, string $type, int $year, int $number): string
    {
        $padZeros = (int) CompanySetting::get('document_numbering_pad_zeros', 4, $company->id);
        $padZeros = max(1, $padZeros);
        $padded = str_pad((string) $number, $padZeros, '0', STR_PAD_LEFT);

        $part = $year > 0
            ? $padded . '/' . $year
            : $padded;

        $prefix = $this->getPrefix($company, $type);

        return $prefix !== ''
            ? $prefix . '-' . $part
            : $part;
    }
}
