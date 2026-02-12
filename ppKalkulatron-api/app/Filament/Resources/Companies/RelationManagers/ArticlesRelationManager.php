<?php

namespace App\Filament\Resources\Companies\RelationManagers;

use App\Models\Enums\ArticleTypeEnum;
use App\Models\Enums\TaxRateEnum;
use App\Models\Enums\UnitEnum;
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

class ArticlesRelationManager extends RelationManager
{
    protected static string $relationship = 'articles';

    protected static ?string $recordTitleAttribute = 'name';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Forms\Components\TextInput::make('name')
                    ->prefixIcon(Heroicon::OutlinedArchiveBox)
                    ->required()
                    ->maxLength(255)
                    ->columnSpan(2),
                Forms\Components\Textarea::make('description')
                    ->rows(3)
                    ->columnSpan(2),
                Forms\Components\Select::make('type')
                    ->prefixIcon(Heroicon::OutlinedTag)
                    ->options(collect(ArticleTypeEnum::cases())->mapWithKeys(fn ($enum) => [$enum->value => $enum->getLabel()]))
                    ->required()
                    ->columnSpan(1),
                Forms\Components\Select::make('unit')
                    ->prefixIcon(Heroicon::OutlinedScale)
                    ->options(collect(UnitEnum::options())->pluck('label', 'value')->toArray())
                    ->required()
                    ->columnSpan(1),
                Forms\Components\Select::make('tax_rate')
                    ->prefixIcon(Heroicon::OutlinedCalculator)
                    ->options(collect(TaxRateEnum::options())->pluck('label', 'value')->toArray())
                    ->required()
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
                    ->icon(Heroicon::OutlinedArchiveBox)
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('type')
                    ->badge()
                    ->icon(Heroicon::OutlinedTag)
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('unit')
                    ->icon(Heroicon::OutlinedScale)
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('tax_rate')
                    ->icon(Heroicon::OutlinedCalculator)
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
