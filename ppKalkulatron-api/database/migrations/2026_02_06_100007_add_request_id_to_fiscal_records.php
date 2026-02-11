<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fiscal_records', function (Blueprint $table) {
            $table->string('request_id', 64)->nullable()->after('fiscal_counter');
        });
    }

    public function down(): void
    {
        Schema::table('fiscal_records', function (Blueprint $table) {
            $table->dropColumn('request_id');
        });
    }
};
