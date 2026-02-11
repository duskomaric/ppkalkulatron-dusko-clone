<?php

namespace App\Models\Enums;

enum FiscalPaymentTypeEnum: string
{
    case Cash = 'Cash';
    case Card = 'Card';
    case Check = 'Check';
    case WireTransfer = 'WireTransfer';
    case Voucher = 'Voucher';
    case MobileMoney = 'MobileMoney';
    case Other = 'Other';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Gotovina',
            self::Card => 'Kartica',
            self::Check => 'Ček',
            self::WireTransfer => 'Bankovni transfer',
            self::Voucher => 'Vaučer',
            self::MobileMoney => 'Mobilni novac',
            self::Other => 'Ostalo',
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
