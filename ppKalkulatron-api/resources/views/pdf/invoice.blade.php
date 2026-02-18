@php
    $formatAmount = fn ($pfening) => number_format($pfening / 100, 2, ',', '.');
    $currency = $invoice->currency?->code ?? 'BAM';
@endphp
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="utf-8">
    <title>Faktura {{ $invoice->invoice_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: DejaVu Sans, sans-serif; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 7.5pt;
            color: #000;
            line-height: 1.2;
            background: #fff;
        }
        .page {
            padding: 18px 18px 50px 18px;
            max-width: 210mm;
            margin: 0 auto;
            position: relative;
            min-height: 100vh;
        }

        /* Header Table */
        .header-table {
            width: 100%;
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 2px solid #000;
            border-collapse: collapse;
        }

        .header-table td { border: none; vertical-align: top; }
        .header-left { width: 18%; }
        .header-right { width: 82%; text-align: right; }

        .logo-placeholder {
            width: 40px;
            height: 40px;
            background: #000;
            border-radius: 3px;
            text-align: center;
            line-height: 40px;
            font-size: 6pt;
            font-weight: 700;
            color: #fff;
        }

        .company-name {
            font-size: 11pt;
            font-weight: 700;
            margin-bottom: 2px;
        }

        .company-info {
            font-size: 6.5pt;
            line-height: 1.2;
        }

        /* Invoice Title Table */
        .invoice-title-table {
            width: 100%;
            margin-bottom: 8px;
            border-collapse: collapse;
        }

        .invoice-title-table td { border: none; vertical-align: middle; }
        .title-left { width: 60%; }
        .title-right { width: 40%; text-align: right; font-size: 7pt; }

        .invoice-label {
            font-size: 15pt;
            font-weight: 700;
        }

        .invoice-number {
            font-size: 8.5pt;
            font-weight: 700;
        }

        /* Info Section Table */
        .info-table {
            width: 100%;
            margin-bottom: 8px;
            border-collapse: collapse;
        }

        .info-table td { border: none; vertical-align: top; }
        .info-left { width: 48%; padding-right: 2%; }
        .info-right { width: 48%; padding-left: 2%; }

        .info-label {
            font-size: 6pt;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 2px;
            padding-bottom: 1px;
            border-bottom: 1px solid #000;
            font-family: DejaVu Sans, sans-serif;
        }

        .info-name {
            font-weight: 700;
            font-size: 7.5pt;
            margin-bottom: 1px;
            font-family: DejaVu Sans, sans-serif;
        }

        .info-content {
            font-size: 7pt;
            line-height: 1.2;
            font-family: DejaVu Sans, sans-serif;
        }

        /* Detail Table */
        .detail-table { width: 100%; border-collapse: collapse; }
        .detail-table td { border: none; padding: 1px 0; font-size: 7pt; font-family: DejaVu Sans, sans-serif; }
        .detail-label { width: 50%; font-family: DejaVu Sans, sans-serif; }
        .detail-value { width: 50%; text-align: right; font-weight: 700; font-family: DejaVu Sans, sans-serif; }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 6px 0;
        }

        .items-table th {
            padding: 3px 2px;
            text-align: left;
            font-size: 6pt;
            text-transform: uppercase;
            font-weight: 700;
            background: #000;
            color: #fff;
            border: none;
            font-family: DejaVu Sans, sans-serif;
        }

        .items-table td {
            padding: 2px;
            border-bottom: 0.5px solid #ccc;
            font-size: 7pt;
            vertical-align: top;
            font-family: DejaVu Sans, sans-serif;
        }

        .items-table tbody tr:last-child td {
            border-bottom: 1px solid #000;
        }

        .text-right { text-align: right; font-family: DejaVu Sans, sans-serif; }
        .item-name {
            font-weight: 700;
            line-height: 1.15;
            font-family: DejaVu Sans, sans-serif;
        }
        .item-desc {
            font-size: 6pt;
            margin-top: 1px;
            color: #444;
            line-height: 1.15;
            font-family: DejaVu Sans, sans-serif;
        }

        /* Totals Section Table */
        .totals-wrapper {
            width: 100%;
            margin-top: 5px;
            border-collapse: collapse;
        }

        .totals-wrapper td { border: none; vertical-align: top; }
        .totals-left { width: 55%; }
        .totals-right { width: 45%; }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }

        .totals-table td {
            padding: 2px 0;
            font-size: 7pt;
            border: none;
            font-family: DejaVu Sans, sans-serif;
        }

        .totals-value {
            text-align: right;
            font-weight: 700;
            font-family: DejaVu Sans, sans-serif;
        }

        .totals-table .total-row td {
            padding-top: 4px;
            border-top: 1.5px solid #000;
            font-size: 9pt;
            font-weight: 700;
        }

        /* Notes Section */
        .notes-section {
            margin-top: 8px;
            padding: 5px 6px;
            background: #f5f5f5;
            border-left: 3px solid #000;
            font-size: 6.5pt;
        }

        .notes-label {
            font-size: 5.5pt;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 2px;
            font-family: DejaVu Sans, sans-serif;
        }

        .notes-text {
            line-height: 1.2;
            font-family: DejaVu Sans, sans-serif;
        }

        /* Signature Section */
        .signature-section {
            margin-top: 12px;
            width: 100%;
            border-collapse: collapse;
        }
        .signature-section td {
            border: none;
            vertical-align: bottom;
            padding: 0 8px;
            text-align: center;
        }
        .signature-left { width: 50%; }
        .signature-right { width: 50%; }

        .signature-label {
            font-size: 6.5pt;
            margin-bottom: 18px;
            display: block;
        }

        .signature-line {
            border-bottom: 1px solid #000;
            width: 170px;
            margin: 0 auto 2px auto;
        }

        .signature-note {
            font-size: 5.5pt;
            color: #666;
        }

        /* Footer */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 5px 0;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 6pt;
            color: #666;
            background: #fff;
            font-family: DejaVu Sans, sans-serif;
        }

        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .page {
                padding: 8mm 10mm 18mm 10mm;
            }
            .footer { position: fixed; bottom: 0; }
        }
    </style>
