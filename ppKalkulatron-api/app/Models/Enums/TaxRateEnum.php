<?php

namespace App\Models\Enums;

enum TaxRateEnum: string
{
    case F = 'F';
    case N = 'N';
    case P = 'P';
    case E = 'E';
    case T = 'T';
    case A = 'A';
    case B = 'B';
    case C = 'C';

    public function rate(): int
    {
        return match ($this) {
            self::F => 11,
            self::N => 0,
            self::P => 40,
            self::E => 6,
            self::T => 2,
            self::A => 9,
            self::B => 0,
            self::C => 0,
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
