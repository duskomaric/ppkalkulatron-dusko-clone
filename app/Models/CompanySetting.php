<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\HasKeyValueSettings;

class CompanySetting extends Model
{
    use HasKeyValueSettings;

    protected $table = 'company_settings';

    protected $fillable = [
        'key',
        'value',
        'company_id',
    ];

    protected static string $cacheKey = 'company_settings_cache';

    protected static array $cachedSettings = [];

    protected static string $ownerKey = 'company_id';

    protected static string $configKey = 'company_settings';

    protected static array $castsTo = [
        'default_invoice_template' => 'string',
        'default_invoice_due_days' => 'integer',
        'default_invoice_language' => 'string',
        'default_invoice_currency' => 'string',
        'default_bank_account_id' => 'integer',
        'invoice_numbering_reset_yearly' => 'boolean',
        'invoice_numbering_pad_zeros' => 'integer',
        'invoice_numbering_starting_number' => 'integer',
        'invoice_numbering_prefix' => 'string',
        'invoice_footer_lines' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
