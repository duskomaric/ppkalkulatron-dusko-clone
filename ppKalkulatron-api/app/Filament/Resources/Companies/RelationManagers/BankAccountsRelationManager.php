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

class BankAccountsRelationManager extends RelationManager
{
    protected static string $relationship = 'bankAccounts';

    protected static ?string $recordTitleAttribute = 'bank_name';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Forms\Components\TextInput::make('bank_name')
                    ->prefixIcon(Heroicon::OutlinedBuildingOffice)
                    ->required()
                    ->maxLength(255)
                    ->columnSpan(2),
                Forms\Components\TextInput::make('account_number')
                    ->prefixIcon(Heroicon::OutlinedCreditCard)
                    ->required()
                    ->maxLength(255)
                    ->columnSpan(1),
                Forms\Components\TextInput::make('swift')
                    ->label('SWIFT')
                    ->prefixIcon(Heroicon::OutlinedGlobeAlt)
                    ->maxLength(255)
                    ->columnSpan(1),
                Forms\Components\Toggle::make('show_on_documents')
                    ->label('Prikaz na dokumentima (PDF)')
                    ->default(true)
                    ->columnSpan(1),
            ])
            ->columns(2);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('bank_name')
            ->columns([
                Tables\Columns\TextColumn::make('bank_name')
                    ->icon(Heroicon::OutlinedBuildingOffice)
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('account_number')
                    ->icon(Heroicon::OutlinedCreditCard)
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('swift')
                    ->label('SWIFT')
                    ->icon(Heroicon::OutlinedGlobeAlt)
                    ->searchable()
                    ->sortable(),
                Tables\Columns\IconColumn::make('show_on_documents')
                    ->label('Na dokumentima')
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
