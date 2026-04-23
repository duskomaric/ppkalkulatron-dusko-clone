<?php

namespace App\Models;

use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\LanguageEnum;
use App\Models\Currency;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quote extends Model
{
    use HasFactory;

    protected $fillable = [
        'quote_number',
        'company_id',
        'client_id',
        'status',
        'language',
        'date',
        'valid_until',
        'notes',
        'currency_id',
        'quote_template',
        'subtotal',
        'tax_total',
        'discount_total',
        'total',
    ];

    protected $casts = [
        'status' => DocumentStatusEnum::class,
        'language' => LanguageEnum::class,
        'quote_template' => DocumentTemplateEnum::class,
        'date' => 'date',
        'valid_until' => 'date',
        'subtotal' => 'integer',
        'tax_total' => 'integer',
        'discount_total' => 'integer',
        'total' => 'integer',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuoteItem::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_id');
    }
}
