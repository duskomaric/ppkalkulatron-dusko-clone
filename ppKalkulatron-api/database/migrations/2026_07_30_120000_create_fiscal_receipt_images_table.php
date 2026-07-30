<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Keep the receipt itself in the database.
     *
     * The host's filesystem is per-replica and is not kept across deployments, so a file written
     * during fiscalization is not there when someone later opens the receipt. The database is the
     * only storage this application already has that survives both.
     *
     * Its own table rather than a column on fiscal_records: invoice listings eager load
     * fiscalRecords, and a receipt column would be read on every one of those queries — around
     * 60 KB per record. Here it is only read when someone actually asks for a receipt.
     *
     * Stored base64 rather than binary on purpose: MySQL `blob` caps at 64 KB (receipts here
     * average 45 KB and reach 102 KB, so it would truncate), while `longText` behaves the same on
     * MySQL and PostgreSQL. The ~33% overhead is a few tens of KB per receipt.
     */
    public function up(): void
    {
        Schema::create('fiscal_receipt_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fiscal_record_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('extension', 8)->default('png'); // png | pdf | html, per ofs_receipt_image_format
            $table->longText('contents'); // base64
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fiscal_receipt_images');
    }
};
