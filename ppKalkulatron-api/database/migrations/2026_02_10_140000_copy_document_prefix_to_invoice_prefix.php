<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Copy document_numbering_prefix -> invoice_numbering_prefix,
     * document_numbering_starting_number -> invoice_numbering_starting_number for existing companies.
     */
    public function up(): void
    {
        $prefixRows = DB::table('company_settings')
            ->where('key', 'document_numbering_prefix')
            ->whereNotNull('value')
            ->where('value', '!=', '')
            ->get(['company_id', 'value']);

        foreach ($prefixRows as $row) {
            DB::table('company_settings')->updateOrInsert(
                [
                    'company_id' => $row->company_id,
                    'key' => 'invoice_numbering_prefix',
                ],
                ['value' => $row->value]
            );
        }

        $startRows = DB::table('company_settings')
            ->where('key', 'document_numbering_starting_number')
            ->get(['company_id', 'value']);

        foreach ($startRows as $row) {
            $val = (int) json_decode($row->value, true) ?: 1;
            if ($val !== 1) {
                DB::table('company_settings')->updateOrInsert(
                    [
                        'company_id' => $row->company_id,
                        'key' => 'invoice_numbering_starting_number',
                    ],
                    ['value' => json_encode($val)]
                );
            }
        }
    }

    public function down(): void
    {
        DB::table('company_settings')->where('key', 'invoice_numbering_prefix')->delete();
        DB::table('company_settings')->where('key', 'invoice_numbering_starting_number')->delete();
    }
};
