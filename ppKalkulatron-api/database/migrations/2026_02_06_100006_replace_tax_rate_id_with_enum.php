<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->string('tax_rate', 4)->nullable()->after('unit');
        });

        $idToLabel = DB::table('tax_rates')->pluck('label', 'id')->toArray();

        foreach (DB::table('articles')->whereNotNull('tax_rate_id')->get() as $article) {
            $label = $idToLabel[$article->tax_rate_id] ?? 'A';
            DB::table('articles')->where('id', $article->id)->update(['tax_rate' => $label]);
        }

        Schema::table('articles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tax_rate_id');
        });

        Schema::dropIfExists('tax_rates');
    }

    public function down(): void
    {
        Schema::create('tax_rates', function (Blueprint $table) {
            $table->id();
            $table->string('label', 4);
            $table->unsignedTinyInteger('rate')->default(0);
            $table->string('category_name', 32)->nullable();
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

        Schema::table('articles', function (Blueprint $table) {
            $table->foreignId('tax_rate_id')->nullable()->after('unit')->constrained()->nullOnDelete();
        });

        $labelToId = DB::table('tax_rates')->pluck('id', 'label')->toArray();
        foreach (DB::table('articles')->whereNotNull('tax_rate')->get() as $article) {
            $label = $article->tax_rate ?? 'A';
            $id = $labelToId[$label] ?? $labelToId['A'] ?? null;
            if ($id) {
                DB::table('articles')->where('id', $article->id)->update(['tax_rate_id' => $id]);
            }
        }

        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn('tax_rate');
        });
    }
};
