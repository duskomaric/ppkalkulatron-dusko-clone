<?php

namespace App\Models;

use App\Models\Enums\ArticleTypeEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Article extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'name',
        'description',
        'prices_meta',
        'unit',
        'tax_category',
        'is_active',
        'type',
    ];

    protected $casts = [
        'company_id' => 'integer',
        'name' => 'string',
        'description' => 'string',
        'prices_meta' => 'array',
        'unit' => 'string',
        'tax_category' => 'string',
        'is_active' => 'boolean',
        'type' => ArticleTypeEnum::class,
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
