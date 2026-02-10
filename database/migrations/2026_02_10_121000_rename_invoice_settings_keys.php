<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $map = [
            'default_invoice_template' => 'default_document_template',
            'default_invoice_due_days' => 'default_document_due_days',
            'default_invoice_language' => 'default_document_language',
            'default_invoice_currency' => 'default_document_currency',
            'default_invoice_notes' => 'default_document_notes',
            'invoice_numbering_reset_yearly' => 'document_numbering_reset_yearly',
            'invoice_numbering_pad_zeros' => 'document_numbering_pad_zeros',
            'invoice_numbering_starting_number' => 'document_numbering_starting_number',
            'invoice_numbering_prefix' => 'document_numbering_prefix',
        ];

        foreach ($map as $old => $new) {
            DB::table('company_settings')->where('key', $old)->update(['key' => $new]);
        }
    }

    public function down(): void
    {
        $map = [
            'default_document_template' => 'default_invoice_template',
            'default_document_due_days' => 'default_invoice_due_days',
            'default_document_language' => 'default_invoice_language',
            'default_document_currency' => 'default_invoice_currency',
            'default_document_notes' => 'default_invoice_notes',
            'document_numbering_reset_yearly' => 'invoice_numbering_reset_yearly',
            'document_numbering_pad_zeros' => 'invoice_numbering_pad_zeros',
            'document_numbering_starting_number' => 'invoice_numbering_starting_number',
            'document_numbering_prefix' => 'invoice_numbering_prefix',
        ];

        foreach ($map as $old => $new) {
            DB::table('company_settings')->where('key', $old)->update(['key' => $new]);
        }
    }
};
