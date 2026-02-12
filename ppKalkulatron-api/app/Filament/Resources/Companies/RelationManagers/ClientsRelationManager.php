<?php

namespace App\Filament\Resources\Companies\RelationManagers;

use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Forms;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Support\Icons\Heroicon;

class ClientsRelationManager extends RelationManager
{
    protected static string $relationship = 'clients';

    protected static ?string $recordTitleAttribute = 'name';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Forms\Components\TextInput::make('name')
                    ->prefixIcon(Heroicon::OutlinedUser)
                    ->required()
                    ->maxLength(255)
                    ->columnSpan(2),
                Forms\Components\TextInput::make('email')
                    ->prefixIcon(Heroicon::OutlinedEnvelope)
                    ->email()
                    ->maxLength(255)
                    ->columnSpan(1),
                Forms\Components\TextInput::make('phone')
                    ->prefixIcon(Heroicon::OutlinedPhone)
                    ->tel()
                    ->maxLength(255)
                    ->columnSpan(1),
                Forms\Components\TextInput::make('address')
                    ->prefixIcon(Heroicon::OutlinedMapPin)
                    ->maxLength(255)
                    ->columnSpan(2),
                Forms\Components\TextInput::make('city')
                    ->prefixIcon(Heroicon::OutlinedMapPin)
                    ->maxLength(255)
                    ->columnSpan(1),
                Forms\Components\TextInput::make('zip')
                    ->prefixIcon(Heroicon::OutlinedMapPin)
                    ->maxLength(255)
                    ->columnSpan(1),
                Forms\Components\TextInput::make('country')
                    ->prefixIcon(Heroicon::OutlinedGlobeAlt)
                    ->maxLength(255)
                    ->columnSpan(1),
                Forms\Components\TextInput::make('tax_id')
                    ->label('Tax ID')
                    ->prefixIcon(Heroicon::OutlinedIdentification)
                    ->maxLength(255)
                    ->columnSpan(1),
                Forms\Components\TextInput::make('vat_id')
                    ->label('VAT ID')
                    ->prefixIcon(Heroicon::OutlinedDocumentText)
                    ->maxLength(255)
                    ->columnSpan(1),
                Forms\Components\Toggle::make('is_active')
                    ->label('Active')
                    ->required()
                    ->columnSpan(1),
            ])
            ->columns(2);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('name')
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->icon(Heroicon::OutlinedUser)
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('email')
                    ->icon(Heroicon::OutlinedEnvelope)
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('phone')
                    ->icon(Heroicon::OutlinedPhone)
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('city')
                    ->icon(Heroicon::OutlinedMapPin)
                    ->searchable()
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_active')
                    ->label('Active')
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
                DeleteAction::make(),
            ]);
    }

    public function isReadOnly(): bool
    {
        return false;
    }
}
