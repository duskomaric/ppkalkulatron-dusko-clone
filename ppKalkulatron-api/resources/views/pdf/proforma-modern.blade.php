@php
    $formatAmount = fn ($pfening) => number_format($pfening / 100, 2, ',', '.');
    $currency = $proforma->currency?->code ?? 'BAM';
@endphp
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="utf-8">
    <title>Predračun {{ $proforma->proforma_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 10pt; color: #1f2937; line-height: 1.5; }
        .page { padding: 28px; }
        .header { background: #111827; color: #fff; padding: 28px; margin: -28px -28px 28px -28px; border-radius: 0 0 16px 16px; }
        .header-inner { display: table; width: 100%; }
        .header-left { display: table-cell; width: 55%; vertical-align: top; }
        .header-right { display: table-cell; width: 45%; vertical-align: top; text-align: right; }
        .company-name { font-size: 20pt; font-weight: bold; color: #fff; margin-bottom: 8px; }
        .company-meta { font-size: 9pt; color: #9ca3af; }
        .invoice-badge { display: inline-block; background: #f59e0b; color: #fff; font-size: 12pt; font-weight: bold; padding: 10px 24px; border-radius: 8px; margin-bottom: 10px; }
        .invoice-number { font-size: 11pt; color: #d1d5db; }
        .invoice-meta { font-size: 10pt; margin-top: 12px; color: #e5e7eb; }
        .invoice-meta div { margin: 3px 0; }
        .two-col { display: table; width: 100%; margin-bottom: 24px; }
        .col { display: table-cell; width: 50%; vertical-align: top; padding-right: 24px; }
        .card { background: #f9fafb; padding: 16px; border-radius: 10px; border: 1px solid #e5e7eb; }
        .label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 6px; }
        .client-name { font-weight: bold; font-size: 12pt; color: #111827; }
        table.items { width: 100%; border-collapse: collapse; margin: 20px 0; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        table.items th { text-align: left; padding: 12px 10px; background: #111827; color: #fff; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.05em; }
        table.items td { padding: 12px 10px; border-bottom: 1px solid #f3f4f6; }
        table.items .text-right { text-align: right; }
        table.items tbody tr:nth-child(even) { background: #f9fafb; }
        .totals { margin-top: 24px; }
        .totals table { width: 280px; margin-left: auto; border-collapse: collapse; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .totals td { padding: 8px 14px; border: none; background: #f9fafb; }
        .totals .grand { font-size: 14pt; font-weight: bold; background: #f59e0b; color: #fff; padding: 14px; }
        .notes { margin-top: 24px; padding: 16px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b; font-size: 9pt; color: #78350f; }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="header-inner">
                <div class="header-left">
                    <div class="company-name">{{ $company->name }}</div>
                    <div class="company-meta">
                        @if($company->address){{ $company->address }}<br>@endif
                        @if($company->postal_code || $company->city)
                            {{ $company->postal_code }} {{ $company->city }}@if($company->country), {{ $company->country }}@endif<br>
                        @endif
                        @if($company->identification_number)
                            JIB: {{ $company->identification_number }}
                            @if($company->vat_number) &nbsp;|&nbsp; PDV: {{ $company->vat_number }}@endif
                        @endif
                    </div>
                </div>
                <div class="header-right">
                    <div class="invoice-badge">PREDRAČUN</div>
                    <div class="invoice-number">{{ $proforma->proforma_number }}</div>
                    <div class="invoice-meta">
                        <div>Datum: {{ $proforma->date->format('d.m.Y') }}</div>
                        @if($proforma->due_date)
                        <div>Dospijeće: {{ $proforma->due_date->format('d.m.Y') }}</div>
                        @endif
                    </div>
                </div>
            </div>
        </div>

        <div class="two-col">
            <div class="col">
                <div class="card">
                    <div class="label">Kupac</div>
                    <div class="client-name">{{ $proforma->client?->name ?? '—' }}</div>
                    @if($proforma->client?->address)<div class="company-meta">{{ $proforma->client->address }}</div>@endif
                    @if($proforma->client?->city || $proforma->client?->zip)
                        <div class="company-meta">{{ $proforma->client->zip }} {{ $proforma->client->city }}
                        @if($proforma->client?->country), {{ $proforma->client->country }}@endif
                        </div>
                    @endif
                    @if($proforma->client?->email)<div class="company-meta">{{ $proforma->client->email }}</div>@endif
                </div>
            </div>
            <div class="col">
                <div class="card">
                    <div class="label">Valuta</div>
                    <strong>{{ $currency }}</strong>
                </div>
            </div>
        </div>

        <table class="items">
            <thead>
                <tr>
                    <th>Stavka</th>
                    <th class="text-right">Količina</th>
                    <th class="text-right">Jed. cijena</th>
                    <th class="text-right">PDV</th>
                    <th class="text-right">Ukupno</th>
                </tr>
            </thead>
            <tbody>
                @foreach($proforma->items as $item)
                <tr>
                    <td>
                        <strong>{{ $item->name }}</strong>
                        @if($item->description)<br><span style="font-size: 9pt; color: #6b7280;">{{ $item->description }}</span>@endif
                    </td>
                    <td class="text-right">{{ $item->quantity }}</td>
                    <td class="text-right">{{ $formatAmount($item->quantity > 0 ? $item->total / $item->quantity : 0) }} {{ $currency }}</td>
                    <td class="text-right">{{ $item->tax_rate / 100 }}%</td>
                    <td class="text-right"><strong>{{ $formatAmount($item->total) }} {{ $currency }}</strong></td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals">
            <table>
                <tr><td>Osnovica</td><td class="text-right">{{ $formatAmount($proforma->subtotal) }} {{ $currency }}</td></tr>
                <tr><td>PDV</td><td class="text-right">{{ $formatAmount($proforma->tax_total) }} {{ $currency }}</td></tr>
                <tr><td class="grand">Ukupno</td><td class="text-right grand">{{ $formatAmount($proforma->total) }} {{ $currency }}</td></tr>
            </table>
        </div>

        @if($proforma->notes)
        <div class="notes">
            <strong>Napomena:</strong><br>{{ $proforma->notes }}
        </div>
        @endif
    </div>
</body>
</html>
