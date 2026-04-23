<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $columns = [
        'companies' => ['enabled_modules'],
        'articles' => ['prices_meta'],
        'invoices' => ['fiscal_meta'],
        'fiscal_records' => ['fiscal_meta'],
        'contracts' => ['file_paths'],
    ];

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach ($this->columns as $table => $cols) {
            foreach ($cols as $col) {
                DB::statement("ALTER TABLE \"{$table}\" ALTER COLUMN \"{$col}\" TYPE jsonb USING \"{$col}\"::jsonb");
            }
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach ($this->columns as $table => $cols) {
            foreach ($cols as $col) {
                DB::statement("ALTER TABLE \"{$table}\" ALTER COLUMN \"{$col}\" TYPE json USING \"{$col}\"::json");
            }
        }
    }
};
