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
            $table->foreignId('tax_rate_id')->nullable()->after('unit')->constrained()->nullOnDelete();
        });

        // Map old tax_category (F,N,P,E,T,A,B,C) to tax_rates
        $labelToId = DB::table('tax_rates')->pluck('id', 'label')->toArray();

        foreach (DB::table('articles')->get() as $article) {
            $label = $article->tax_category && isset($labelToId[$article->tax_category])
                ? $article->tax_category
                : 'A';
            DB::table('articles')->where('id', $article->id)->update(['tax_rate_id' => $labelToId[$label]]);
        }

        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn('tax_category');
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->string('tax_category')->nullable()->after('unit');
        });

        $idToLabel = DB::table('tax_rates')->pluck('label', 'id')->toArray();

        foreach (DB::table('articles')->whereNotNull('tax_rate_id')->get() as $article) {
            $label = $idToLabel[$article->tax_rate_id] ?? 'A';
            DB::table('articles')->where('id', $article->id)->update(['tax_category' => $label]);
        }

        Schema::table('articles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tax_rate_id');
        });
    }
};
