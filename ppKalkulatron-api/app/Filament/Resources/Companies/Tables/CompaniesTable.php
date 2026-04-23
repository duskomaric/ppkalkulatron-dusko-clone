<?php

namespace App\Filament\Resources\Companies\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class CompaniesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->icon(Heroicon::OutlinedBuildingOffice)
                    ->searchable()
                    ->sortable(),
                TextColumn::make('users.filament_name')
                    ->label('Users')
                    ->icon(Heroicon::OutlinedUserGroup)
                    ->badge()
                    ->listWithLineBreaks()
                    ->limitList(3)
                    ->expandableLimitedList()
                    ->separator(',')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('phone')
                    ->icon(Heroicon::OutlinedPhone)
                    ->searchable()
                    ->sortable(),
                IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean()
                    ->sortable(),
                IconColumn::make('is_small_business')
                    ->label('Mali Preduzetnik')
                    ->boolean()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                IconColumn::make('is_vat_obligor')
                    ->label('PDV obv.')
                    ->boolean()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('subscription_ends_at')
                    ->label('Subscription ends')
                    ->icon(Heroicon::OutlinedCalendar)
                    ->dateTime()
                    ->sortable()
                    ->toggleable()
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
                            return 'Expired';
                        }

                        $daysLeft = (int) $now->diffInDays($endsAt, false);

                        return $record->subscription_ends_at->format('d.m.Y') . " ({$daysLeft} days)";
                    }),
                TextColumn::make('created_at')
                    ->label('Created')
                    ->icon(Heroicon::OutlinedCalendar)
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->label('Updated')
                    ->icon(Heroicon::OutlinedPencilSquare)
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('subscription_ends_at', 'asc')
            ->stackedOnMobile()
            ->filters([
                //
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
            ]);
    }
}
