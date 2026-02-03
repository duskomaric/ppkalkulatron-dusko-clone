<?php

namespace App\Models;

use App\Models\Enums\DocumentFrequencyEnum;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\LanguageEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'company_id',
        'client_id',
        'status',
        'language',
        'date',
        'due_date',
        'notes',

        'is_recurring',
        'frequency',
        'next_invoice_date',
        'parent_id',

        'source_type',
        'source_id',

        'currency',
        'invoice_template',

        // Fiscal
        'is_fiscalized',
        'fiscal_invoice_number',
        'fiscal_counter',
        'fiscal_verification_url',
        'fiscalized_at',
        'fiscal_meta',

        // Totals (pfening)
        'subtotal', // zbir item subtotal-a (bez poreza)
        'tax_total', // zbir poreza sa itema
        'discount_total',// ukupni popust
        'total',// subtotal + tax_total - discount_total
    ];

    protected $casts = [
        'status' => DocumentStatusEnum::class,
        'frequency' => DocumentFrequencyEnum::class,
        'language' => LanguageEnum::class,
        'invoice_template' => DocumentTemplateEnum::class,

        'date' => 'date',
        'due_date' => 'date',
        'next_invoice_date' => 'date',

        'is_recurring' => 'boolean',
        'is_fiscalized' => 'boolean',
        'fiscalized_at' => 'datetime',
        'fiscal_meta' => 'array',

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
        return $this->hasMany(InvoiceItem::class);
    }

    /**
     * Get the source document (Proforma or Contract) that this invoice was created from
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the parent invoice (for recurring invoices)
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'parent_id');
    }

    /**
     * Get child invoices (for recurring invoices)
     */
    public function children(): HasMany
    {
        return $this->hasMany(Invoice::class, 'parent_id');
    }
}
