<?php

namespace App\Models\Enums;

enum DocumentTypeEnum: string
{
    case QUOTE = 'quote';
    case PROFORMA = 'proforma';
    case INVOICE = 'invoice';
    case CONTRACT = 'contract';

    public function getLabel(): string
    {
        return match ($this) {
            self::QUOTE => 'Ponuda',
            self::PROFORMA => 'Predračun',
            self::INVOICE => 'Račun',
            self::CONTRACT => 'Ugovor',
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::QUOTE => 'gray',
            self::PROFORMA => 'warning',
            self::INVOICE => 'success',
            self::CONTRACT => 'info',
        };
    }
}
