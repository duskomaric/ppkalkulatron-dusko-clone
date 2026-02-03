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
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->string('contract_number');
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('draft');
            $table->string('language')->default('en');
            $table->date('date');
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();

            // Source tracking (polymorphic - for Quote)
            $table->string('source_type')->nullable(); // quote
            $table->unsignedBigInteger('source_id')->nullable();

            // Currency and template
            $table->string('currency')->default('BAM');
            $table->string('contract_template')->default('classic');

            // File storage (multiple files)
            $table->json('file_paths')->nullable(); // Array of file paths

            // Totals (pfening - integer)
            $table->integer('subtotal')->default(0);
            $table->integer('tax_total')->default(0);
            $table->integer('discount_total')->default(0);
            $table->integer('total')->default(0);

            $table->timestamps();

            $table->index(['source_type', 'source_id']);
            $table->index(['company_id', 'contract_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
