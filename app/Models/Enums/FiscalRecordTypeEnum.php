<?php

namespace App\Models\Enums;

enum FiscalRecordTypeEnum: string
{
    case Original = 'original';
    case Copy = 'copy';
    case Refund = 'refund';

    public function getLabel(): string
    {
        return match ($this) {
            self::Original => 'Original',
            self::Copy => 'Kopija',
            self::Refund => 'Refundacija',
        };
    }
}
