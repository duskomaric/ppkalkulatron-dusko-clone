<?php

namespace Tests\Feature;

use App\Models\Currency;
use App\Models\ExchangeRate;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SyncExchangeRatesCommandTest extends TestCase
{
    public function test_sync_exchange_rates_fetches_fixer_and_updates_exchange_rates(): void
    {
        putenv('FIXER_API_KEY=test-key');
        $_ENV['FIXER_API_KEY'] = 'test-key';

        Currency::factory()->bam()->create();
        Currency::factory()->usd()->create();
        Currency::factory()->eur()->create();

        Http::fake([
            'http://data.fixer.io/api/latest*' => Http::response([
                'success' => true,
                'date' => '2026-01-01',
                'rates' => [
                    'BAM' => 1.95583,
                    'USD' => 1.10,
                    'EUR' => 1.0,
                ],
            ], 200),
        ]);

        $exitCode = $this->artisan('sync:exchange-rates')->run();

        $this->assertSame(0, $exitCode);

        $this->assertDatabaseHas('exchange_rates', [
            'currency' => 'BAM',
            'rate_to_bam' => 1.0,
            'rate_date' => '2026-01-01',
        ]);

        $this->assertDatabaseHas('exchange_rates', [
            'currency' => 'EUR',
            'rate_to_bam' => 1.95583,
            'rate_date' => '2026-01-01',
        ]);

        $usdRate = ExchangeRate::query()->where('currency', 'USD')->firstOrFail();
        $this->assertSame('2026-01-01', $usdRate->rate_date);
        $this->assertTrue(abs(((float) $usdRate->rate_to_bam) - (1.95583 / 1.10)) < 0.00001);
    }
}
