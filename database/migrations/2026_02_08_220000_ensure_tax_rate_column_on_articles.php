<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('articles', 'tax_rate')) {
            return;
        }

        Schema::table('articles', function (Blueprint $table) {
            $table->string('tax_rate', 4)->nullable()->after('unit');
        });

        if (Schema::hasTable('tax_rates') && Schema::hasColumn('articles', 'tax_rate_id')) {
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
    }

    public function down(): void
    {
        if (Schema::hasColumn('articles', 'tax_rate')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->dropColumn('tax_rate');
            });
        }
    }
};