</head>
<body>
<div class="page">

    <table class="header-table">
        <tr>
            <td class="header-left">
                <div class="logo-placeholder">LOGO</div>
            </td>
            <td class="header-right">
                <div class="company-name">{{ $company->name }}</div>
                <div class="company-info">
                    @if($company->address){{ $company->address }}<br>@endif
                    @if($company->postal_code || $company->city)
                        {{ $company->postal_code }} {{ $company->city }}@if($company->country), {{ $company->country }}@endif<br>
                    @endif
                    @if($company->identification_number)
                        JIB: {{ $company->identification_number }}@if($company->vat_number) | PDV: {{ $company->vat_number }}@endif
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <table class="invoice-title-table">
        <tr>
            <td class="title-left">
                <span class="invoice-label">FAKTURA</span>
                <span class="invoice-number">#{{ $invoice->invoice_number }}</span>
            </td>
            <td class="title-right">
                <strong>Datum:</strong> {{ $invoice->date->format('d.m.Y') }} |
                <strong>Dospijeva:</strong> {{ $invoice->due_date->format('d.m.Y') }}
            </td>
        </tr>
    </table>

    <table class="info-table">
        <tr>
            <td class="info-left">
                <div class="info-label">Kupac</div>
                <div class="info-content">
                    <div class="info-name">{{ $invoice->client?->name }}</div>
                    @if($invoice->client?->address){{ $invoice->client->address }}<br>@endif
                    @if($invoice->client?->zip || $invoice->client?->city)
                        {{ $invoice->client->zip }} {{ $invoice->client->city }}
                    @endif
                </div>
            </td>
            <td class="info-right">
                <div class="info-label">Plaćanje</div>
                <div class="info-content">
                    <table class="detail-table">
                        <tr>
                            <td class="detail-label">Način plaćanja</td>
                            <td class="detail-value">Transakcijski</td>
                        </tr>
                        <tr>
                            <td class="detail-label">Valuta</td>
                            <td class="detail-value">{{ $currency }}</td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
        <tr>
            <th style="width:48%">Opis</th>
            <th class="text-right" style="width:8%">Kol.</th>
            <th class="text-right" style="width:15%">Cijena</th>
            <th class="text-right" style="width:8%">PDV</th>
            <th class="text-right" style="width:21%">Ukupno</th>
        </tr>
        </thead>
        <tbody>
        @foreach($invoice->items as $item)
            <tr>
                <td>
                    <div class="item-name">{{ $item->name }}</div>
                    @if($item->description)
                        <div class="item-desc">{{ $item->description }}</div>
                    @endif
                </td>
                <td class="text-right" style="font-family: DejaVu Sans, sans-serif;">{{ $item->quantity }}</td>
                <td class="text-right" style="font-family: DejaVu Sans, sans-serif;">
                    {{ $formatAmount($item->quantity > 0 ? $item->total / $item->quantity : 0) }} {{ $currency }}
                </td>
                <td class="text-right" style="font-family: DejaVu Sans, sans-serif;">{{ $item->tax_rate / 100 }}%</td>
                <td class="text-right" style="font-weight: 700; font-family: DejaVu Sans, sans-serif;">
                    {{ $formatAmount($item->total) }} {{ $currency }}
                </td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <table class="totals-wrapper">
        <tr>
            <td class="totals-left"></td>
            <td class="totals-right">
                <table class="totals-table">
                    <tr>
                        <td style="font-family: DejaVu Sans, sans-serif;">Osnovica</td>
                        <td class="totals-value" style="font-family: DejaVu Sans, sans-serif;">{{ $formatAmount($invoice->subtotal) }} {{ $currency }}</td>
                    </tr>
                    <tr>
                        <td style="font-family: DejaVu Sans, sans-serif;">PDV</td>
                        <td class="totals-value" style="font-family: DejaVu Sans, sans-serif;">{{ $formatAmount($invoice->tax_total) }} {{ $currency }}</td>
                    </tr>
                    <tr class="total-row">
                        <td>UKUPNO</td>
                        <td class="totals-value">{{ $formatAmount($invoice->total) }} {{ $currency }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    @if($invoice->notes)
    <div class="notes-section">
        <div class="notes-label">Napomena</div>
        <div class="notes-text">{{ $invoice->notes }}</div>
    </div>
    @endif

    <table class="signature-section">
        <tr>
            <td class="signature-left">
                <span class="signature-label">Izdavac fakture:</span>
                <div class="signature-line"></div>
                <div class="signature-note">(Potpis i pečat)</div>
            </td>
            <td class="signature-right">
                <span class="signature-label">Primalac robe/usluge:</span>
                <div class="signature-line"></div>
                <div class="signature-note">(Potpis)</div>
            </td>
        </tr>
    </table>

    <div class="footer">
        {{ $company->name }}
    </div>

</div>
</body>
</html>
