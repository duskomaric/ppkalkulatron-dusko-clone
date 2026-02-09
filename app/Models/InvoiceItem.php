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
        'unit_price',     // cijena sa porezom (inclusive) - ono što kupac plaća po jedinici
        'subtotal',       // quantity * unit_price
        'tax_rate',       // basis points, npr. 1700 = 17%
        'tax_label',      // OFS label: F, N, A, ...
        'tax_amount',     // iznos poreza
        'total',          // subtotal + tax_amount
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'integer',
        'subtotal' => 'integer',
        'tax_rate' => 'integer',
        'tax_amount' => 'integer',
        'total' => 'integer',
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
