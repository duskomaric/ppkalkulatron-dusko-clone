<?php

return [

    'menu_modules' => ['invoices', 'clients', 'articles'],
    'drawer_modules' => ['quotes', 'proformas', 'incomes'],

    'default_document_template' => 'classic',
    'default_document_language' => 'sr_Latn',
    'default_document_notes' => '',
    'default_invoice_notes' => '',
    'default_invoice_due_days' => 14,
    'default_proforma_notes' => '',
    'default_proforma_due_days' => 14,
    'default_quote_notes' => '',
    'default_quote_due_days' => 14,
    'document_numbering_reset_yearly' => true,
    'document_numbering_pad_zeros' => 4,
    'invoice_numbering_starting_number' => 1,
    'quote_numbering_starting_number' => 1,
    'proforma_numbering_starting_number' => 1,
    'invoice_numbering_prefix' => '',
    'quote_numbering_prefix' => '',
    'proforma_numbering_prefix' => '',

//    fiscal settings

    'ofs_base_url' => 'https://pos.ofs.ba',
    'ofs_pac' => '123456',
    'ofs_api_key' => 'bb7584a167578b89c459d6ab1759b0cc',
    'ofs_serial_number' => 'F41AEFFF110A4B5ABB266299A41EE479',

    // Receipt/print settings - zavise od cloud vs lokalni uređaj
    'ofs_receipt_layout' => 'Slip', // Slip | Invoice - Slip=termalni, Invoice=A4
    'ofs_receipt_image_format' => 'Png', // Png/Pdf - format slike računa
    'ofs_render_receipt_image' => true, // da li generisati sliku računa
    'ofs_device_mode' => 'cloud', // cloud | local - način korištenja (cloud = pos.ofs.ba, local = fizički ESIR)

    'ofs_default_payment_type' => \App\Models\Enums\FiscalPaymentTypeEnum::WireTransfer->value,
];
