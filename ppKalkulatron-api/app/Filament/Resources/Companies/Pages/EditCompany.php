<?php

namespace App\Filament\Resources\Companies\Pages;

use App\Filament\Resources\Companies\CompanyResource;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;

class EditCompany extends EditRecord
{
    protected static string $resource = CompanyResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('settings')
                ->label('Podešavanja')
                ->url(fn (): string => CompanyResource::getUrl('settings', ['record' => $this->getRecord()]))
                ->icon('heroicon-o-cog-6-tooth'),
            ViewAction::make(),
            DeleteAction::make(),
        ];
    }
}
