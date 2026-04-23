<?php

namespace App\Models\Enums;

enum CompanyModuleEnum: string
{
    case Quotes = 'quotes';
    case Proformas = 'proformas';
    case Invoices = 'invoices';
    case Clients = 'clients';
    case Articles = 'articles';
    case Incomes = 'incomes';
    case Expenses = 'expenses';
    case Sales = 'sales';
    case Purchases = 'purchases';
    case Assets = 'assets';
    case Balances = 'balances';
    case VatReturns = 'vatreturns';

    public function label(): string
    {
        return match ($this) {
            self::Quotes => 'Ponude',
            self::Proformas => 'Predracuni',
            self::Invoices => 'Racuni',
            self::Clients => 'Klijenti',
            self::Articles => 'Artikli',
            self::Incomes => 'Knjiga prihoda',
            self::Expenses => 'Knjiga rashoda',
            self::Sales => 'Izlazne fakture',
            self::Purchases => 'Ulazne fakture',
            self::Assets => 'Stalna sredstva',
            self::Balances => 'Potrazivanja i obaveze',
            self::VatReturns => 'PDV prijava',
        };
    }

    public static function options(): array
    {
        return array_reduce(self::cases(), function (array $carry, self $module): array {
            $carry[$module->value] = $module->label();

            return $carry;
        }, []);
    }

    public static function defaultModules(): array
    {
        return [
            self::Quotes->value,
            self::Proformas->value,
            self::Invoices->value,
            self::Clients->value,
            self::Articles->value,
        ];
    }
}
