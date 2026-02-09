<?php

namespace App\Models;

use App\Models\Enums\FiscalRecordTypeEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
