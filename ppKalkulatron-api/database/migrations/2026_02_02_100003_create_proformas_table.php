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
        Schema::create('proformas', function (Blueprint $table) {
            $table->id();
            $table->string('proforma_number');
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('created');
            $table->string('language')->default('en');
            $table->date('date');
            $table->date('due_date');
            $table->text('notes')->nullable();

            // Source tracking (polymorphic - for Quote)
            $table->string('source_type')->nullable(); // quote
            $table->unsignedBigInteger('source_id')->nullable();

            // Currency and template
            $table->foreignId('currency_id')->nullable()->constrained()->nullOnDelete();
            $table->string('proforma_template')->default('classic');

            // Totals (pfening - integer)
            $table->integer('subtotal')->default(0);
            $table->integer('tax_total')->default(0);
            $table->integer('discount_total')->default(0);
            $table->integer('total')->default(0);

            $table->timestamps();

            $table->index(['source_type', 'source_id']);
            $table->index(['company_id', 'proforma_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proformas');
    }
};
