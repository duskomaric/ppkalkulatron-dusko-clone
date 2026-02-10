<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->foreignId('bank_account_id')
                ->nullable()
                ->after('currency')
                ->constrained('bank_accounts')
                ->nullOnDelete();
        });

        Schema::table('proformas', function (Blueprint $table) {
            $table->foreignId('bank_account_id')
                ->nullable()
                ->after('currency')
                ->constrained('bank_accounts')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('bank_account_id');
        });

        Schema::table('proformas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('bank_account_id');
        });
    }
};
