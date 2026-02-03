<?php

namespace App\Services;

use App\Models\Company;
use App\Models\DocumentCounter;
use Illuminate\Support\Facades\DB;

class DocumentNumberService
{
    /**
     * Get the next number without incrementing (preview)
     */
    public function getNextNumber(Company $company, string $type, ?int $year = null): array
    {
        $year = $year ?? (int) date('Y');

        $counter = DocumentCounter::where('company_id', $company->id)
            ->where('type', $type)
            ->where('year', $year)
            ->first();

        $nextNumber = $counter ? $counter->getNextNumber() : 1;
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
        $year = $year ?? (int) date('Y');

        return DB::transaction(function () use ($company, $type, $year) {
            $counter = DocumentCounter::lockForUpdate()
                ->where('company_id', $company->id)
                ->where('type', $type)
                ->where('year', $year)
                ->first();

            if (!$counter) {
                $counter = DocumentCounter::create([
                    'company_id' => $company->id,
                    'type' => $type,
                    'year' => $year,
                    'last_number' => 0,
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
     * Format the document number
     */
    protected function formatNumber(Company $company, string $type, int $year, int $number): string
    {
        $prefix = match ($type) {
            'invoice' => 'INV',
            'proforma' => 'PRO',
            'contract' => 'CON',
            'quote' => 'QUO',
            default => strtoupper(substr($type, 0, 3)),
        };

        return sprintf('%s-%d-%03d', $prefix, $year, $number);
    }
}
