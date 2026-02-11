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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number');
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete(); // null = račun bez klijenta
            $table->string('status')->default('created');
            $table->string('language')->default('en');
            $table->date('date');
            $table->date('due_date');
            $table->text('notes')->nullable();

            // Recurring
            $table->boolean('is_recurring')->default(false);
            $table->string('frequency')->nullable();
            $table->date('next_invoice_date')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('invoices')->nullOnDelete();

            // Source tracking (polymorphic)
            $table->string('source_type')->nullable(); // proforma, contract
            $table->unsignedBigInteger('source_id')->nullable();

            // Currency and template
            $table->string('currency')->default('BAM');
            $table->string('invoice_template')->default('classic');

            // Fiscal payment type (Cash, Card, WireTransfer, Check, Voucher, MobileMoney, Other)
            $table->string('payment_type', 32)->default('Cash');

            // Fiscal
            $table->boolean('is_fiscalized')->default(false);
            $table->string('fiscal_invoice_number')->nullable();
            $table->string('fiscal_counter', 64)->nullable(); // OFS vraća npr. "61876/67887ПП"
            $table->text('fiscal_verification_url')->nullable(); // URL može biti dugačak
            $table->timestamp('fiscalized_at')->nullable();
            $table->json('fiscal_meta')->nullable();
            $table->string('fiscal_receipt_image_path')->nullable(); // company-slug/mjesec/broj-fakture.png

            // Totals (pfening - integer)
            $table->integer('subtotal')->default(0);
            $table->integer('tax_total')->default(0);
            $table->integer('discount_total')->default(0);
            $table->integer('total')->default(0);

            $table->timestamps();

            $table->index(['source_type', 'source_id']);
            $table->index('parent_id');
            $table->index(['company_id', 'invoice_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
