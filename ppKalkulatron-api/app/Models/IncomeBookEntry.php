<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IncomeBookEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'entry_number',
        'booking_date',
        'description',
        'amount_services',
        'amount_goods',
        'amount_products',
        'amount_other_income',
        'amount_financial_income',
        'total_amount',
        'vat_amount',
        'bank_account_id',
        'payment_date',
        'invoice_id',
    ];

    protected $casts = [
        'booking_date' => 'date',
        'payment_date' => 'date',
        'amount_services' => 'integer',
        'amount_goods' => 'integer',
        'amount_products' => 'integer',
        'amount_other_income' => 'integer',
        'amount_financial_income' => 'integer',
        'total_amount' => 'integer',
        'vat_amount' => 'integer',
    ];

    /**
     * Get the company that owns the income book entry.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the bank account associated with the entry.
     */
    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    /**
     * Get the invoice associated with the entry.
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
