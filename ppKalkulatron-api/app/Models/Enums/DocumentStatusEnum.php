<?php

namespace App\Models\Enums;

enum DocumentStatusEnum: string
{
    case Created = 'created';
    case Fiscalized = 'fiscalized';
    case RefundCreated = 'refund_created';
    case Refunded = 'refunded';

    public function getLabel(): ?string
    {
        return match ($this) {
            self::Created => 'Kreiran',
            self::Fiscalized => 'Fiskalizovan',
            self::RefundCreated => 'Storno kreiran',
            self::Refunded => 'Storniran',
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::Created => 'gray',
            self::Fiscalized => 'green',
            self::RefundCreated => 'amber',
            self::Refunded => 'red',
        };
    }
}
