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

        return Pdf::view($viewName, [
            'quote' => $quote,
            'company' => $quote->company,
        ])->format('a4');
    }

    public function download(Quote $quote, ?DocumentTemplateEnum $template = null)
    {
        $filename = 'ponuda-' . \Str::slug($quote->quote_number) . '.pdf';

        return $this->generate($quote, $template)->name($filename);
    }

    public function save(Quote $quote, string $path, ?DocumentTemplateEnum $template = null): string
    {
        $this->generate($quote, $template)->save($path);

        return $path;
    }
}
