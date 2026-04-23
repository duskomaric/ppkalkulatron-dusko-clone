<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'article_id',

        'name',
        'description',

        'quantity',

        // monetary snapshot (pfening)
        'unit_price',     // cijena sa porezom (inclusive) po jedinici
        'subtotal',       // iznos bez poreza za red (quantity * cijena bez poreza)
        'tax_rate',       // basis points, npr. 1700 = 17%
        'tax_label',      // OFS label: F, N, A, ...
        'tax_amount',     // iznos poreza za red
        'total',          // iznos sa porezom za red (subtotal + tax_amount)

        // BAM equivalent (pfening)
        'unit_price_bam',
        'subtotal_bam',
        'tax_amount_bam',
        'total_bam',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'integer',
        'subtotal' => 'integer',
        'tax_rate' => 'integer',
        'tax_amount' => 'integer',
        'total' => 'integer',

        'unit_price_bam' => 'integer',
        'subtotal_bam' => 'integer',
        'tax_amount_bam' => 'integer',
        'total_bam' => 'integer',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }
}
