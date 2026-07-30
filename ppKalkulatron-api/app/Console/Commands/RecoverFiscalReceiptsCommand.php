<?php

namespace App\Console\Commands;

use App\Models\FiscalRecord;
use App\Services\FiscalReceiptStore;
use App\Services\OFSService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Recover receipts whose file was lost with the filesystem, by asking OFS for the original
 * response again. OFS only keeps the last 100 requests, so older receipts are unrecoverable —
 * the command says which ones those are instead of leaving it a mystery.
 */
class RecoverFiscalReceiptsCommand extends Command
{
    protected $signature = 'fiscal:recover-receipts
        {--company= : Limit to one company slug}
        {--limit=100 : How many records to try, newest first}
        {--dry-run : Report what would be recovered without writing}';

    protected $description = 'Re-fetch fiscal receipt images from OFS for records whose content is missing';

    public function handle(FiscalReceiptStore $receipts): int
    {
        $records = FiscalRecord::query()
            ->with(['receiptImage', 'invoice.company'])
            ->whereDoesntHave('receiptImage')
            ->whereNotNull('request_id')
            ->when($this->option('company'), function ($query, $slug) {
                $query->whereHas('invoice.company', fn ($q) => $q->where('slug', $slug));
            })
            ->latest('fiscalized_at')
            ->limit(max(1, (int) $this->option('limit')))
            ->get()
            // A record may still have its file on the legacy disk — nothing to recover then.
            ->reject(fn (FiscalRecord $record) => $receipts->has($record))
            ->values();

        if ($records->isEmpty()) {
            $this->info('Nothing to recover — every fiscal record has its receipt.');

            return self::SUCCESS;
        }

        $this->info("Trying to recover {$records->count()} receipt(s) from OFS.");

        $dryRun = (bool) $this->option('dry-run');
        $recovered = 0;
        $unavailable = [];

        foreach ($records as $record) {
            $company = $record->invoice?->company;

            if (! $company) {
                $unavailable[] = [$record->id, '-', 'invoice or company is gone'];
                continue;
            }

            try {
                $response = (new OFSService($company))->getInvoiceByRequestId($record->request_id);
            } catch (\Throwable $e) {
                $unavailable[] = [$record->id, $company->slug, 'OFS call failed: '.$e->getMessage()];
                continue;
            }

            if (! $response->successful()) {
                $unavailable[] = [$record->id, $company->slug, 'OFS returned '.$response->status()];
                continue;
            }

            $receipt = $receipts->extractFrom($response->json() ?? []);

            if ($receipt === null) {
                // Most likely the request has aged out of the last 100 OFS keeps.
                $unavailable[] = [$record->id, $company->slug, 'no image in OFS response'];
                continue;
            }

            if (! $dryRun) {
                $receipts->store($record, $receipt['binary'], $receipt['extension']);
            }

            $recovered++;
            $this->line("  ✓ record {$record->id} ({$company->slug}) — ".strlen($receipt['binary']).' bytes');
        }

        if ($unavailable !== []) {
            $this->newLine();
            $this->warn('Could not recover '.count($unavailable).' receipt(s):');
            $this->table(['Record', 'Company', 'Reason'], $unavailable);

            Log::warning('Fiscal receipt recovery left records without a receipt', [
                'count' => count($unavailable),
                'record_ids' => array_column($unavailable, 0),
            ]);
        }

        $this->newLine();
        $this->info($dryRun
            ? "Dry run: {$recovered} receipt(s) could be recovered."
            : "Recovered {$recovered} receipt(s).");

        return self::SUCCESS;
    }
}
