<?php

namespace App\Filament\Resources\Companies\Schemas;

use App\Models\Enums\CompanyModuleEnum;
use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Section;
use Filament\Support\Icons\Heroicon;
use Filament\Schemas\Schema;

class CompanyInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make()
                    ->schema([
                        TextEntry::make('name')
                            ->icon(Heroicon::OutlinedBuildingOffice)
                            ->columnSpan(1),
                        TextEntry::make('slug')
                            ->icon(Heroicon::OutlinedLink)
                            ->columnSpan(1),
                        IconEntry::make('is_active')
                            ->label('Active')
                            ->boolean()
                            ->columnSpan(1),
                        TextEntry::make('users_count')
                            ->label('Total users')
                            ->icon(Heroicon::OutlinedUserGroup)
                            ->counts('users')
                            ->columnSpan(1),
                        TextEntry::make('email')
                            ->label('Email address')
                            ->icon(Heroicon::OutlinedEnvelope)
                            ->placeholder('-')
                            ->columnSpan(1),
                        TextEntry::make('phone')
                            ->icon(Heroicon::OutlinedPhone)
                            ->placeholder('-')
                            ->columnSpan(1),
                        TextEntry::make('website')
                            ->icon(Heroicon::OutlinedLink)
                            ->openUrlInNewTab()
                            ->placeholder('-')
                            ->columnSpan(1),
                        TextEntry::make('address')
                            ->icon(Heroicon::OutlinedMapPin)
                            ->placeholder('-')
                            ->columnSpan(2),
                        TextEntry::make('city')
                            ->icon(Heroicon::OutlinedMapPin)
                            ->placeholder('-')
                            ->columnSpan(1),
                        TextEntry::make('postal_code')
                            ->icon(Heroicon::OutlinedMapPin)
                            ->placeholder('-')
                            ->columnSpan(1),
                        TextEntry::make('country')
                            ->icon(Heroicon::OutlinedGlobeAlt)
                            ->columnSpan(1),
                        TextEntry::make('identification_number')
                            ->label('JIB')
                            ->icon(Heroicon::OutlinedIdentification)
                            ->placeholder('-')
                            ->columnSpan(1),
                        TextEntry::make('vat_number')
                            ->label('VAT')
                            ->icon(Heroicon::OutlinedDocumentText)
                            ->placeholder('-')
                            ->columnSpan(1),
                        IconEntry::make('is_small_business')
                            ->label('Mali Preduzetnik')
                            ->boolean()
                            ->columnSpan(1),
                        IconEntry::make('is_vat_obligor')
                            ->label('PDV obveznik')
                            ->boolean()
                            ->columnSpan(1),
                        TextEntry::make('subscription_ends_at')
                            ->label('Subscription ends at')
                            ->icon(Heroicon::OutlinedCalendar)
                            ->dateTime()
                            ->placeholder('-')
                            ->color(function ($record) {
                                if (!$record->subscription_ends_at) {
                                    return null;
                                }

                                $now = now();
                                $endsAt = $record->subscription_ends_at;

                                // Ako je prošlo
                                if ($endsAt->isPast()) {
                                    return 'danger';
                                }

                                $daysLeft = $now->diffInDays($endsAt, false);

                                if ($daysLeft < 30) {
                                    return 'danger'; // Crvena
                                } elseif ($daysLeft < 90) {
                                    return 'warning'; // Žuta
                                } else {
                                    return 'success'; // Zelena
                                }
                            })
                            ->badge()
                            ->formatStateUsing(function ($state, $record) {
                                if (!$record->subscription_ends_at) {
                                    return 'Lifetime';
                                }

                                $now = now();
                                $endsAt = $record->subscription_ends_at;

                                if ($endsAt->isPast()) {
                                    return 'Expired: ' . $record->subscription_ends_at->format('d.m.Y');
                                }

                                $daysLeft = (int) $now->diffInDays($endsAt, false, true);

                                return $record->subscription_ends_at->format('d.m.Y H:i') . " ({$daysLeft} days left)";
                            })
                            ->columnSpan(1),
                        TextEntry::make('enabled_modules')
                            ->label('Enabled modules')
                            ->formatStateUsing(fn ($state) => collect($state ?: [])
                                ->map(fn (string $moduleId) => CompanyModuleEnum::tryFrom($moduleId)?->label() ?? $moduleId)
                                ->join(', '))
                            ->placeholder('-')
                            ->columnSpan(3),
                        TextEntry::make('created_at')
                            ->label('Created at')
                            ->icon(Heroicon::OutlinedCalendar)
                            ->dateTime()
                            ->placeholder('-')
                            ->columnSpan(1),
                        TextEntry::make('updated_at')
                            ->label('Updated at')
                            ->icon(Heroicon::OutlinedPencilSquare)
                            ->dateTime()
                            ->placeholder('-')
                            ->columnSpan(1),
                    ])
                    ->columnSpanFull()
                    ->columns(3),
            ]);
    }
}
