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
        Schema::create('contract_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->foreignId('article_id')->nullable()->constrained()->nullOnDelete();

            // Snapshot data
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('quantity')->default(1);

            // Monetary snapshot (pfening - integer)
            $table->integer('unit_price')->default(0);
            $table->integer('subtotal')->default(0);
            $table->integer('tax_rate')->default(0); // e.g., 1700 = 17.00%
            $table->integer('tax_amount')->default(0);
            $table->integer('total')->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contract_items');
    }
};
