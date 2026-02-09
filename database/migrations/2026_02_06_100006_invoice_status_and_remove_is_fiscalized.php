<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Migrate is_fiscalized to status: open, fiscalized, refunded
        DB::table('invoices')->where('is_fiscalized', false)->update(['status' => 'created']);
        DB::table('invoices')->where('is_fiscalized', true)->update(['status' => 'fiscalized']);

        // Set refunded where fiscal_records has refund type
        $refundedIds = DB::table('fiscal_records')
            ->where('type', 'refund')
            ->pluck('invoice_id')
            ->unique();
        if ($refundedIds->isNotEmpty()) {
            DB::table('invoices')->whereIn('id', $refundedIds)->update(['status' => 'refunded']);
        }

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('is_fiscalized');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->boolean('is_fiscalized')->default(false)->after('payment_type');
        });

        DB::table('invoices')->whereIn('status', ['fiscalized', 'refunded'])->update(['is_fiscalized' => true]);
        DB::table('invoices')->where('status', 'created')->update(['is_fiscalized' => false]);
        DB::table('invoices')->whereNotIn('status', ['created', 'fiscalized', 'refunded'])->update(['is_fiscalized' => false]);
    }
};
