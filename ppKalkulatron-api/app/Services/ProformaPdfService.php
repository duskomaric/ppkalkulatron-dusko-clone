<?php

namespace App\Services;

use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Proforma;
use Spatie\LaravelPdf\Facades\Pdf;

class ProformaPdfService
{
    private function resolveView(?DocumentTemplateEnum $template): string
    {
        $template = $template ?? DocumentTemplateEnum::Classic;

        return match ($template) {
            DocumentTemplateEnum::Classic => 'pdf.proforma',
            DocumentTemplateEnum::Modern => 'pdf.proforma-modern',
            DocumentTemplateEnum::Minimal => 'pdf.proforma-minimal',
            DocumentTemplateEnum::Standard => 'pdf.proforma-standard',
        };
    }

    public function generate(Proforma $proforma, ?DocumentTemplateEnum $template = null): \Spatie\LaravelPdf\PdfBuilder
    {
        $proforma->load(['client', 'items', 'company', 'source']);

        $viewName = $this->resolveView($template ?? $proforma->proforma_template);
        $bankAccounts = $proforma->company->bankAccounts()->where('show_on_documents', true)->orderBy('id')->get();

        return Pdf::view($viewName, [
            'proforma' => $proforma,
            'company' => $proforma->company,
            'bankAccounts' => $bankAccounts,
        ])->format('a4');
    }

    public function download(Proforma $proforma, ?DocumentTemplateEnum $template = null)
    {
        $filename = 'predracun-' . \Str::slug($proforma->proforma_number) . '.pdf';

        return $this->generate($proforma, $template)->name($filename);
    }

    public function streamDownload(Proforma $proforma, ?DocumentTemplateEnum $template = null): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $filename = 'predracun-' . \Str::slug($proforma->proforma_number) . '.pdf';
        $path = storage_path('app/private/pdf-' . \Str::random(16) . '.pdf');
        $this->save($proforma, $path, $template);

        return response()->download($path, $filename, [
            'Content-Type' => 'application/pdf',
        ])->deleteFileAfterSend(true);
    }

    public function save(Proforma $proforma, string $path, ?DocumentTemplateEnum $template = null): string
    {
        $this->generate($proforma, $template)->save($path);

        return $path;
    }
}
