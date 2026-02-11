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
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();

            // Address & Contact
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->default('BiH');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();

            // Legal
            $table->string('identification_number')->nullable(); // JIB
            $table->string('vat_number')->nullable(); // PDV ID

            $table->boolean('is_active')->default(false);
            $table->timestamp('subscription_ends_at')->nullable();



            $table->timestamps();
        });

        // Pivot table for User <-> Company (Many-to-Many)
        Schema::create('company_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete(); // TODO: check if cascadeOnDelete is correct
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // TODO: check if cascadeOnDelete is correct
            $table->timestamps();

            $table->unique(['company_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_user');
        Schema::dropIfExists('companies');
    }
};
