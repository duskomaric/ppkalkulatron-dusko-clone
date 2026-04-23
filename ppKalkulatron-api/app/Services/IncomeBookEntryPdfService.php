<?php

namespace App\Services;

use App\Models\Company;
use App\Models\IncomeBookEntry;
use Spatie\LaravelPdf\Facades\Pdf;

class IncomeBookEntryPdfService
{
    /**
     * Generates a PDF builder instance for the Income Book entries.
     * 
     * @param Company $company
     * @param \Illuminate\Support\Collection $entries
     * @param string|null $startDate
     * @param string|null $endDate
     * @return \Spatie\LaravelPdf\PdfBuilder
     */
    public function generate(Company $company, $entries, ?string $startDate = null, ?string $endDate = null): \Spatie\LaravelPdf\PdfBuilder
    {
        return Pdf::view('pdf.income-book-entries', [
            'company' => $company,
            'entries' => $entries,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ])
            ->format('a4')
            ->landscape() // Landscape fits the ledger table better
            ->withBrowsershot(function ($browsershot) {
                // Ensure browser sandbox works without issues in most docker envs
                $browsershot
                    ->setOption('args', ['--disable-web-security', '--lang=sr'])
                    ->setOption('encoding', 'UTF-8');
            });
    }

    /**
     * Downloads the final PDF.
     */
    public function download(Company $company, $entries, ?string $startDate = null, ?string $endDate = null)
    {
        $filename = 'knjiga-prihoda-' . $company->slug . '-' . now()->format('Y-m-d') . '.pdf';

        return $this->generate($company, $entries, $startDate, $endDate)->name($filename);
    }
}
