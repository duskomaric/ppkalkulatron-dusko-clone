<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('currency_id')->nullable()->after('currency')->constrained()->nullOnDelete();
            $table->foreignId('bank_account_id')->nullable()->after('currency_id')->constrained('bank_accounts')->nullOnDelete();
        });

        // Migrate existing: set currency_id from Currency where company_id and code match
        $invoices = DB::table('invoices')->get();
        foreach ($invoices as $inv) {
            $currency = DB::table('currencies')
                ->where('company_id', $inv->company_id)
                ->where('code', $inv->currency)
                ->first();
            if ($currency) {
                DB::table('invoices')->where('id', $inv->id)->update(['currency_id' => $currency->id]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['currency_id']);
            $table->dropForeign(['bank_account_id']);
        });
    }
};
