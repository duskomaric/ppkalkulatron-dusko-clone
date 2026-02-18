<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Enums\DocumentTemplateEnum;
use Spatie\LaravelPdf\Facades\Pdf;

class InvoicePdfService
{
    public function generate(Invoice $invoice, ?DocumentTemplateEnum $template = null): \Spatie\LaravelPdf\PdfBuilder
    {
        $invoice->load(['client', 'items', 'company', 'bankAccount', 'currency', 'fiscalRecords']);

        $template = $template ?? $invoice->invoice_template ?? DocumentTemplateEnum::Classic;
        $viewName = $template->getViewName();

        return Pdf::view($viewName, [
            'invoice' => $invoice,
            'company' => $invoice->company,
        ])
            ->format('a4')
            ->withBrowsershot(function ($browsershot) {
                $browsershot
                    ->setOption('args', ['--disable-web-security', '--lang=sr'])
                    ->setOption('encoding', 'UTF-8');
            });
    }

    public function download(Invoice $invoice, ?DocumentTemplateEnum $template = null)
    {
        $filename = 'faktura-' . \Str::slug($invoice->invoice_number) . '.pdf';

        return $this->generate($invoice, $template)->name($filename);
    }

    public function save(Invoice $invoice, string $path, ?DocumentTemplateEnum $template = null): string
    {
        $this->generate($invoice, $template)->save($path);

        return $path;
    }
}
