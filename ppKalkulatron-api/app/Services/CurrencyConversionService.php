<?php

namespace App\Services;

use App\Exceptions\NoExchangeRateForDateException;
use App\Models\Currency;
use App\Models\ExchangeRate;
use App\Models\Invoice;
use Carbon\Carbon;

class CurrencyConversionService
{
    /**
     * Convert amount in document currency to BAM (pfening).
     * Uses exchange rate for the given date, or latest available on or before that date.
     *
     * @throws NoExchangeRateForDateException when currency is not BAM and no rate exists for date (or earlier)
     */
    public function toBam(int $amountPfening, int $currencyId, Carbon|string $date): int
    {
        $currency = Currency::find($currencyId);
        if (! $currency) {
            return $amountPfening;
        }

        if (strtoupper($currency->code) === 'BAM') {
            return $amountPfening;
        }

        $date = $date instanceof Carbon ? $date : Carbon::parse($date);

        $rate = ExchangeRate::query()
            ->where('currency', $currency->code)
            ->where('rate_date', '<=', $date)
            ->orderByDesc('rate_date')
            ->first();

        if (! $rate) {
            throw new NoExchangeRateForDateException("Nema kursa za {$currency->code} na datum {$date->toDateString()} (ni za prethodne dane).");
        }

        return (int) round($amountPfening * (float) $rate->rate_to_bam);
    }

    /**
     * Fill BAM columns on invoice and its items. Uses invoice date and currency_id.
     * For BAM currency, copies existing amounts; otherwise converts via exchange rate.
     *
     * @throws NoExchangeRateForDateException when non-BAM and no rate for date
     */
    public function fillInvoiceBam(Invoice $invoice): void
    {
        $invoice->loadMissing(['items', 'currency']);
        $currencyId = (int) $invoice->currency_id;
        $date = $invoice->date;

        $currency = Currency::find($currencyId);
        $isBam = $currency && strtoupper($currency->code) === 'BAM';

        if ($isBam) {
            $invoice->subtotal_bam = $invoice->subtotal;
            $invoice->tax_total_bam = $invoice->tax_total;
            $invoice->discount_total_bam = $invoice->discount_total;
            $invoice->total_bam = $invoice->total;
            $invoice->saveQuietly();

            foreach ($invoice->items as $item) {
                $item->unit_price_bam = $item->unit_price;
                $item->subtotal_bam = $item->subtotal;
                $item->tax_amount_bam = $item->tax_amount;
                $item->total_bam = $item->total;
                $item->saveQuietly();
            }

            return;
        }

        $invoice->subtotal_bam = $this->toBam($invoice->subtotal, $currencyId, $date);
        $invoice->tax_total_bam = $this->toBam($invoice->tax_total, $currencyId, $date);
        $invoice->discount_total_bam = $this->toBam($invoice->discount_total, $currencyId, $date);
        $invoice->total_bam = $this->toBam($invoice->total, $currencyId, $date);
        $invoice->saveQuietly();

        foreach ($invoice->items as $item) {
            $item->unit_price_bam = $this->toBam($item->unit_price, $currencyId, $date);
            $item->subtotal_bam = $this->toBam($item->subtotal, $currencyId, $date);
            $item->tax_amount_bam = $this->toBam($item->tax_amount, $currencyId, $date);
            $item->total_bam = $this->toBam($item->total, $currencyId, $date);
            $item->saveQuietly();
        }
    }
}
