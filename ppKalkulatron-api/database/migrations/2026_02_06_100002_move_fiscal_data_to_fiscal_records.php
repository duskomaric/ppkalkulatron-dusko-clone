<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $invoices = DB::table('invoices')
            ->where('is_fiscalized', true)
            ->whereNotNull('fiscal_invoice_number')
            ->get(['id', 'fiscal_invoice_number', 'fiscal_counter', 'fiscal_verification_url', 'fiscalized_at', 'fiscal_receipt_image_path', 'fiscal_meta']);

        foreach ($invoices as $inv) {
            DB::table('fiscal_records')->insert([
                'invoice_id' => $inv->id,
                'type' => 'original',
                'fiscal_invoice_number' => $inv->fiscal_invoice_number,
                'fiscal_counter' => $inv->fiscal_counter,
                'verification_url' => $inv->fiscal_verification_url,
                'fiscalized_at' => $inv->fiscalized_at,
                'fiscal_receipt_image_path' => $inv->fiscal_receipt_image_path,
                'fiscal_meta' => $inv->fiscal_meta ? json_encode($inv->fiscal_meta) : null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Data migration - no reverse
    }
};
