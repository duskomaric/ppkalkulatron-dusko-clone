<?php

namespace App\Models;

use App\Models\BankAccount;
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

        'source_type',
        'source_id',

        'currency',
        'currency_id',
        'bank_account_id',
        'invoice_template',
        'payment_type',

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
        'payment_type' => FiscalPaymentTypeEnum::class,

        'date' => 'date',
        'due_date' => 'date',
        'next_invoice_date' => 'date',

        'is_recurring' => 'boolean',

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

    public function currencyRelation(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_id');
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
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

    public function getFiscalInvoiceNumberAttribute(): ?string
    {
        return $this->originalFiscalRecord()?->fiscal_invoice_number;
    }

    public function getFiscalCounterAttribute(): ?string
    {
        return $this->originalFiscalRecord()?->fiscal_counter;
    }

    public function getFiscalVerificationUrlAttribute(): ?string
    {
        return $this->originalFiscalRecord()?->verification_url;
    }

    public function getFiscalizedAtAttribute(): ?\Carbon\CarbonInterface
    {
        return $this->originalFiscalRecord()?->fiscalized_at;
    }

    public function getFiscalReceiptImagePathAttribute(): ?string
    {
        return $this->originalFiscalRecord()?->fiscal_receipt_image_path;
    }

    public function getFiscalMetaAttribute(): ?array
    {
        return $this->originalFiscalRecord()?->fiscal_meta;
    }
}
