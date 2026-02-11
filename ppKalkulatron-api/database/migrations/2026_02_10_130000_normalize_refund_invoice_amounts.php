<?php

use App\Models\Enums\DocumentStatusEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $refundStatuses = [
            DocumentStatusEnum::RefundCreated->value,
            DocumentStatusEnum::Refunded->value,
        ];

        DB::table('invoices')
            ->whereIn('status', $refundStatuses)
            ->update([
                'subtotal' => DB::raw('ABS(subtotal)'),
                'tax_total' => DB::raw('ABS(tax_total)'),
                'discount_total' => DB::raw('ABS(discount_total)'),
                'total' => DB::raw('ABS(total)'),
            ]);

        DB::table('invoice_items')
            ->whereIn('invoice_id', function ($query) use ($refundStatuses) {
                $query->select('id')
                    ->from('invoices')
                    ->whereIn('status', $refundStatuses);
            })
            ->update([
                'unit_price' => DB::raw('ABS(unit_price)'),
                'subtotal' => DB::raw('ABS(subtotal)'),
                'tax_amount' => DB::raw('ABS(tax_amount)'),
                'total' => DB::raw('ABS(total)'),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Data normalization is not reversible.
    }
};
