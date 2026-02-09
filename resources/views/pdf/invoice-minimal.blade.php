@php
    $formatAmount = fn ($pfening) => number_format($pfening / 100, 2, ',', '.');
    $currency = $invoice->currencyRelation?->code ?? $invoice->currency ?? 'BAM';
@endphp
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="utf-8">
    <title>Faktura {{ $invoice->invoice_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 9pt; color: #374151; line-height: 1.5; }
        .page { padding: 32px; }
        .header { display: table; width: 100%; margin-bottom: 36px; }
        .header-left { display: table-cell; width: 60%; vertical-align: top; }
        .header-right { display: table-cell; width: 40%; vertical-align: top; text-align: right; }
        .company-name { font-size: 16pt; font-weight: bold; color: #111827; margin-bottom: 4px; }
        .meta { font-size: 8pt; color: #9ca3af; }
        .invoice-title { font-size: 24pt; font-weight: bold; letter-spacing: 0.15em; color: #111827; }
        .invoice-number { font-size: 10pt; color: #9ca3af; margin-top: 4px; }
        .client-block { margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; }
        .client-name { font-weight: bold; font-size: 11pt; color: #111827; }
        table.items { width: 100%; border-collapse: collapse; margin: 24px 0; }
        table.items th { text-align: left; padding: 8px 6px; border-bottom: 1px solid #e5e7eb; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; }
        table.items td { padding: 10px 6px; border-bottom: 1px solid #f3f4f6; }
        table.items .text-right { text-align: right; }
        .totals { margin-top: 32px; }
        .totals table { width: 240px; margin-left: auto; }
        .totals td { border: none; padding: 4px 0; }
        .grand-total { font-size: 14pt; font-weight: bold; padding-top: 12px; margin-top: 8px; border-top: 2px solid #f59e0b; color: #111827; }
        .notes { margin-top: 32px; font-size: 8pt; color: #6b7280; }
        .fiscal { margin-top: 24px; font-size: 8pt; color: #6b7280; }
        .fiscal a { color: #f59e0b; }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="header-left">
                <div class="company-name">{{ $company->name }}</div>
                <div class="meta">
                    @if($company->address){{ $company->address }} &nbsp;·&nbsp; @endif
                    @if($company->postal_code || $company->city)
                        {{ $company->postal_code }} {{ $company->city }}@if($company->country), {{ $company->country }}@endif
                    @endif
                    @if($company->identification_number) &nbsp;·&nbsp; JIB {{ $company->identification_number }}@endif
                </div>
            </div>
            <div class="header-right">
                <div class="invoice-title">FAKTURA</div>
                <div class="invoice-number">{{ $invoice->invoice_number }}</div>
                <div class="meta" style="margin-top: 8px;">{{ $invoice->date->format('d.m.Y') }} &nbsp;·&nbsp; Dospijeće {{ $invoice->due_date->format('d.m.Y') }}</div>
            </div>
        </div>

        <div class="client-block">
            <div class="client-name">{{ $invoice->client?->name ?? '—' }}</div>
            @if($invoice->client?->address)<div class="meta">{{ $invoice->client->address }}</div>@endif
            @if($invoice->client?->city || $invoice->client?->zip)
                <div class="meta">{{ $invoice->client->zip }} {{ $invoice->client->city }}@if($invoice->client?->country), {{ $invoice->client->country }}@endif</div>
            @endif
            @if($invoice->client?->email)<div class="meta">{{ $invoice->client->email }}</div>@endif
        </div>

        @if($invoice->bankAccount)
        <div class="meta" style="margin-bottom: 20px;">{{ $invoice->bankAccount->bank_name }} · {{ $invoice->bankAccount->account_number }}</div>
        @endif

        <table class="items">
            <thead>
                <tr>
                    <th>Stavka</th>
                    <th class="text-right">Kol.</th>
                    <th class="text-right">Jed. cijena</th>
                    <th class="text-right">Ukupno</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->items as $item)
                <tr>
                    <td>
                        {{ $item->name }}
                        @if($item->description)<br><span style="font-size: 8pt; color: #9ca3af;">{{ $item->description }}</span>@endif
                    </td>
                    <td class="text-right">{{ $item->quantity }}</td>
                    <td class="text-right">{{ $formatAmount($item->quantity > 0 ? $item->total / $item->quantity : 0) }} {{ $currency }}</td>
                    <td class="text-right"><strong>{{ $formatAmount($item->total) }} {{ $currency }}</strong></td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals">
            <table>
                <tr><td class="meta">Osnovica</td><td class="text-right">{{ $formatAmount($invoice->subtotal) }} {{ $currency }}</td></tr>
                <tr><td class="meta">PDV</td><td class="text-right">{{ $formatAmount($invoice->tax_total) }} {{ $currency }}</td></tr>
                <tr><td class="grand-total">Ukupno</td><td class="text-right grand-total">{{ $formatAmount($invoice->total) }} {{ $currency }}</td></tr>
            </table>
        </div>

        @if($invoice->notes)
        <div class="notes">{{ $invoice->notes }}</div>
        @endif

        @if($invoice->fiscal_verification_url || $invoice->fiscal_invoice_number)
        <div class="fiscal">
            @if($invoice->fiscal_invoice_number)
            {{ $invoice->fiscal_invoice_number }}
            @endif
            @if($invoice->fiscal_verification_url)
            &nbsp;·&nbsp; <a href="{{ $invoice->fiscal_verification_url }}">Verifikacija</a>
            @endif
        </div>
        @endif
    </div>
</body>
</html>
