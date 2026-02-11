<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tax_rates', function (Blueprint $table) {
            $table->id();
            $table->string('label', 4); // F, N, P, E, T, A, B, C - OFS label
            $table->unsignedTinyInteger('rate')->default(0); // 11, 0, 40, 6, 2, 9, ... (percentage)
            $table->string('category_name', 32)->nullable(); // ECAL, N-TAX, PBL, VAT, ...
            $table->timestamps();

            $table->unique('label');
        });

        $rates = [
            ['label' => 'F', 'rate' => 11, 'category_name' => 'ECAL'],
            ['label' => 'N', 'rate' => 0, 'category_name' => 'N-TAX'],
            ['label' => 'P', 'rate' => 40, 'category_name' => 'PBL'],
            ['label' => 'E', 'rate' => 6, 'category_name' => 'STT'],
            ['label' => 'T', 'rate' => 2, 'category_name' => 'TOTL'],
            ['label' => 'A', 'rate' => 9, 'category_name' => 'VAT'],
            ['label' => 'B', 'rate' => 0, 'category_name' => 'VAT'],
            ['label' => 'C', 'rate' => 0, 'category_name' => 'VAT-EXCL'],
        ];
        foreach ($rates as $r) {
            DB::table('tax_rates')->insert(array_merge($r, ['created_at' => now(), 'updated_at' => now()]));
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_rates');
    }
};
