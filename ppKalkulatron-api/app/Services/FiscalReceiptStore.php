<?php

namespace App\Services;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Storage for fiscal receipt files (PNG / PDF / HTML returned by OFS).
 *
 * Everything goes through the Storage facade rather than real filesystem paths, so the same code
 * works on the default local disk and on an S3-compatible bucket. Which disk is used comes from
 * config('filesystems.fiscal_receipts_disk'), so a host with an ephemeral filesystem only needs
 * an environment variable, not a code change.
 */
class FiscalReceiptStore
{
    public function diskName(): string
    {
        // An env var set but left empty resolves to '', which would reach Storage::disk('').
        $disk = trim((string) config('filesystems.fiscal_receipts_disk'));

        return $disk !== '' ? $disk : 'fiscal_receipts';
    }

    public function disk(): Filesystem
    {
        return Storage::disk($this->diskName());
    }

    public function put(string $path, string $contents): void
    {
        $this->disk()->put($path, $contents);
    }

    public function exists(?string $path): bool
    {
        return $path !== null && $path !== '' && $this->disk()->exists($path);
    }

    public function response(string $path): StreamedResponse
    {
        return $this->disk()->response($path, null, ['Content-Type' => $this->mimeFor($path)]);
    }

    /** Content type from the stored extension — OFS returns PNG, PDF or HTML. */
    public function mimeFor(string $path): string
    {
        return match ($this->extensionOf($path)) {
            'pdf' => 'application/pdf',
            'html', 'htm' => 'text/html; charset=UTF-8',
            default => 'image/png',
        };
    }

    public function extensionOf(string $path): string
    {
        return strtolower(pathinfo($path, PATHINFO_EXTENSION));
    }
}
