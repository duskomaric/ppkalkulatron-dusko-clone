<?php

namespace App\Models;

use App\Models\Currency;
use App\Models\Enums\ArticleTypeEnum;
use App\Models\Enums\TaxRateEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Article extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'name',
        'description',
        'prices_meta',
        'unit',
        'tax_rate',
        'is_active',
        'type',

        'last_unit_price',
        'last_currency_id',
    ];

    protected $casts = [
        'company_id' => 'integer',
        'name' => 'string',
        'description' => 'string',
        'prices_meta' => 'array',
        'unit' => 'string',
        'tax_rate' => 'string',
        'is_active' => 'boolean',
        'type' => ArticleTypeEnum::class,

        'last_unit_price' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function lastCurrency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'last_currency_id');
    }

    public function invoiceItems(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function taxRateEnum(): ?TaxRateEnum
    {
        if (!array_key_exists('tax_rate', $this->getAttributes())) {
            return null;
        }
        $value = $this->getAttributes()['tax_rate'] ?? null;
        return $value ? TaxRateEnum::tryFrom($value) : null;
    }
}
