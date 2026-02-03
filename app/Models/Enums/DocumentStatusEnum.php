<?php

namespace App\Models\Enums;

enum DocumentStatusEnum: string
{
    case Draft = 'draft';
    case Sent = 'sent';
    case Locked = 'locked';

    public function getLabel(): ?string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Sent => 'Sent',
            self::Locked => 'Locked',
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::Draft => 'gray',
            self::Sent => 'green',
            self::Locked => 'red',
        };
    }
}
