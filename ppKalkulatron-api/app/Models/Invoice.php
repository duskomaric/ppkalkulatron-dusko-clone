<?php

namespace App\Models;

use App\Models\Currency;
use App\Models\Enums\DocumentFrequencyEnum;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\FiscalPaymentTypeEnum;
use App\Models\Enums\LanguageEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use App\Models\Enums\FiscalRecordTypeEnum;

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
        'refund_invoice_id',

        'source_type',
        'source_id',

        'currency_id',
        'invoice_template',
        'payment_type',

        // Totals (pfening)
        'subtotal', // zbir item subtotal-a (bez poreza)
        'tax_total', // zbir poreza sa itema
        'discount_total',// ukupni popust
        'total',// subtotal + tax_total - discount_total

        // BAM equivalent (pfening) for fiscal and income book
        'subtotal_bam',
        'tax_total_bam',
        'discount_total_bam',
        'total_bam',
    ];

    protected $casts = [
        'status' => DocumentStatusEnum::class,
        'frequency' => DocumentFrequencyEnum::class,
        'language' => LanguageEnum::class,
        'invoice_template' => DocumentTemplateEnum::class,
        'payment_type' => FiscalPaymentTypeEnum::class,

        'date' => 'date',
        'due_date' => 'date',
        'next_invoice_date' => 'date',

        'is_recurring' => 'boolean',

        'subtotal' => 'integer',
        'tax_total' => 'integer',
        'discount_total' => 'integer',
        'total' => 'integer',

        'subtotal_bam' => 'integer',
        'tax_total_bam' => 'integer',
        'discount_total_bam' => 'integer',
        'total_bam' => 'integer',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_id');
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

    public function refundInvoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'refund_invoice_id');
    }

    public function originalInvoice(): HasOne
    {
        return $this->hasOne(Invoice::class, 'refund_invoice_id');
    }

    public function fiscalRecords(): HasMany
    {
        return $this->hasMany(FiscalRecord::class);
    }

    public function originalFiscalRecord(): ?FiscalRecord
    {
        if ($this->relationLoaded('fiscalRecords')) {
            return $this->fiscalRecords->first(fn ($r) => $r->type === FiscalRecordTypeEnum::Original);
        }

        return $this->fiscalRecords()->where('type', FiscalRecordTypeEnum::Original)->first();
    }



}
