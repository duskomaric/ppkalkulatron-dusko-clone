<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fiscal_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->string('type', 16); // original, copy, refund
            $table->string('fiscal_invoice_number')->nullable();
            $table->string('fiscal_counter', 64)->nullable();
            $table->string('request_id', 64)->nullable();
            $table->text('verification_url')->nullable();
            $table->timestamp('fiscalized_at')->nullable();
            $table->string('fiscal_receipt_image_path')->nullable();
            $table->json('fiscal_meta')->nullable();
            $table->timestamps();

            $table->index(['invoice_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fiscal_records');
    }
};
