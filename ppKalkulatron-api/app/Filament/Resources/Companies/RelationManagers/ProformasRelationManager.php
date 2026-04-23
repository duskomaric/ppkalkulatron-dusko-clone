<?php

namespace App\Filament\Resources\Companies\RelationManagers;

use App\Models\Quote;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\LanguageEnum;
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

class ProformasRelationManager extends RelationManager
{
    protected static string $relationship = 'proformas';

    protected static ?string $recordTitleAttribute = 'proforma_number';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Forms\Components\TextInput::make('proforma_number')
                    ->prefixIcon(Heroicon::OutlinedHashtag)
                    ->required()
                    ->maxLength(255)
                    ->columnSpan(1),
                Forms\Components\Select::make('client_id')
                    ->label('Client')
                    ->prefixIcon(Heroicon::OutlinedUser)
                    ->relationship('client', 'name')
                    ->searchable()
                    ->preload()
                    ->required()
                    ->columnSpan(1),
                Forms\Components\Select::make('status')
                    ->prefixIcon(Heroicon::OutlinedCheckCircle)
                    ->options(DocumentStatusEnum::class)
                    ->required()
                    ->columnSpan(1),
                Forms\Components\Select::make('language')
                    ->prefixIcon(Heroicon::OutlinedGlobeAlt)
                    ->options(LanguageEnum::class)
                    ->required()
                    ->columnSpan(1),
                Forms\Components\DatePicker::make('date')
                    ->prefixIcon(Heroicon::OutlinedCalendar)
                    ->required()
                    ->columnSpan(1),
                Forms\Components\DatePicker::make('due_date')
                    ->label('Due date')
                    ->prefixIcon(Heroicon::OutlinedCalendar)
                    ->required()
                    ->columnSpan(1),
                Forms\Components\TextInput::make('currency')
                    ->prefixIcon(Heroicon::OutlinedCurrencyDollar)
                    ->required()
                    ->maxLength(3)
                    ->columnSpan(1),
                Forms\Components\Select::make('proforma_template')
                    ->label('Template')
                    ->prefixIcon(Heroicon::OutlinedDocumentText)
                    ->options(DocumentTemplateEnum::class)
                    ->columnSpan(1),
                Forms\Components\Textarea::make('notes')
                    ->prefixIcon(Heroicon::OutlinedDocumentText)
                    ->rows(3)
                    ->columnSpan(2),
            ])
            ->columns(2);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('proforma_number')
            ->columns([
                Tables\Columns\TextColumn::make('proforma_number')
                    ->icon(Heroicon::OutlinedHashtag)
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('source_type')
                    ->label('Izvor')
                    ->formatStateUsing(fn ($state, $record): ?string => $record->source_type === Quote::class ? 'Iz ponude' : null)
                    ->placeholder('—')
                    ->badge()
                    ->color(fn ($state): ?string => $state ? 'info' : null),
                Tables\Columns\TextColumn::make('client.name')
                    ->label('Client')
                    ->icon(Heroicon::OutlinedUser)
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->icon(Heroicon::OutlinedCheckCircle)
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('date')
                    ->icon(Heroicon::OutlinedCalendar)
                    ->date()
                    ->sortable(),
                Tables\Columns\TextColumn::make('due_date')
                    ->label('Due date')
                    ->icon(Heroicon::OutlinedCalendar)
                    ->date()
                    ->sortable(),
                Tables\Columns\TextColumn::make('total')
                    ->icon(Heroicon::OutlinedCurrencyDollar)
                    ->money('BAM', divideBy: 100)
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
