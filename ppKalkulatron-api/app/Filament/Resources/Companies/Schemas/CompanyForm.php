<?php

namespace App\Filament\Resources\Companies\Schemas;

use App\Models\User;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Support\Icons\Heroicon;
use Filament\Schemas\Schema;

class CompanyForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make()
                    ->schema([
                        TextInput::make('name')
                            ->prefixIcon(Heroicon::OutlinedBuildingOffice)
                            ->required()
                            ->columnSpan(1),
                        TextInput::make('slug')
                            ->prefixIcon(Heroicon::OutlinedLink)
                            ->required()
                            ->columnSpan(1),
                        Select::make('users')
                            ->label('Users')
                            ->prefixIcon(Heroicon::OutlinedUserGroup)
                            ->relationship('users', 'email')
                            ->multiple()
                            ->preload()
                            ->searchable()
                            ->getOptionLabelFromRecordUsing(fn (User $record): string => "{$record->first_name} {$record->last_name} ({$record->email})")
                            ->columnSpan(2),
                        TextInput::make('email')
                            ->label('Email address')
                            ->prefixIcon(Heroicon::OutlinedEnvelope)
                            ->email()
                            ->columnSpan(1),
                        TextInput::make('phone')
                            ->prefixIcon(Heroicon::OutlinedPhone)
                            ->tel()
                            ->columnSpan(1),
                        TextInput::make('website')
                            ->prefixIcon(Heroicon::OutlinedLink)
                            ->url()
                            ->columnSpan(1),
                        TextInput::make('address')
                            ->prefixIcon(Heroicon::OutlinedMapPin)
                            ->columnSpan(2),
                        TextInput::make('city')
                            ->prefixIcon(Heroicon::OutlinedMapPin)
                            ->columnSpan(1),
                        TextInput::make('postal_code')
                            ->prefixIcon(Heroicon::OutlinedMapPin)
                            ->columnSpan(1),
                        TextInput::make('country')
                            ->prefixIcon(Heroicon::OutlinedGlobeAlt)
                            ->required()
                            ->default('BiH')
                            ->columnSpan(1),
                        TextInput::make('identification_number')
                            ->label('JIB')
                            ->prefixIcon(Heroicon::OutlinedIdentification)
                            ->columnSpan(1),
                        TextInput::make('vat_number')
                            ->label('VAT')
                            ->prefixIcon(Heroicon::OutlinedDocumentText)
                            ->columnSpan(1),
                        Toggle::make('is_active')
                            ->label('Active')
                            ->required()
                            ->columnSpan(1),
                        DateTimePicker::make('subscription_ends_at')
                            ->label('Subscription ends at')
                            ->prefixIcon(Heroicon::OutlinedCalendar)
                            ->columnSpan(1),
                    ])
                    ->columnSpanFull()
                    ->columns(2),
            ]);
    }
}
