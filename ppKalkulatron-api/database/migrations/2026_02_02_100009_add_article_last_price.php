<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->integer('last_unit_price')->nullable()->after('type');
            $table->foreignId('last_currency_id')->nullable()->after('last_unit_price')->constrained('currencies')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropForeign(['last_currency_id']);
            $table->dropColumn(['last_unit_price', 'last_currency_id']);
        });
    }
};
