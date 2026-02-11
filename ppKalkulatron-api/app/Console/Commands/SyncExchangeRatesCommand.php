<?php

namespace App\Console\Commands;

use App\Models\Currency;
use App\Models\ExchangeRate;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class SyncExchangeRatesCommand extends Command
{
    protected $signature = 'sync:exchange-rates';

    protected $description = 'Sync exchange rates from Fixer API (BAM base, pfening storage)';

    public function handle(): int
    {
        $apiKey = env('FIXER_API_KEY');

        if (! $apiKey) {
            $this->error('FIXER_API_KEY is missing');

            return self::FAILURE;
        }

        $currencies = Currency::distinct()->pluck('code')->toArray();

        $response = Http::get('http://data.fixer.io/api/latest', [
            'access_key' => $apiKey,
            //            'symbols' => 'BAM,EUR,USD',
            'symbols' => implode(',', $currencies),
        ]);

        if (! $response->successful()) {
            $this->error('Failed to fetch Fixer data');

            return self::FAILURE;
        }

        $data = $response->json();

        if (! ($data['success'] ?? false)) {
            $this->error('Fixer API error');

            return self::FAILURE;
        }

        $date = Carbon::parse($data['date']);

        /**
         * Fixer:
         * base = EUR
         * rates[BAM] = 1.95583
         */
        $eurToBam = (float) $data['rates']['BAM'];

        foreach ($data['rates'] as $currency => $eurRate) {
            if ($currency === 'BAM') {
                continue;
            }

            $rateToBam = $eurToBam / (float) $eurRate;

            ExchangeRate::updateOrCreate(
                ['currency' => $currency],
                [
                    'rate_to_bam' => $rateToBam,
                    'rate_date' => $date,
                ]
            );

            $this->line("{$currency} → {$rateToBam}");
        }

        // Upis BAM
        ExchangeRate::updateOrCreate(
            ['currency' => 'BAM'],
            [
                'rate_to_bam' => 1.0, // 1 BAM = 1 BAM
                'rate_date' => $date,
            ]
        );

        $this->info('Fixer exchange rates synced successfully.');

        return self::SUCCESS;
    }
}
