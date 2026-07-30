<?php

namespace App\Models;

use App\Models\Enums\FiscalRecordTypeEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class FiscalRecord extends Model
{
    protected $fillable = [
        'invoice_id',
        'type',
        'fiscal_invoice_number',
        'fiscal_counter',
        'request_id',
        'verification_url',
        'fiscalized_at',
        // Logical name of the receipt: gives it an extension and names the mail attachment.
        // Records created before receipts moved into the database also have a real file behind it.
        'fiscal_receipt_image_path',
        'fiscal_meta',
    ];

    protected $casts = [
        'type' => FiscalRecordTypeEnum::class,
        'fiscalized_at' => 'datetime',
        'fiscal_meta' => 'array',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /** Do not eager load this with invoice listings — see the fiscal_receipt_images migration. */
    public function receiptImage(): HasOne
    {
        return $this->hasOne(FiscalReceiptImage::class);
    }
}
