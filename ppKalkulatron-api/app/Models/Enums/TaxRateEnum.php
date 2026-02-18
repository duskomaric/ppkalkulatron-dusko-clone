<?php

namespace App\Models\Enums;

enum TaxRateEnum: string
{
    case A = 'А';
    case E = 'Е';
    case K = 'К';
    case F = 'F';
    case P = 'P';


    public function rate(): int
    {
        return match ($this) {
            self::A => 0,
            self::E => 17,
            self::K => 0,
            self::F => 11,
            self::P => 40,
        };
    }

    /** Rate in basis points (1100 = 11%) */
    public function rateBasisPoints(): int
    {
        return $this->rate() * 100;
    }

    public static function options(): array
    {
        return array_map(fn (self $e) => [
            'value' => $e->value,
            'label' => "{$e->value} ({$e->rate()}%)",
            'rate' => $e->rate(),
        ], self::cases());
    }
}
