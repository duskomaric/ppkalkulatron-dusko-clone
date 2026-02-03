<?php

namespace App\Models;

use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\LanguageEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Proforma extends Model
{
    use HasFactory;

    protected $fillable = [
        'proforma_number',
        'company_id',
        'client_id',
        'status',
        'language',
        'date',
        'due_date',
        'notes',
        'source_type',
        'source_id',
        'currency',
        'proforma_template',
        'subtotal',
        'tax_total',
        'discount_total',
        'total',
    ];

    protected $casts = [
        'status' => DocumentStatusEnum::class,
        'language' => LanguageEnum::class,
        'proforma_template' => DocumentTemplateEnum::class,
        'date' => 'date',
        'due_date' => 'date',
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
        return $this->hasMany(ProformaItem::class);
    }

    /**
     * Get the source document (Quote) that this proforma was created from
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }
}
