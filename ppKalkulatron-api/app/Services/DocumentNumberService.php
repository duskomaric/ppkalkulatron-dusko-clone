<?php

namespace App\Services;

use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\DocumentCounter;
use Carbon\Carbon;
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

    /**
     * Release a document number when a document is deleted.
     * If the deleted document had the last reserved number for that year, the counter is decremented
     * so the next created document reuses that number (e.g. delete 007 → next invoice gets 007).
     */
    public function releaseNumber(Company $company, string $type, string $formattedNumber): void
    {
        $parsed = $this->parseFormattedNumber($formattedNumber);
        if ($parsed === null) {
            return;
        }

        ['number' => $number, 'year' => $year] = $parsed;
        $year = $this->resolveYear($company, $type, $year);

        DB::transaction(function () use ($company, $type, $year, $number) {
            $counter = DocumentCounter::lockForUpdate()
                ->where('company_id', $company->id)
                ->where('type', $type)
                ->where('year', $year)
                ->first();

            if ($counter && $counter->last_number === $number) {
                $counter->last_number--;
                $counter->save();
            }
        });
    }

    /**
     * Parse formatted number (e.g. "007/2025" or "INV-007/2025") to ['number' => int, 'year' => int] or null.
     */
    protected function parseFormattedNumber(string $formatted): ?array
    {
        $formatted = trim($formatted);
        if ($formatted === '') {
            return null;
        }

        $parts = explode('/', $formatted);
        if (count($parts) < 2) {
            return null;
        }

        $year = (int) end($parts);
        $numberPart = (string) $parts[0];
        if (str_contains($numberPart, '-')) {
            $numberPart = substr($numberPart, strrpos($numberPart, '-') + 1);
        }
        $number = (int) $numberPart;

        if ($number < 1) {
            return null;
        }

        return ['number' => $number, 'year' => $year];
    }

    /**
     * Extract year from a date string (YYYY-MM-DD, d.m.Y, or any Carbon-parsable format).
     */
    public static function yearFromDate(string $date): int
    {
        return (int) Carbon::parse($date)->format('Y');
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

        return trim((string) CompanySetting::get($key, '', $company->id));
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
