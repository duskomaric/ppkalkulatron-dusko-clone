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
        Schema::create('quotes', function (Blueprint $table) {
            $table->id();
            $table->string('quote_number');
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('created');
            $table->string('language')->default('en');
            $table->date('date');
            $table->date('valid_until');
            $table->text('notes')->nullable();

            // Currency and template
            $table->string('currency')->default('BAM');
            $table->string('quote_template')->default('classic');

            // Totals (pfening - integer)
            $table->integer('subtotal')->default(0);
            $table->integer('tax_total')->default(0);
            $table->integer('discount_total')->default(0);
            $table->integer('total')->default(0);

            $table->timestamps();

            $table->index(['company_id', 'quote_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotes');
    }
};
