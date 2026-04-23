<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->index(['company_id', 'date'], 'invoices_company_date_idx');
            $table->index(['company_id', 'status'], 'invoices_company_status_idx');
            $table->index(['company_id', 'created_at'], 'invoices_company_created_idx');
        });

        Schema::table('quotes', function (Blueprint $table) {
            $table->index(['company_id', 'date'], 'quotes_company_date_idx');
            $table->index(['company_id', 'status'], 'quotes_company_status_idx');
            $table->index(['company_id', 'created_at'], 'quotes_company_created_idx');
        });

        Schema::table('proformas', function (Blueprint $table) {
            $table->index(['company_id', 'date'], 'proformas_company_date_idx');
            $table->index(['company_id', 'status'], 'proformas_company_status_idx');
            $table->index(['company_id', 'created_at'], 'proformas_company_created_idx');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->index(['company_id', 'is_active'], 'clients_company_active_idx');
            $table->index(['company_id', 'created_at'], 'clients_company_created_idx');
        });

        Schema::table('income_book_entries', function (Blueprint $table) {
            $table->index(['company_id', 'booking_date'], 'income_entries_company_booking_idx');
            $table->index(['company_id', 'created_at'], 'income_entries_company_created_idx');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('invoices_company_date_idx');
            $table->dropIndex('invoices_company_status_idx');
            $table->dropIndex('invoices_company_created_idx');
        });

        Schema::table('quotes', function (Blueprint $table) {
            $table->dropIndex('quotes_company_date_idx');
            $table->dropIndex('quotes_company_status_idx');
            $table->dropIndex('quotes_company_created_idx');
        });

        Schema::table('proformas', function (Blueprint $table) {
            $table->dropIndex('proformas_company_date_idx');
            $table->dropIndex('proformas_company_status_idx');
            $table->dropIndex('proformas_company_created_idx');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->dropIndex('clients_company_active_idx');
            $table->dropIndex('clients_company_created_idx');
        });

        Schema::table('income_book_entries', function (Blueprint $table) {
            $table->dropIndex('income_entries_company_booking_idx');
            $table->dropIndex('income_entries_company_created_idx');
        });
    }
};

