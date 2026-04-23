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
        Schema::create('income_book_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            
            $table->integer('entry_number');
            $table->date('booking_date');
            $table->string('description')->nullable();
            
            // Amount columns stored in pfening (integer)
            $table->integer('amount_services')->default(0);
            $table->integer('amount_goods')->default(0);
            $table->integer('amount_products')->default(0);
            $table->integer('amount_other_income')->default(0);
            $table->integer('amount_financial_income')->default(0);
            $table->integer('total_amount')->default(0);
            $table->integer('vat_amount')->default(0);
            
            // Banking information
            $table->foreignId('bank_account_id')->nullable()->constrained()->nullOnDelete();
            $table->date('payment_date')->nullable();
            $table->string('purpose_from_statement')->nullable();
            
            // Related invoice (if applied to an invoice)
            $table->foreignId('invoice_id')->nullable()->constrained()->nullOnDelete();
            
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['company_id', 'entry_number']);
            $table->index('booking_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('income_book_entries');
    }
};
