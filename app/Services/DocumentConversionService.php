<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Proforma;
use App\Models\Quote;

class DocumentConversionService
{
    /**
     * Convert Quote to Proforma
     */
    public function convertQuoteToProforma(Quote $quote): Proforma
    {
        $proforma = Proforma::create([
            'proforma_number' => '', // Will be set by DocumentNumberService
            'company_id' => $quote->company_id,
            'client_id' => $quote->client_id,
            'status' => 'draft',
            'language' => $quote->language,
            'date' => now(),
            'due_date' => $quote->valid_until,
            'notes' => $quote->notes,
            'source_type' => Quote::class,
            'source_id' => $quote->id,
            'currency' => $quote->currency,
            'proforma_template' => $quote->quote_template,
            'subtotal' => $quote->subtotal,
            'tax_total' => $quote->tax_total,
            'discount_total' => $quote->discount_total,
            'total' => $quote->total,
        ]);

        // Copy items with snapshot data
        foreach ($quote->items as $quoteItem) {
            $proforma->items()->create([
                'article_id' => $quoteItem->article_id,
                'name' => $quoteItem->name,
                'description' => $quoteItem->description,
                'quantity' => $quoteItem->quantity,
                'unit_price' => $quoteItem->unit_price,
                'subtotal' => $quoteItem->subtotal,
                'tax_rate' => $quoteItem->tax_rate,
                'tax_amount' => $quoteItem->tax_amount,
                'total' => $quoteItem->total,
            ]);
        }

        return $proforma;
    }

    /**
     * Convert Proforma to Invoice
     */
    public function convertProformaToInvoice(Proforma $proforma): Invoice
    {
        $invoice = Invoice::create([
            'invoice_number' => '', // Will be set by DocumentNumberService
            'company_id' => $proforma->company_id,
            'client_id' => $proforma->client_id,
            'status' => 'draft',
            'language' => $proforma->language,
            'date' => now(),
            'due_date' => $proforma->due_date,
            'notes' => $proforma->notes,
            'source_type' => Proforma::class,
            'source_id' => $proforma->id,
            'currency' => $proforma->currency,
            'invoice_template' => $proforma->proforma_template,
            'subtotal' => $proforma->subtotal,
            'tax_total' => $proforma->tax_total,
            'discount_total' => $proforma->discount_total,
            'total' => $proforma->total,
        ]);

        // Copy items with snapshot data
        foreach ($proforma->items as $proformaItem) {
            $invoice->items()->create([
                'article_id' => $proformaItem->article_id,
                'name' => $proformaItem->name,
                'description' => $proformaItem->description,
                'quantity' => $proformaItem->quantity,
                'unit_price' => $proformaItem->unit_price,
                'subtotal' => $proformaItem->subtotal,
                'tax_rate' => $proformaItem->tax_rate,
                'tax_amount' => $proformaItem->tax_amount,
                'total' => $proformaItem->total,
            ]);
        }

        return $invoice;
    }

    /**
     * Convert Contract to Invoice
     */
    public function convertContractToInvoice(Contract $contract): Invoice
    {
        $invoice = Invoice::create([
            'invoice_number' => '', // Will be set by DocumentNumberService
            'company_id' => $contract->company_id,
            'client_id' => $contract->client_id,
            'status' => 'draft',
            'language' => $contract->language,
            'date' => now(),
            'due_date' => $contract->due_date,
            'notes' => $contract->notes,
            'source_type' => Contract::class,
            'source_id' => $contract->id,
            'currency' => $contract->currency,
            'invoice_template' => $contract->contract_template,
            'subtotal' => $contract->subtotal,
            'tax_total' => $contract->tax_total,
            'discount_total' => $contract->discount_total,
            'total' => $contract->total,
        ]);

        // Copy items with snapshot data
        foreach ($contract->items as $contractItem) {
            $invoice->items()->create([
                'article_id' => $contractItem->article_id,
                'name' => $contractItem->name,
                'description' => $contractItem->description,
                'quantity' => $contractItem->quantity,
                'unit_price' => $contractItem->unit_price,
                'subtotal' => $contractItem->subtotal,
                'tax_rate' => $contractItem->tax_rate,
                'tax_amount' => $contractItem->tax_amount,
                'total' => $contractItem->total,
            ]);
        }

        return $invoice;
    }
}
