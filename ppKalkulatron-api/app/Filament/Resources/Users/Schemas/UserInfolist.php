<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Section;
use Filament\Support\Icons\Heroicon;
use Filament\Schemas\Schema;

class UserInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make()
                    ->schema([
                        TextEntry::make('first_name')
                            ->icon(Heroicon::OutlinedUser)
                            ->columnSpan(1),
                        TextEntry::make('last_name')
                            ->icon(Heroicon::OutlinedUser)
                            ->columnSpan(1),
                        TextEntry::make('email')
                            ->label('Email address')
                            ->icon(Heroicon::OutlinedEnvelope)
                            ->columnSpan(1),
                        TextEntry::make('email_verified_at')
                            ->label('Email verified at')
                            ->icon(Heroicon::OutlinedCheckCircle)
                            ->dateTime()
                            ->placeholder('-')
                            ->columnSpan(1),
                        TextEntry::make('role')
                            ->icon(Heroicon::OutlinedShieldCheck)
                            ->badge()
                            ->columnSpan(1),
                        IconEntry::make('is_active')
                            ->label('Active')
                            ->boolean()
                            ->columnSpan(1),
                        TextEntry::make('companies_count')
                            ->label('Total companies')
                            ->icon(Heroicon::OutlinedBuildingOffice)
                            ->counts('companies')
                            ->columnSpan(1),
                        TextEntry::make('last_seen_at')
                            ->label('Last seen at')
                            ->icon(Heroicon::OutlinedClock)
                            ->dateTime()
                            ->placeholder('-')
                            ->columnSpan(1),
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
