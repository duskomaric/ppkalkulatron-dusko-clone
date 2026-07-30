<?php

namespace App\Services;

use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Contract;
use App\Models\DocumentCounter;
use App\Models\Invoice;
use App\Models\Proforma;
use App\Models\Quote;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

/**
 * Document numbering.
 *
 * The existing documents are the source of truth, not the counter:
 *
 *   next = max(last reserved number, highest number in use, starting number - 1) + 1
 *
 * - no documents for the year          -> starting number from company settings
 * - documents exist                    -> highest number in use + 1
 * - a document is deleted              -> the counter is re-synced to what is still in use,
 *                                         so the freed number is handed out again
 *
 * The counter row (document_counters) stays in the formula so that a number handed out by a
 * concurrent request is not handed out twice before that request has inserted its document.
 */
class DocumentNumberService
{
    /** Supported types => [model, column holding the formatted number]. */
    protected const TYPES = [
        'invoice' => [Invoice::class, 'invoice_number'],
        'proforma' => [Proforma::class, 'proforma_number'],
        'quote' => [Quote::class, 'quote_number'],
        'contract' => [Contract::class, 'contract_number'],
    ];

    /**
     * Get the next number without reserving it (preview).
     */
    public function getNextNumber(Company $company, string $type, ?int $year = null): array
    {
        $year = $this->resolveYear($company, $type, $year);
        $lastReserved = (int) DocumentCounter::where('company_id', $company->id)
            ->where('type', $type)
            ->where('year', $year)
            ->value('last_number');

        return $this->result($company, $type, $year, $this->nextNumber($company, $type, $year, $lastReserved));
    }

    /**
     * Reserve the next number (advances the counter).
     */
    public function reserveNumber(Company $company, string $type, ?int $year = null): array
    {
        $year = $this->resolveYear($company, $type, $year);
        $this->ensureCounter($company, $type, $year);

        return DB::transaction(function () use ($company, $type, $year) {
            $counter = $this->lockCounter($company, $type, $year);
            $number = $this->nextNumber($company, $type, $year, $counter->last_number);

            $counter->last_number = $number;
            $counter->save();

            return $this->result($company, $type, $year, $number);
        });
    }

    /**
     * Release the number of a deleted document.
     *
     * Re-syncs the counter to the numbers still in use, so deleting the highest document hands
     * that number out again and deleting all of them starts over from the configured starting
     * number. A gap in the middle of the series is left alone — only the tail is reused.
     *
     * Must be called *after* the document row is deleted.
     */
    public function releaseNumber(Company $company, string $type, string $formattedNumber): void
    {
        if (! array_key_exists($type, self::TYPES)) {
            return;
        }

        $parsed = $this->parseFormattedNumber($formattedNumber);
        $year = $this->resolveYear($company, $type, $parsed['year'] ?? null);
        $this->ensureCounter($company, $type, $year);

        DB::transaction(function () use ($company, $type, $year) {
            $counter = $this->lockCounter($company, $type, $year);
            $counter->last_number = $this->floor($company, $type, $year);
            $counter->save();
        });
    }

    /**
     * next = max(last reserved, highest in use, starting - 1) + 1
     */
    protected function nextNumber(Company $company, string $type, int $year, int $lastReserved): int
    {
        return max($lastReserved, $this->floor($company, $type, $year)) + 1;
    }

    /**
     * The number the series may not fall below: the highest number still in use, or
     * (starting number - 1) when nothing is in use.
     */
    protected function floor(Company $company, string $type, int $year): int
    {
        return max(
            $this->maxUsedNumber($company, $type, $year) ?? 0,
            $this->getStartingNumber($company, $type) - 1,
        );
    }

    /**
     * Highest sequence number currently used by a document of this type/year, or null if none.
     */
    protected function maxUsedNumber(Company $company, string $type, int $year): ?int
    {
        [$model, $column] = self::TYPES[$type] ?? [null, null];
        if ($model === null) {
            return null;
        }

        $resetsYearly = $this->resetsYearly($company);
        $currentYear = (int) date('Y');
        $max = null;

        $numbers = $model::query()
            ->where('company_id', $company->id)
            ->whereNotNull($column)
            ->pluck($column);

        foreach ($numbers as $formatted) {
            $parsed = $this->parseFormattedNumber((string) $formatted);
            if ($parsed === null) {
                continue;
            }

            $bucket = $resetsYearly ? ($parsed['year'] ?? $currentYear) : 0;
            if ($bucket !== $year) {
                continue;
            }

            if ($max === null || $parsed['number'] > $max) {
                $max = $parsed['number'];
            }
        }

        return $max;
    }

    /**
     * Make sure the counter row exists before opening the transaction that locks it, so a
     * concurrent insert of the same row cannot abort our transaction.
     */
    protected function ensureCounter(Company $company, string $type, int $year): void
    {
        $attributes = [
            'company_id' => $company->id,
            'type' => $type,
            'year' => $year,
        ];

        if (DocumentCounter::where($attributes)->exists()) {
            return;
        }

        try {
            DocumentCounter::create($attributes + ['last_number' => 0]);
        } catch (QueryException) {
            // Another request created it first — that is exactly what we wanted.
        }
    }

    protected function lockCounter(Company $company, string $type, int $year): DocumentCounter
    {
        return DocumentCounter::where('company_id', $company->id)
            ->where('type', $type)
            ->where('year', $year)
            ->lockForUpdate()
            ->firstOrFail();
    }

    protected function result(Company $company, string $type, int $year, int $number): array
    {
        return [
            'number' => $number,
            'formatted' => $this->formatNumber($company, $type, $year, $number),
        ];
    }

    /**
     * Parse formatted number (e.g. "007/2025" or "INV-007/2025") to ['number' => int, 'year' => int|null] or null.
     */
    protected function parseFormattedNumber(string $formatted): ?array
    {
        $formatted = trim($formatted);
        if ($formatted === '') {
            return null;
        }

        $parts = explode('/', $formatted);
        if (count($parts) >= 2) {
            $year = (int) end($parts);
            $numberPart = (string) $parts[0];
        } else {
            $year = null;
            $numberPart = $formatted;
        }

        $number = $this->parseNumericSequence($numberPart);
        if ($number === null) {
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
        if (! $this->resetsYearly($company)) {
            return 0;
        }

        return $year ?? (int) date('Y');
    }

    protected function resetsYearly(Company $company): bool
    {
        return (bool) CompanySetting::get('document_numbering_reset_yearly', true, $company->id);
    }

    /**
     * Extract the numeric sequence from a number part (e.g. "0007", "INV-0007").
     */
    protected function parseNumericSequence(string $numberPart): ?int
    {
        if (str_contains($numberPart, '-')) {
            $numberPart = substr($numberPart, strrpos($numberPart, '-') + 1);
        }

        $number = (int) $numberPart;

        return $number >= 1 ? $number : null;
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
