@php
    $formatAmount = fn ($pfening) => number_format($pfening / 100, 2, ',', '.');
    $currency = $proforma->currency ?? 'BAM';
@endphp
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="utf-8">
    <title>Predračun {{ $proforma->proforma_number }}</title>
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
                <div class="invoice-title">PREDRAČUN</div>
                <div class="invoice-number">{{ $proforma->proforma_number }}</div>
                <div class="meta" style="margin-top: 8px;">
                    {{ $proforma->date->format('d.m.Y') }}
                    @if($proforma->due_date)
                    &nbsp;·&nbsp; Dospijeće {{ $proforma->due_date->format('d.m.Y') }}
                    @endif
                </div>
            </div>
        </div>

        <div class="client-block">
            <div class="client-name">{{ $proforma->client?->name ?? '—' }}</div>
            @if($proforma->client?->address)<div class="meta">{{ $proforma->client->address }}</div>@endif
            @if($proforma->client?->city || $proforma->client?->zip)
                <div class="meta">{{ $proforma->client->zip }} {{ $proforma->client->city }}@if($proforma->client?->country), {{ $proforma->client->country }}@endif</div>
            @endif
            @if($proforma->client?->email)<div class="meta">{{ $proforma->client->email }}</div>@endif
        </div>

        <div class="meta" style="margin-bottom: 20px;">Valuta: {{ $currency }}</div>

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
                @foreach($proforma->items as $item)
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
                <tr><td class="meta">Osnovica</td><td class="text-right">{{ $formatAmount($proforma->subtotal) }} {{ $currency }}</td></tr>
                <tr><td class="meta">PDV</td><td class="text-right">{{ $formatAmount($proforma->tax_total) }} {{ $currency }}</td></tr>
                <tr><td class="grand-total">Ukupno</td><td class="text-right grand-total">{{ $formatAmount($proforma->total) }} {{ $currency }}</td></tr>
            </table>
        </div>

        @if($proforma->notes)
        <div class="notes">{{ $proforma->notes }}</div>
        @endif
    </div>
</body>
</html>
