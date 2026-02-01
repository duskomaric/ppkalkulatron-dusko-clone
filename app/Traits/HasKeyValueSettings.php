<?php

namespace App\Traits;

use Illuminate\Support\Facades\Cache;

trait HasKeyValueSettings
{
    public static function keys(): array
    {
        return array_keys(static::$castsTo);
    }

    public static function resolved(int $ownerId): array
    {
        $resolved = [];

        foreach (static::keys() as $key) {
            $resolved[$key] = static::get($key, null, $ownerId);
        }

        return $resolved;
    }

    private static function settings(int $ownerId): array
    {
        $cacheKey = static::$cacheKey . '_' . $ownerId;

        return static::$cachedSettings[$cacheKey] ??= Cache::remember($cacheKey, now()->addMinutes(3), function () use ($ownerId) {
            return static::query()
                ->where(static::$ownerKey, $ownerId)
                ->pluck('value', 'key')
                ->toArray();
        });
    }

    public static function get(string $key, mixed $default = null, ?int $ownerId = null): mixed
    {
        static::assertKey($key);

        if (! $ownerId) {
            $value = config(static::$configKey . ".{$key}", $default);

            return static::cast($key, $value);
        }

        $raw = static::settings($ownerId)[$key] ?? null;

        if ($raw !== null) {
            $value = json_decode($raw, true);
            $value = json_last_error() === JSON_ERROR_NONE ? $value : $raw;
        } else {
            $value = config(static::$configKey . ".{$key}", $default);
        }

        return static::cast($key, $value);
    }

    public static function set(string $key, mixed $value, int $ownerId): void
    {
        static::assertKey($key);

        $coerced = static::coerce($key, $value);
        $stored = $coerced === null ? null : json_encode($coerced, JSON_UNESCAPED_UNICODE);

        static::query()->updateOrCreate(
            array_merge(['key' => $key], [static::$ownerKey => $ownerId]),
            ['value' => $stored],
        );

        static::flushCache($ownerId);
    }

    public static function flushCache(int $ownerId): void
    {
        $cacheKey = static::$cacheKey . '_' . $ownerId;
        Cache::forget($cacheKey);
        unset(static::$cachedSettings[$cacheKey]);
    }

    private static function assertKey(string $key): void
    {
        if (! array_key_exists($key, static::$castsTo)) {
            throw new \InvalidArgumentException("Unknown setting key [{$key}].");
        }
    }

    private static function cast(string $key, mixed $value): mixed
    {
        $type = static::$castsTo[$key] ?? 'string';

        return match ($type) {
            'boolean' => $value === null ? null : (bool) $value,
            'integer' => $value === null ? null : (int) $value,
            'array' => is_array($value) ? $value : [],
            default => $value === null
                ? null
                : (is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : (string) $value),
        };
    }

    private static function coerce(string $key, mixed $value): mixed
    {
        $type = static::$castsTo[$key] ?? 'string';

        if ($value === null) {
            return null;
        }

        return match ($type) {
            'boolean' => static::coerceBoolean($value),
            'integer' => static::coerceInteger($value),
            'array' => static::coerceArray($value),
            default => static::coerceString($value),
        };
    }

    private static function coerceString(mixed $value): string
    {
        if (is_string($value)) {
            return $value;
        }

        if (is_numeric($value) || is_bool($value)) {
            return (string) $value;
        }

        throw new \InvalidArgumentException('Invalid string setting value.');
    }

    private static function coerceInteger(mixed $value): int
    {
        if (is_int($value)) {
            return $value;
        }

        if (is_string($value) && preg_match('/^-?\d+$/', $value) === 1) {
            return (int) $value;
        }

        throw new \InvalidArgumentException('Invalid integer setting value.');
    }

    private static function coerceBoolean(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if ($value === 0 || $value === 1) {
            return (bool) $value;
        }

        if (is_string($value)) {
            $normalized = strtolower($value);

            if (in_array($normalized, ['true', '1'], true)) {
                return true;
            }

            if (in_array($normalized, ['false', '0'], true)) {
                return false;
            }
        }

        throw new \InvalidArgumentException('Invalid boolean setting value.');
    }

    private static function coerceArray(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }

        throw new \InvalidArgumentException('Invalid array setting value.');
    }
}
