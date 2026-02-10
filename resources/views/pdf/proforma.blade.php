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
        body { font-family: DejaVu Sans, sans-serif; font-size: 10pt; color: #1f2937; line-height: 1.5; }
        .page { padding: 28px; }
        .header { border-bottom: 3px solid #f59e0b; padding-bottom: 20px; margin-bottom: 24px; }
        .header-inner { display: table; width: 100%; }
        .header-left { display: table-cell; width: 55%; vertical-align: top; }
        .header-right { display: table-cell; width: 45%; vertical-align: top; text-align: right; }
        .company-name { font-size: 18pt; font-weight: bold; color: #111827; margin-bottom: 6px; }
        .company-meta { font-size: 9pt; color: #6b7280; }
        .invoice-badge { display: inline-block; background: #f59e0b; color: #fff; font-size: 14pt; font-weight: bold; padding: 8px 20px; margin-bottom: 8px; }
        .invoice-number { font-size: 12pt; color: #6b7280; }
        .invoice-meta { font-size: 10pt; margin-top: 12px; }
        .invoice-meta div { margin: 2px 0; }
        .two-col { display: table; width: 100%; margin-bottom: 24px; }
        .col { display: table-cell; width: 50%; vertical-align: top; padding-right: 24px; }
        .label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 4px; }
        .client-name { font-weight: bold; font-size: 11pt; color: #111827; }
        .bank-block { background: #fef3c7; padding: 12px; border-radius: 6px; border-left: 4px solid #f59e0b; }
        table.items { width: 100%; border-collapse: collapse; margin: 20px 0; }
        table.items th { text-align: left; padding: 10px 8px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
        table.items td { padding: 10px 8px; border-bottom: 1px solid #f3f4f6; }
        table.items .text-right { text-align: right; }
        table.items tbody tr:hover { background: #fffbeb; }
        .totals { margin-top: 24px; }
        .totals table { width: 260px; margin-left: auto; border-collapse: collapse; }
        .totals td { padding: 6px 12px; border: none; }
        .totals .grand { font-size: 14pt; font-weight: bold; background: #f59e0b; color: #fff; padding: 12px; }
        .notes { margin-top: 24px; padding: 14px; background: #f9fafb; border-radius: 6px; font-size: 9pt; color: #4b5563; }
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
                            JIB: {{ $company->identification_number }}@if($company->vat_number) &nbsp;|&nbsp; PDV: {{ $company->vat_number }}@endif
                        @endif
                    </div>
                </div>
                <div class="header-right">
                    <div class="invoice-badge">PREDRAČUN</div>
                    <div class="invoice-number">{{ $proforma->proforma_number }}</div>
                    <div class="invoice-meta">
                        <div><strong>Datum:</strong> {{ $proforma->date->format('d.m.Y') }}</div>
                        @if($proforma->due_date)
                        <div><strong>Dospijeće:</strong> {{ $proforma->due_date->format('d.m.Y') }}</div>
                        @endif
                    </div>
                </div>
            </div>
        </div>

        <div class="two-col">
            <div class="col">
                <div class="label">Kupac</div>
                <div class="client-name">{{ $proforma->client?->name ?? '—' }}</div>
                @if($proforma->client?->address)<div class="company-meta">{{ $proforma->client->address }}</div>@endif
                @if($proforma->client?->city || $proforma->client?->zip)
                    <div class="company-meta">{{ $proforma->client->zip }} {{ $proforma->client->city }}@if($proforma->client?->country), {{ $proforma->client->country }}@endif</div>
                @endif
                @if($proforma->client?->email)<div class="company-meta">{{ $proforma->client->email }}</div>@endif
            </div>
            <div class="col">
                <div class="label">Valuta</div>
                <div class="bank-block">
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
