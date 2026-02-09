<?php

namespace App\Models\Enums;

enum DocumentStatusEnum: string
{
    case Created = 'created';
    case Fiscalized = 'fiscalized';
    case Refunded = 'refunded';

    public function getLabel(): ?string
    {
        return match ($this) {
            self::Created => 'Kreiran',
            self::Fiscalized => 'Fiskalizovan',
            self::Refunded => 'Storniran',
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::Created => 'gray',
            self::Fiscalized => 'green',
            self::Refunded => 'red',
        };
    }
}
