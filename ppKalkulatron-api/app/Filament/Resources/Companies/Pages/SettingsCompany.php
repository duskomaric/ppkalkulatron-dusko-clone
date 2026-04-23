<?php

namespace App\Filament\Resources\Companies\Pages;

use App\Filament\Resources\Companies\CompanyResource;
use App\Models\CompanySetting;
use App\Models\Enums\CompanyModuleEnum;
use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\FiscalPaymentTypeEnum;
use App\Models\Enums\LanguageEnum;
use Filament\Forms\Components\CheckboxList;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Pages\EditRecord;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Illuminate\Database\Eloquent\Model;

class SettingsCompany extends EditRecord
{
    protected static string $resource = CompanyResource::class;

    protected static ?string $title = 'Podešavanja';

    protected static ?string $navigationLabel = 'Podešavanja';

//    public static function getSlug(): string
//    {
//        return 'settings';
//    }

    public static function shouldRegisterNavigation(array $parameters = []): bool
    {
        return false;
    }

    protected function mutateFormDataBeforeFill(array $data): array
    {
        return CompanySetting::resolved((int) $this->getRecord()->getKey());
    }

    /**
     * Persist settings instead of updating the company record.
     *
     * @param  array<string, mixed>  $data
     */
    protected function handleRecordUpdate(Model $record, array $data): Model
    {
        $companyId = (int) $record->getKey();

        foreach (CompanySetting::keys() as $key) {
            if (! array_key_exists($key, $data)) {
                continue;
            }
            $value = $data[$key];
            if ($key === 'ofs_receipt_header_text_lines' && is_string($value)) {
                $decoded = json_decode($value, true);
                $value = is_array($decoded) ? $decoded : [];
            }
            CompanySetting::set($key, $value, $companyId);
        }

        CompanySetting::flushCache($companyId);

        return $record;
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Dokumenti')
                    ->schema($this->documentFields())
                    ->columns(2)
                    ->collapsible(),
                Section::make('Numeracija')
                    ->schema($this->numberingFields())
                    ->columns(2)
                    ->collapsible(),
                Section::make('OFS fiskalizacija')
                    ->schema($this->ofsFields())
                    ->columns(2)
                    ->collapsible(),
                Section::make('Mail')
                    ->schema($this->mailFields())
                    ->columns(2)
                    ->collapsible(),
                Section::make('Moduli')
                    ->schema($this->moduleFields())
                    ->columns(1)
                    ->collapsible(),
            ]);
    }

    /** @return list<\Filament\Forms\Components\Component> */
    private function documentFields(): array
    {
        return [
            Select::make('default_document_template')->label('Default šablon dokumenta')->options(DocumentTemplateEnum::class)->prefixIcon(Heroicon::OutlinedDocumentText),
            Select::make('default_document_language')->label('Default jezik dokumenta')->options(LanguageEnum::class),
            Textarea::make('default_document_notes')->label('Default napomene dokumenta')->rows(2),
            Textarea::make('default_invoice_notes')->label('Default napomene računa')->rows(2),
            TextInput::make('default_invoice_due_days')->label('Broj dana dospijeća računa')->numeric()->suffix('dana'),
            Textarea::make('default_proforma_notes')->label('Default napomene proforme')->rows(2),
            TextInput::make('default_proforma_due_days')->label('Broj dana dospijeća proforme')->numeric()->suffix('dana'),
            Textarea::make('default_quote_notes')->label('Default napomene ponude')->rows(2),
            TextInput::make('default_quote_due_days')->label('Broj dana dospijeća ponude')->numeric()->suffix('dana'),
        ];
    }

    /** @return list<\Filament\Forms\Components\Component> */
    private function numberingFields(): array
    {
        return [
            Toggle::make('document_numbering_reset_yearly')->label('Numeracija: reset godišnje'),
            TextInput::make('document_numbering_pad_zeros')->label('Numeracija: broj nula')->numeric()->minValue(0),
            TextInput::make('invoice_numbering_starting_number')->label('Račun: početni broj')->numeric()->minValue(0),
            TextInput::make('quote_numbering_starting_number')->label('Ponuda: početni broj')->numeric()->minValue(0),
            TextInput::make('proforma_numbering_starting_number')->label('Proforma: početni broj')->numeric()->minValue(0),
            TextInput::make('invoice_numbering_prefix')->label('Račun: prefiks'),
            TextInput::make('quote_numbering_prefix')->label('Ponuda: prefiks'),
            TextInput::make('proforma_numbering_prefix')->label('Proforma: prefiks'),
        ];
    }

    /** @return list<\Filament\Forms\Components\Component> */
    private function ofsFields(): array
    {
        return [
            TextInput::make('ofs_base_url')->label('OFS Base URL')->url()->placeholder('https://pos.ofs.ba/api'),
            TextInput::make('ofs_api_key')->label('OFS API ključ')->password(),
            TextInput::make('ofs_serial_number')->label('OFS Serijski broj'),
            TextInput::make('ofs_pac')->label('OFS PAC'),
            TextInput::make('ofs_seller_tin')->label('OFS PIB prodavatelja'),
            TextInput::make('ofs_seller_name')->label('OFS Naziv prodavatelja')->columnSpanFull(),
            TextInput::make('ofs_seller_address')->label('OFS Adresa')->columnSpanFull(),
            TextInput::make('ofs_seller_town')->label('OFS Mjesto'),
            Select::make('ofs_receipt_layout')->label('OFS Layout računa')->options(CompanySetting::getAllowedValues('ofs_receipt_layout') ? array_combine(CompanySetting::getAllowedValues('ofs_receipt_layout'), CompanySetting::getAllowedValues('ofs_receipt_layout')) : []),
            Select::make('ofs_receipt_image_format')->label('OFS Format slike')->options(CompanySetting::getAllowedValues('ofs_receipt_image_format') ? array_combine(CompanySetting::getAllowedValues('ofs_receipt_image_format'), CompanySetting::getAllowedValues('ofs_receipt_image_format')) : []),
            Toggle::make('ofs_print_receipt')->label('OFS Štampaj račun pri fiskalizaciji')->default(false),
            Toggle::make('ofs_render_receipt_image')->label('OFS Generiraj sliku računa'),
            Textarea::make('ofs_receipt_header_text_lines')->label('OFS Linije zaglavlja')->helperText('JSON niz stringova, npr. ["Linija 1","Linija 2"]')->rows(2),
            Select::make('ofs_device_mode')->label('OFS Način uređaja')->options(CompanySetting::getAllowedValues('ofs_device_mode') ? array_combine(CompanySetting::getAllowedValues('ofs_device_mode'), CompanySetting::getAllowedValues('ofs_device_mode')) : []),
            Select::make('ofs_default_payment_type')->label('OFS Default način plaćanja')->options(FiscalPaymentTypeEnum::class),
        ];
    }

    /** @return list<\Filament\Forms\Components\Component> */
    private function mailFields(): array
    {
        return [
            TextInput::make('mail_from_address')->label('Mail: Od adresa')->email(),
            TextInput::make('mail_from_name')->label('Mail: Od ime'),
            TextInput::make('mail_host')->label('Mail: SMTP host'),
            TextInput::make('mail_port')->label('Mail: SMTP port')->numeric()->minValue(1)->maxValue(65535),
            TextInput::make('mail_username')->label('Mail: SMTP korisnik'),
            TextInput::make('mail_password')->label('Mail: SMTP lozinka')->password(),
            Select::make('mail_encryption')->label('Mail: Šifriranje')->options(CompanySetting::getAllowedValues('mail_encryption') ? array_combine(CompanySetting::getAllowedValues('mail_encryption'), CompanySetting::getAllowedValues('mail_encryption')) : []),
        ];
    }

    /** @return list<\Filament\Forms\Components\Component> */
    private function moduleFields(): array
    {
        return [
            CheckboxList::make('menu_modules')->label('Menu moduli')->options(CompanyModuleEnum::options())->columns(2),
            CheckboxList::make('drawer_modules')->label('Drawer moduli')->options(CompanyModuleEnum::options())->columns(2),
        ];
    }

    protected function getRedirectUrl(): ?string
    {
        return $this->getResource()::getUrl('view', ['record' => $this->getRecord()]);
    }

    protected function getSavedNotificationTitle(): ?string
    {
        return 'Podešavanja spremljena';
    }
}
