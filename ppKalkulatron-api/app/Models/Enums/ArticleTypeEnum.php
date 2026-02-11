<?php

namespace App\Models\Enums;

enum ArticleTypeEnum: string
{
    case GOODS = 'goods';
    case SERVICES = 'services';
    case PRODUCTS = 'products';

    public function getLabel(): string
    {
        return match ($this) {
            self::GOODS => 'Roba',
            self::SERVICES => 'Usluge',
            self::PRODUCTS => 'Proizvodi',
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::GOODS => 'blue-500',
            self::SERVICES => 'green-500',
            self::PRODUCTS => 'yellow-500',
        };
    }
}
