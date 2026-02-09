<?php

namespace App\Models\Enums;

enum UnitEnum: string
{
    case KOM = 'kom';
    case SAT = 'sat';
    case KG = 'kg';
    case G = 'g';
    case L = 'l';
    case M = 'm';
    case M2 = 'm2';
    case M3 = 'm3';
    case PAK = 'pak';
    case KUT = 'kut';
    case PAR = 'par';
    case USL = 'usl';

    public function label(): string
    {
        return match ($this) {
            self::KOM => 'kom',
            self::SAT => 'sat',
            self::KG => 'kg',
            self::G => 'g',
            self::L => 'l',
            self::M => 'm',
            self::M2 => 'm²',
            self::M3 => 'm³',
            self::PAK => 'pak',
            self::KUT => 'kut',
            self::PAR => 'par',
            self::USL => 'usl',
        };
    }

    public static function options(): array
    {
        return array_map(fn (self $e) => [
            'value' => $e->value,
            'label' => $e->label(),
        ], self::cases());
    }
}
