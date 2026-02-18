<?php

namespace App\Filament\Resources\Companies\RelationManagers;

use Filament\Actions\CreateAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Forms;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Support\Icons\Heroicon;

class CurrenciesRelationManager extends RelationManager
{
    protected static string $relationship = 'currencies';

    protected static ?string $recordTitleAttribute = 'code';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Forms\Components\TextInput::make('code')
                    ->prefixIcon(Heroicon::OutlinedCurrencyDollar)
                    ->required()
                    ->maxLength(3)
                    ->columnSpan(1),
                Forms\Components\TextInput::make('name')
                    ->prefixIcon(Heroicon::OutlinedGlobeAlt)
                    ->required()
                    ->maxLength(255)
                    ->columnSpan(1),
                Forms\Components\TextInput::make('symbol')
                    ->prefixIcon(Heroicon::OutlinedCurrencyDollar)
                    ->required()
                    ->maxLength(10)
                    ->columnSpan(1),
                Forms\Components\Toggle::make('is_default')
                    ->label('Default')
                    ->required()
                    ->columnSpan(1),
            ])
            ->columns(2);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('code')
            ->columns([
                Tables\Columns\TextColumn::make('code')
                    ->icon(Heroicon::OutlinedCurrencyDollar)
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('name')
                    ->icon(Heroicon::OutlinedGlobeAlt)
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('symbol')
                    ->icon(Heroicon::OutlinedCurrencyDollar)
                    ->searchable()
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_default')
                    ->label('Default')
                    ->boolean()
                    ->sortable(),
            ])
            ->filters([
                //
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
            ]);
    }

    public function isReadOnly(): bool
    {
        return false;
    }
}
