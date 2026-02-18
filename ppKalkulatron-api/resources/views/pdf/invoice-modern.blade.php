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
            font-size: 8pt;
            color: #1e293b;
            line-height: 1.3;
            background: #fff;
        }
        .page {
            padding: 22px 22px 60px 22px;
            max-width: 210mm;
            margin: 0 auto;
            position: relative;
            min-height: 100vh;
        }

        /* Header */
        .header {
            background: #6366f1;
            border-radius: 6px;
            padding: 14px 16px;
            margin-bottom: 14px;
            color: #fff;
        }

        .company-name {
            font-size: 13pt;
            font-weight: 700;
            margin-bottom: 3px;
        }

        .company-info {
            font-size: 7pt;
            color: #e0e7ff;
            line-height: 1.4;
        }

        /* Invoice Meta Bar Table */
        .meta-table { width: 100%; margin-bottom: 14px; border-collapse: collapse; border-left: 4px solid #6366f1; }
        .meta-table td { padding: 6px 8px; border: none; vertical-align: middle; }
        .meta-left { width: 70%; }
        .meta-right { width: 30%; text-align: right; }

        .invoice-id-label {
            font-size: 6.5pt;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
        }

        .invoice-id-value {
            font-size: 12pt;
            font-weight: 700;
            color: #0f172a;
        }

        .status-badge {
            padding: 3px 10px;
            background: #f5f3ff;
            color: #6366f1;
            border: 1px solid #c7d2fe;
            border-radius: 10px;
            font-size: 6.5pt;
            font-weight: 700;
            text-transform: uppercase;
            display: inline-block;
        }

        /* Info Cards Table */
        .info-table {
            width: 100%;
            margin-bottom: 14px;
            border-collapse: collapse;
        }

        .info-table td {
            background: #f8fafc;
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }

        .info-table .info-left { width: 48%; padding-right: 7px; }
        .info-table .info-right { width: 48%; padding-left: 7px; }

        .info-label {
            font-size: 6.5pt;
            text-transform: uppercase;
            font-weight: 700;
            color: #6366f1;
            margin-bottom: 6px;
            display: block;
        }

        .info-name {
            font-weight: 700;
            font-size: 8.5pt;
            color: #0f172a;
            margin-bottom: 3px;
        }

        .detail-row {
            font-size: 7pt;
            margin-bottom: 2px;
        }

        .detail-row strong {
            color: #64748b;
            font-weight: 700;
        }

        /* Table Design */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0 8px 0;
        }

        .items-table th {
            padding: 7px 6px;
            text-align: left;
            font-size: 6.5pt;
            text-transform: uppercase;
            background: #0f172a;
            color: #fff;
            font-weight: 700;
        }

        .items-table th:first-child { border-radius: 5px 0 0 0; }
        .items-table th:last-child { border-radius: 0 5px 0 0; }

        .items-table td {
            padding: 7px 6px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 7.5pt;
            vertical-align: top;
            font-family: DejaVu Sans, sans-serif;
        }

        .text-right { text-align: right; font-family: DejaVu Sans, sans-serif; }
        .text-center { text-align: center; font-family: DejaVu Sans, sans-serif; }

        .item-name { font-weight: 700; color: #0f172a; font-family: DejaVu Sans, sans-serif; }
        .item-desc { font-size: 6.5pt; color: #64748b; margin-top: 1px; font-family: DejaVu Sans, sans-serif; }

        /* Summary Table */
        .summary-wrapper {
            width: 100%;
            margin-top: 10px;
            border-collapse: collapse;
        }

        .summary-wrapper td { border: none; vertical-align: top; }
        .summary-left { width: 55%; }
        .summary-right { width: 45%; }

        .summary-box {
            background: #f8fafc;
            padding: 10px 12px;
            border-radius: 6px;
        }

        .summary-table {
            width: 100%;
            border-collapse: collapse;
        }

        .summary-table td {
            padding: 3px 0;
            font-size: 7.5pt;
            border: none;
            font-family: DejaVu Sans, sans-serif;
        }

        .summary-table .value {
            text-align: right;
            font-weight: 700;
            font-family: DejaVu Sans, sans-serif;
        }

        .summary-table .total-row td {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 2px solid #e2e8f0;
            font-size: 10pt;
            font-weight: 700;
            color: #6366f1;
        }

        /* Notes */
        .notes-section {
            margin-top: 14px;
            padding: 0 8px;
        }

        .notes-label {
            font-size: 6.5pt;
            text-transform: uppercase;
            font-weight: 700;
            color: #6366f1;
            margin-bottom: 3px;
        }

        .notes-text {
            font-size: 7pt;
            color: #475569;
        }

        /* Signature Section */
        .signature-section {
            margin-top: 14px;
            width: 100%;
            border-collapse: collapse;
        }
        .signature-section td {
            border: none;
            vertical-align: bottom;
            padding: 0 10px;
            text-align: center;
        }
        .signature-left { width: 50%; }
        .signature-right { width: 50%; }
        
        .signature-label {
            font-size: 7pt;
            margin-bottom: 18px;
            display: block;
            color: #475569;
        }
        
        .signature-line {
            border-bottom: 1px solid #6366f1;
            width: 175px;
            margin: 0 auto 2px auto;
        }
        
        .signature-note {
            font-size: 6pt;
            color: #94a3b8;
        }

        /* Footer */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 6.5pt;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding: 10px 0;
            background: #fff;
            font-family: DejaVu Sans, sans-serif;
        }

        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page { padding: 10mm 10mm 22mm 10mm; }
            .header { background: #6366f1 !important; }
            .footer { position: fixed; bottom: 0; }
        }
    </style>
</head>
<body>
<div class="page">

    <div class="header">
        <div class="company-name">{{ $company->name }}</div>
        <div class="company-info">
            @if($company->address){{ $company->address }}<br>@endif
            @if($company->postal_code || $company->city){{ $company->postal_code }} {{ $company->city }}@if($company->country), {{ $company->country }}@endif<br>@endif
            @if($company->identification_number)<strong>JIB:</strong> {{ $company->identification_number }}@if($company->vat_number) | <strong>PDV:</strong> {{ $company->vat_number }}@endif@endif
        </div>
    </div>

    <table class="meta-table">
        <tr>
            <td class="meta-left">
                <div class="invoice-id-label">Račun br.</div>
                <div class="invoice-id-value">{{ $invoice->invoice_number }}</div>
            </td>
            <td class="meta-right">
                <span class="status-badge">Izdato / Original</span>
            </td>
        </tr>
    </table>

    <table class="info-table">
        <tr>
            <td class="info-left">
                <span class="info-label">NARUČILAC / KUPAC</span>
                <div class="info-name">{{ $invoice->client?->name }}</div>
                <div class="detail-row">@if($invoice->client?->address){{ $invoice->client->address }}@endif</div>
                <div class="detail-row">@if($invoice->client?->zip || $invoice->client?->city){{ $invoice->client->zip }} {{ $invoice->client->city }}@endif</div>
            </td>

            <td class="info-right">
                <span class="info-label">DATUMI I VALUTA</span>
                <div class="detail-row"><strong>Datum izdavanja:</strong> {{ $invoice->date->format('d.m.Y') }}</div>
                <div class="detail-row"><strong>Datum dospijeća:</strong> {{ $invoice->due_date->format('d.m.Y') }}</div>
                <div class="detail-row"><strong>Valuta plaćanja:</strong> {{ $currency }}</div>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
        <tr>
            <th style="width:50%">Opis usluge / proizvoda</th>
            <th class="text-center" style="width:10%">Kol.</th>
            <th class="text-right" style="width:15%">Cijena</th>
            <th class="text-right" style="width:25%">Ukupno</th>
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
                <td class="text-center" style="font-family: DejaVu Sans, sans-serif;">{{ $item->quantity }}</td>
                <td class="text-right" style="font-family: DejaVu Sans, sans-serif;">{{ $formatAmount($item->quantity > 0 ? $item->total / $item->quantity : 0) }} {{ $currency }}</td>
                <td class="text-right" style="font-weight: 700; font-family: DejaVu Sans, sans-serif;">{{ $formatAmount($item->total) }} {{ $currency }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <table class="summary-wrapper">
        <tr>
            <td class="summary-left"></td>
            <td class="summary-right">
                <div class="summary-box">
                    <table class="summary-table">
                        <tr>
                            <td style="font-family: DejaVu Sans, sans-serif;">Osnovica:</td>
                            <td class="value" style="font-family: DejaVu Sans, sans-serif;">{{ $formatAmount($invoice->subtotal) }} {{ $currency }}</td>
                        </tr>
                        <tr>
                            <td style="font-family: DejaVu Sans, sans-serif;">PDV (17%):</td>
                            <td class="value" style="font-family: DejaVu Sans, sans-serif;">{{ $formatAmount($invoice->tax_total) }} {{ $currency }}</td>
                        </tr>
                        <tr class="total-row">
                            <td>UKUPNO:</td>
                            <td class="value">{{ $formatAmount($invoice->total) }} {{ $currency }}</td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    @if($invoice->notes)
        <div class="notes-section">
            <div class="notes-label">Napomene / Uslovi plaćanja</div>
            <p class="notes-text">{{ $invoice->notes }}</p>
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
        Hvala Vam na ukazanom povjerenju!<br>
        <strong>{{ $company->name }}</strong> • {{ $company->email ?? 'info@kompanija.ba' }}
    </div>

</div>
</body>
</html>
