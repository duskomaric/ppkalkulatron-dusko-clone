<?php

namespace App\Console\Commands;

use App\Models\Enums\DocumentFrequencyEnum;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Invoice;
use App\Services\DocumentNumberService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GenerateRecurringInvoicesCommand extends Command
{
    protected $signature = 'invoices:generate-recurring';

    protected $description = 'Generate invoices from recurring templates';

    public function __construct(
        private DocumentNumberService $numberService
    ) {
        parent::__construct();
    }

    public function handle(): void
    {
        $recurringInvoices = Invoice::where('is_recurring', true)
            ->where('next_invoice_date', '<=', now())
            ->with(['items', 'client', 'company'])
            ->get();

        $this->info("Found {$recurringInvoices->count()} recurring invoices to generate.");

        foreach ($recurringInvoices as $invoice) {
            try {
                DB::transaction(function () use ($invoice) {
                    // Reserve invoice number
                    $numberData = $this->numberService->reserveNumber($invoice->company, 'invoice');

                    // Create new invoice
                    $newInvoice = Invoice::create([
                        'invoice_number' => $numberData['formatted'],
                        'company_id' => $invoice->company_id,
                        'client_id' => $invoice->client_id,
                        'status' => DocumentStatusEnum::Draft,
                        'language' => $invoice->language,
                        'date' => now(),
                        'due_date' => now()->addDays(30),
                        'notes' => $invoice->notes,
                        'parent_id' => $invoice->id,
                        'currency' => $invoice->currency,
                        'invoice_template' => $invoice->invoice_template,
                        'subtotal' => $invoice->subtotal,
                        'tax_total' => $invoice->tax_total,
                        'discount_total' => $invoice->discount_total,
                        'total' => $invoice->total,
                    ]);

                    // Copy items with snapshot data
                    foreach ($invoice->items as $item) {
                        $newInvoice->items()->create([
                            'article_id' => $item->article_id,
                            'name' => $item->name,
                            'description' => $item->description,
                            'quantity' => $item->quantity,
                            'unit_price' => $item->unit_price,
                            'subtotal' => $item->subtotal,
                            'tax_rate' => $item->tax_rate,
                            'tax_amount' => $item->tax_amount,
                            'total' => $item->total,
                        ]);
                    }

                    // Update next date on parent
                    $invoice->next_invoice_date = match ($invoice->frequency) {
                        DocumentFrequencyEnum::Weekly => $invoice->next_invoice_date->addWeek(),
                        DocumentFrequencyEnum::Monthly => $invoice->next_invoice_date->addMonth(),
                        DocumentFrequencyEnum::Quarterly => $invoice->next_invoice_date->addQuarter(),
                        DocumentFrequencyEnum::Yearly => $invoice->next_invoice_date->addYear(),
                        default => $invoice->next_invoice_date->addMonth(),
                    };
                    $invoice->save();

                    $this->info("Generated invoice {$newInvoice->invoice_number} for client: {$invoice->client->name}");
                });
            } catch (\Exception $e) {
                Log::error("Failed to generate recurring invoice for invoice ID {$invoice->id}: {$e->getMessage()}");
                $this->error("Failed to generate invoice for client: {$invoice->client->name} - {$e->getMessage()}");
            }
        }

        $this->info('Recurring invoice generation completed.');
    }
}
