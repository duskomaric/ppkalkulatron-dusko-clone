<?php

namespace App\Services;

use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Quote;
use Spatie\LaravelPdf\Facades\Pdf;

class QuotePdfService
{
    private function resolveView(?DocumentTemplateEnum $template): string
    {
        $template = $template ?? DocumentTemplateEnum::Classic;

        return match ($template) {
            DocumentTemplateEnum::Classic => 'pdf.quote',
            DocumentTemplateEnum::Modern => 'pdf.quote-modern',
            DocumentTemplateEnum::Minimal => 'pdf.quote-minimal',
            DocumentTemplateEnum::Standard => 'pdf.quote-standard',
        };
    }

    public function generate(Quote $quote, ?DocumentTemplateEnum $template = null): \Spatie\LaravelPdf\PdfBuilder
    {
        $quote->load(['client', 'items', 'company']);

        $viewName = $this->resolveView($template ?? $quote->quote_template);
        $bankAccounts = $quote->company->bankAccounts()->where('show_on_documents', true)->orderBy('id')->get();

        return Pdf::view($viewName, [
            'quote' => $quote,
            'company' => $quote->company,
            'bankAccounts' => $bankAccounts,
        ])->format('a4');
    }

    public function download(Quote $quote, ?DocumentTemplateEnum $template = null)
    {
        $filename = 'ponuda-' . \Str::slug($quote->quote_number) . '.pdf';

        return $this->generate($quote, $template)->name($filename);
    }

    public function streamDownload(Quote $quote, ?DocumentTemplateEnum $template = null): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $filename = 'ponuda-' . \Str::slug($quote->quote_number) . '.pdf';
        $path = storage_path('app/private/pdf-' . \Str::random(16) . '.pdf');
        $this->save($quote, $path, $template);

        return response()->download($path, $filename, [
            'Content-Type' => 'application/pdf',
        ])->deleteFileAfterSend(true);
    }

    public function save(Quote $quote, string $path, ?DocumentTemplateEnum $template = null): string
    {
        $this->generate($quote, $template)->save($path);

        return $path;
    }
}
