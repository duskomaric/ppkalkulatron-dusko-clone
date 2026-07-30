<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The receipt file OFS returned, kept in the database because the host's filesystem does not
 * survive deployments. Held in its own table so invoice listings never read it.
 */
class FiscalReceiptImage extends Model
{
    protected $fillable = [
        'fiscal_record_id',
        'extension',
        'contents',
    ];

    /** Never expose the base64 payload through a resource by accident. */
    protected $hidden = [
        'contents',
    ];

    public function fiscalRecord(): BelongsTo
    {
        return $this->belongsTo(FiscalRecord::class);
    }

    public function binary(): string
    {
        return base64_decode($this->contents, true) ?: '';
    }
}
