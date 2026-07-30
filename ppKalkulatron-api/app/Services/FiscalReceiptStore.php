<?php

namespace App\Services;

use App\Models\FiscalRecord;
use App\Models\FiscalReceiptImage;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

/**
 * Storage for fiscal receipt files (PNG / PDF / HTML returned by OFS).
 *
 * Receipts live in the database (fiscal_receipt_images), because the host's filesystem is
 * per-replica and is not kept across deployments. Records created before that still have a file on
 * the disk named by fiscal_receipt_image_path, so reads fall back to it — which disk that is comes
 * from config('filesystems.fiscal_receipts_disk') and everything goes through the Storage facade,
 * so the fallback works on any driver.
 */
class FiscalReceiptStore
{
    public function diskName(): string
    {
        // An env var set but left empty resolves to '', which would reach Storage::disk('').
        $disk = trim((string) config('filesystems.fiscal_receipts_disk'));

        return $disk !== '' ? $disk : 'fiscal_receipts';
    }

    /**
     * Pull the receipt out of an OFS response. Which field carries it depends on the device's
     * receiptImageFormat, and some devices return HTML as a plain string rather than base64.
     *
     * @return array{binary: string, extension: string}|null
     */
    public function extractFrom(array $responseData): ?array
    {
        $base64Candidates = [
            'invoiceImagePngBase64' => 'png',
            'invoiceImagePdfBase64' => 'pdf',
            'invoiceImageHtmlBase64' => 'html',
        ];

        foreach ($base64Candidates as $field => $extension) {
            $content = $responseData[$field] ?? null;
            if (is_string($content) && $content !== '') {
                $binary = base64_decode($content, true);
                if ($binary === false || $binary === '') {
                    continue;
                }

                return ['binary' => $binary, 'extension' => $extension];
            }
        }

        foreach (['invoiceImageHtml', 'invoiceHtml', 'receiptHtml'] as $field) {
            $html = $responseData[$field] ?? null;
            if (is_string($html) && trim($html) !== '') {
                return ['binary' => $html, 'extension' => 'html'];
            }
        }

        return null;
    }

    /** Persist a receipt for a record. Replaces any receipt it already had. */
    public function store(FiscalRecord $record, string $binary, string $extension = 'png'): FiscalReceiptImage
    {
        return FiscalReceiptImage::updateOrCreate(
            ['fiscal_record_id' => $record->id],
            [
                'extension' => $extension,
                'contents' => base64_encode($binary),
            ],
        );
    }

    public function has(FiscalRecord $record): bool
    {
        return $this->binary($record) !== null;
    }

    /** Receipt bytes from the database, or from the legacy disk file, or null. */
    public function binary(FiscalRecord $record): ?string
    {
        $image = $record->receiptImage;

        if ($image) {
            $binary = base64_decode($image->contents, true);

            if ($binary !== false && $binary !== '') {
                return $binary;
            }
        }

        return $this->binaryFromDisk($record);
    }

    public function extension(FiscalRecord $record): string
    {
        $extension = $record->receiptImage?->extension;

        if ($extension) {
            return strtolower($extension);
        }

        return $this->extensionOf((string) $record->fiscal_receipt_image_path);
    }

    public function mime(FiscalRecord $record): string
    {
        return $this->mimeForExtension($this->extension($record));
    }

    public function response(FiscalRecord $record): Response
    {
        return response((string) $this->binary($record), 200, [
            'Content-Type' => $this->mime($record),
        ]);
    }

    /** Legacy: the file written to disk before receipts moved into the database. */
    protected function binaryFromDisk(FiscalRecord $record): ?string
    {
        $path = $record->fiscal_receipt_image_path;

        if (! $path) {
            return null;
        }

        $disk = Storage::disk($this->diskName());

        if (! $disk->exists($path)) {
            return null;
        }

        $binary = $disk->get($path);

        return ($binary === null || $binary === '') ? null : $binary;
    }

    public function extensionOf(string $path): string
    {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return $extension !== '' ? $extension : 'png';
    }

    /** Content type from the stored extension — OFS returns PNG, PDF or HTML. */
    public function mimeForExtension(string $extension): string
    {
        return match (strtolower($extension)) {
            'pdf' => 'application/pdf',
            'html', 'htm' => 'text/html; charset=UTF-8',
            default => 'image/png',
        };
    }
}
