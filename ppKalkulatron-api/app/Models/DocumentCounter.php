<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentCounter extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'type',
        'year',
        'last_number',
    ];

    protected $casts = [
        'year' => 'integer',
        'last_number' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Increment the counter
     * Note: Lock should be applied at query level before calling this method
     */
    public function incrementCounter(): int
    {
        $this->last_number++;
        $this->save();

        return $this->last_number;
    }

    /**
     * Get the next number without incrementing (for preview)
     */
    public function getNextNumber(): int
    {
        return $this->last_number + 1;
    }
}
