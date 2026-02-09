<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn([
                'fiscal_invoice_number',
                'fiscal_counter',
                'fiscal_verification_url',
                'fiscalized_at',
                'fiscal_meta',
                'fiscal_receipt_image_path',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('fiscal_invoice_number')->nullable()->after('payment_type');
            $table->string('fiscal_counter', 64)->nullable()->after('fiscal_invoice_number');
            $table->text('fiscal_verification_url')->nullable()->after('fiscal_counter');
            $table->timestamp('fiscalized_at')->nullable()->after('fiscal_verification_url');
            $table->json('fiscal_meta')->nullable()->after('fiscalized_at');
            $table->string('fiscal_receipt_image_path')->nullable()->after('fiscal_meta');
        });
    }
};
