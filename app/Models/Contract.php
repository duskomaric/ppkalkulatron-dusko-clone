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
use Illuminate\Support\Facades\Storage;

class Contract extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_number',
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
        'contract_template',
        'file_paths',
        'subtotal',
        'tax_total',
        'discount_total',
        'total',
    ];

    protected $casts = [
        'status' => DocumentStatusEnum::class,
        'language' => LanguageEnum::class,
        'contract_template' => DocumentTemplateEnum::class,
        'date' => 'date',
        'due_date' => 'date',
        'file_paths' => 'array',
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
        return $this->hasMany(ContractItem::class);
    }

    /**
     * Get the source document (Quote) that this contract was created from
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Add a file to the contract
     */
    public function addFile(string $filePath): void
    {
        $files = $this->file_paths ?? [];
        $files[] = $filePath;
        $this->file_paths = $files;
        $this->save();
    }

    /**
     * Remove a file from the contract
     */
    public function removeFile(int $index): bool
    {
        $files = $this->file_paths ?? [];
        if (!isset($files[$index])) {
            return false;
        }

        $filePath = $files[$index];
        if (Storage::exists($filePath)) {
            Storage::delete($filePath);
        }

        unset($files[$index]);
        $this->file_paths = array_values($files); // Reindex array
        $this->save();

        return true;
    }

    /**
     * Get file count
     */
    public function getFilesCountAttribute(): int
    {
        return count($this->file_paths ?? []);
    }
}
