<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\HasKeyValueSettings;

class UserSetting extends Model
{
    use HasKeyValueSettings;

    protected $table = 'user_settings';

    protected $fillable = [
        'key',
        'value',
        'user_id',
    ];

    protected static string $cacheKey = 'user_settings_cache';

    protected static array $cachedSettings = [];

    protected static string $ownerKey = 'user_id';

    protected static string $configKey = 'user_settings';

    protected static array $castsTo = [
        'log_viewer_access_key' => 'string',
        'support_link' => 'string',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
