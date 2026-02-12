<?php

namespace App\Filament\Resources\Users\Schemas;

use App\Models\Company;
use App\Models\Enums\UserRoleEnum;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Support\Icons\Heroicon;
use Filament\Schemas\Schema;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make()
                    ->schema([
                        TextInput::make('first_name')
                            ->prefixIcon(Heroicon::OutlinedUser)
                            ->required()
                            ->columnSpan(1),
                        TextInput::make('last_name')
                            ->prefixIcon(Heroicon::OutlinedUser)
                            ->required()
                            ->columnSpan(1),
                        TextInput::make('email')
                            ->label('Email address')
                            ->prefixIcon(Heroicon::OutlinedEnvelope)
                            ->email()
                            ->required()
                            ->columnSpan(1),
                        DateTimePicker::make('email_verified_at')
                            ->label('Email verified at')
                            ->prefixIcon(Heroicon::OutlinedCheckCircle)
                            ->columnSpan(1),
                        TextInput::make('password')
                            ->prefixIcon(Heroicon::OutlinedLockClosed)
                            ->password()
                            ->required(fn ($livewire) => $livewire instanceof \Filament\Resources\Pages\CreateRecord)
                            ->dehydrated(fn ($state) => filled($state))
                            ->minLength(8)
                            ->columnSpan(1),
                        Select::make('role')
                            ->prefixIcon(Heroicon::OutlinedShieldCheck)
                            ->options(UserRoleEnum::class)
                            ->default('user')
                            ->required()
                            ->columnSpan(1),
                        Select::make('companies')
                            ->label('Companies')
                            ->prefixIcon(Heroicon::OutlinedBuildingOffice)
                            ->relationship('companies', 'name')
                            ->multiple()
                            ->preload()
                            ->searchable()
                            ->columnSpan(2),
                        Toggle::make('is_active')
                            ->label('Active')
                            ->required()
                            ->columnSpan(1),
                        DateTimePicker::make('last_seen_at')
                            ->label('Last seen at')
                            ->prefixIcon(Heroicon::OutlinedClock)
                            ->columnSpan(1),
                    ])
                    ->columnSpanFull()
                    ->columns(2),
            ]);
    }
}
