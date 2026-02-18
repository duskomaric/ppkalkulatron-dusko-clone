<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\HasKeyValueSettings;

class CompanySetting extends Model
{
    use HasKeyValueSettings;

    protected $table = 'company_settings';

    protected $fillable = [
        'key',
        'value',
        'company_id',
    ];

    protected static string $cacheKey = 'company_settings_cache';

    protected static array $cachedSettings = [];

    protected static string $ownerKey = 'company_id';

    protected static string $configKey = 'company_settings';

    protected static array $castsTo = [
        'default_document_template' => 'string',
        'default_document_due_days' => 'integer',
        'default_document_language' => 'string',
        'default_document_notes' => 'string',
        'default_invoice_notes' => 'string',
        'default_proforma_notes' => 'string',
        'default_quote_notes' => 'string',
        'document_numbering_reset_yearly' => 'boolean',
        'document_numbering_pad_zeros' => 'integer',
        'invoice_numbering_starting_number' => 'integer',
        'quote_numbering_starting_number' => 'integer',
        'proforma_numbering_starting_number' => 'integer',
        'document_numbering_prefix' => 'string',
        'invoice_numbering_prefix' => 'string',
        'quote_numbering_prefix' => 'string',
        'proforma_numbering_prefix' => 'string',

        //OFS fiscal
        'ofs_base_url' => 'string', //https://pos.ofs.ba/api
        'ofs_api_key' => 'string', //Bearer: Authorization ZZZ (gde je ZZZ = API key uređaja)
        'ofs_serial_number' => 'string', //F41AEFFF110A4B5ABB266299A41EE479
        'ofs_pac' => 'string', //123456
        'ofs_seller_tin' => 'string', //
        'ofs_seller_name' => 'string',
        'ofs_seller_address' => 'string',
        'ofs_seller_town' => 'string',

        // Receipt/print settings - zavise od cloud vs lokalni uređaj
        'ofs_receipt_layout' => 'string', // Slip | Invoice - Slip=termalni, Invoice=A4
        'ofs_receipt_image_format' => 'string', // Png/Pdf - format slike računa
        'ofs_render_receipt_image' => 'boolean', // da li generisati sliku računa
        'ofs_receipt_header_text_lines' => 'array', // linije teksta u zaglavlju
        'ofs_device_mode' => 'string', // cloud | local - način korištenja (cloud = pos.ofs.ba, local = fizički ESIR)

        // Default za fiskalizaciju
        'ofs_default_payment_type' => 'string', // Cash, Card, WireTransfer, itd.

        // Mail - ako nije podešeno, koristi se default iz .env
        'mail_from_address' => 'string',
        'mail_from_name' => 'string',
        // SMTP (slanje iz vlastitog inboxa) - ako je mail_host podešeno, koristi se umjesto .env
        'mail_host' => 'string',
        'mail_port' => 'integer',
        'mail_username' => 'string',
        'mail_password' => 'string',
        'mail_encryption' => 'string', // tls | ssl | null

        //API je identičan kao i za lokalni ESIR (opisan na api.ofs.ba sajtu)
        //API se nalazi na URL-u https://pos.ofs.ba/api (npr. podešavanja su na https://pos.ofs.ba/api/settings ).
        //Jedina razlika u odnosu na lokalni ESIR je što se u svaki HTTP zahtev koji šalje klijent moraju dodati sledeća tri polja:
        //Bearer: Authorization ZZZ (gde je ZZZ = API key uređaja)
        //X-Teron-SerialNumber: XXX (gde je XXX = serijski broj uređaja)
        //X-PAC: YYY (gde je YYY = PAK sertifikata)
        //Poslati parametre korisniku i svakom su drugačiji, a za ovaj slučaj je
        //
        //Serijski broj
        //F41AEFFF110A4B5ABB266299A41EE479
        //API ključ
        //bb7584a167578b89c459d6ab1759b0cc
        //PAK
        //123456
        //
        //Ukoliko se testira veleprodaja, dodatno je
        //Za Veleprodaju je neophodna da u polje ID Kupca pošaljete prefix latinicom VP: sa JIBom kupca. Ukoliko je kupac strano lice koristi se. npr. "buyerId": " VP:9999999999999"
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
