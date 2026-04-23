@php
    $formatAmount = fn ($pfening) => number_format($pfening / 100, 2, ',', '.');
    $currency = $invoice->currency?->code ?? 'BAM';
    $showVat = $company->is_vat_obligor ?? true;

    // Boje iz dizajna
    $color_primary = '#2f80ed';
    $color_bg_light = '#f3f8fb';
    $color_text_dark = '#111827';
    $color_text_muted = '#6b7280';
@endphp
    <!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="utf-8">
    <style>
        /* DomPDF A4 – ne postavljati height na body da ne bi nastala prazna stranica 2 */
        @page { margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 9pt;
            color: {{ $color_text_dark }};
            background: #fff;
            width: 210mm;
        }

        .page-wrapper {
            padding: 40px 50px 80px 50px;
            position: relative;
        }

        /* Header section – lijevo: logo placeholder + ime; desno: detalji kompanije */
        .header-table { width: 100%; margin-bottom: 30px; border-collapse: collapse; border-bottom: 2px solid {{ $color_primary }}; padding-bottom: 15px; }
        .header-table td { vertical-align: top; }
        .header-left { width: 45%; }
        .header-right { width: 55%; text-align: right; }
        .header-logo-row .logo-placeholder { width: 50px; height: 50px; background: {{ $color_bg_light }}; border-radius: 10px; vertical-align: middle; text-align: center; font-size: 6pt; color: {{ $color_text_muted }}; }
        .company-name-left { font-size: 16pt; font-weight: bold; color: {{ $color_primary }}; }
        .company-info-right { font-size: 8pt; color: {{ $color_text_muted }}; line-height: 1.5; text-align: right; }

        /* Client card – isti stil kao Detalji plaćanja */
        .client-card {
            background: {{ $color_bg_light }};
            border-radius: 15px;
            padding: 18px 20px;
        }
        .client-card .client-name { font-size: 9pt; font-weight: bold; margin-bottom: 4px; color: {{ $color_text_dark }}; }
        .client-card .client-detail { font-size: 8pt; color: {{ $color_text_muted }}; line-height: 1.5; }

        /* Dva boxa u jednom redu: Klijent lijevo, Detalji desno – uvijek ista visina */
        .client-details-row { width: 100%; border-collapse: collapse; margin-bottom: 25px; table-layout: fixed; }
        .client-details-row td { vertical-align: top; padding: 0; }
        .client-details-row td:first-child { padding-right: 12px; width: 50%; }
        .client-details-row td:last-child { padding-left: 12px; width: 50%; }
        .client-details-row .client-card,
        .client-details-row .document-details-box {
            height: 140px;
            min-height: 140px;
            box-sizing: border-box;
        }
        .document-details-box {
            background: #fff;
            border-radius: 10px;
            border: 2px solid {{ $color_primary }};
            padding: 18px 20px;
        }
        .document-details-box .document-details-row { padding: 5px 0; font-size: 8pt; }
        .document-details-box .document-details-label { color: {{ $color_text_muted }}; text-transform: uppercase; }
        .document-details-box .document-details-value { font-weight: bold; color: {{ $color_primary }}; }

        /* Stilizovano ime dokumenta: Račun broj/godina – jedna linija, donja crta */
        .document-title-bar { margin-bottom: 22px; padding: 10px 0; border-bottom: 2px solid {{ $color_primary }}; }
        .document-title-bar .document-title-line { font-size: 20pt; font-weight: bold; color: {{ $color_text_dark }}; }
        .document-title-bar .document-title-line .document-title-number { color: {{ $color_primary }}; }

        /* MAIN INVOICE TABLE */
        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed; /* Ključno za DomPDF stabilnost */
        }

        /* Kolone - klasik raspored sa PDV ili bez (širine se pode u thead) */
        .cell-description { padding-left: 8px !important; }

        .invoice-table thead th {
            font-size: 8pt;
            color: {{ $color_text_muted }};
            font-weight: normal;
            padding: 12px 15px;
            text-align: left;
        }

        /* Zaobljavanje gornjih uglova panela */
        .th-panel-start { border-top-left-radius: 0px; }
        .th-panel-end { border-top-right-radius: 15px; }

        .invoice-table tbody td {
            padding: 12px 15px;
            vertical-align: top;
            border-bottom: 1px solid #ffffff; /* Beli border pravi razmak između redova na plavoj pozadini */
        }

        /* Redovi u tabeli */
        .cell-description { padding-left: 0 !important; }
        .cell-blue { background-color: {{ $color_bg_light }}; }

        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* SUMMARY SECTION - Spojena sa tabelom */
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        /* Prva ćelija = ispod # + Naziv; druga = ispod JM, Kol. i svih numeričkih kolona */
        .summary-col-left { vertical-align: top; padding-right: 0; }
        .summary-col-right {
            vertical-align: top;
            background-color: {{ $color_bg_light }};
            padding: 12px 15px 15px 15px;
        }

        .summary-row {
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }

        /* Brišemo inline-block i širine, koristimo tabelu za poravnanje */
        .summary-item-table {
            width: 100%;
            border-collapse: collapse;
        }
        .summary-label {
            font-size: 8.5pt;
            color: {{ $color_text_muted }};
            padding: 8px 0;
            text-align: left;
        }
        .summary-value {
            font-size: 8.5pt;
            font-weight: bold;
            padding: 8px 0;
            text-align: right;
        }
        .summary-row-line {
            border-bottom: 1px solid #e2e8f0;
        }

        /* TOTAL BLUE BOX (Dno panela) */
        .total-blue-box {
            background-color: {{ $color_primary }};
            color: #ffffff;
            padding: 15px;
            margin: 0 -15px -15px -15px; /* Poravnanje sa ivicama summary-content-a */
            border-bottom-left-radius: 15px;
            border-bottom-right-radius: 15px;
        }

        .amount-in-words {
            font-size: 7.5pt;
            color: {{ $color_text_muted }};
            margin-top: 15px;
            text-align: right;
        }

        .notes-section {
            margin-top: 18px;
            padding: 12px 15px;
            background: {{ $color_bg_light }};
            border-radius: 15px;
        }
        .notes-section .notes-label {
            font-size: 8pt; font-weight: bold; color: {{ $color_text_dark }};
            padding-bottom: 8px;
            border-bottom: 1px solid #d1d5db;
            margin-bottom: 8px;
        }
        .notes-section .notes-text { font-size: 8pt; color: {{ $color_text_muted }}; line-height: 1.4; }

        /* Footer positioning */
        .footer-container {
            position: absolute;
            bottom: 40px;
            left: 50px;
            right: 50px;
        }

        .payment-card {
            background: {{ $color_bg_light }};
            border-radius: 15px;
            padding: 18px 20px;
            min-width: 280px;
            max-width: 320px;
        }
        .payment-card .bank-name { font-size: 9pt; font-weight: bold; margin-bottom: 4px; }
        .payment-card .bank-detail { font-size: 8pt; color: {{ $color_text_muted }}; line-height: 1.5; }
        .payment-card .bank-contact { margin-top: 10px; padding-top: 10px; border-top: 1px solid #d1d5db; font-size: 8pt; color: {{ $color_text_muted }}; line-height: 1.4; word-wrap: break-word; }
    </style>
</head>
<body>

<div class="page-wrapper">

    <table class="header-table">
        <tr>
            <td class="header-left">
                <table class="header-logo-row" style="border-collapse: collapse; border: none;"><tr>
                    <td class="logo-placeholder">LOGO</td>
                    <td style="padding-left: 12px; vertical-align: middle;">
                        <div class="company-name-left">{{ $company->name }}</div>
                    </td>
                </tr></table>
            </td>
            <td class="header-right">
                @if($company->address || $company->city || $company->identification_number)
                    <div class="company-info-right">
                        @if($company->address){{ $company->address }}<br>@endif
                        @if($company->postal_code || $company->city){{ $company->postal_code }} {{ $company->city }}@if($company->country), {{ $company->country }}@endif<br>@endif
                        @if($company->identification_number)JIB: {{ $company->identification_number }}@if($company->vat_number && $showVat) | PDV: {{ $company->vat_number }}@endif @endif
                    </div>
                @endif
            </td>
        </tr>
    </table>

    <table class="client-details-row">
        <tr>
            <td>
                <div class="client-card">
                    <div class="client-name">{{ $invoice->client?->name }}</div>
                    <div class="client-detail">
                        @if($invoice->client?->address){{ $invoice->client->address }}<br>@endif
                        @if($invoice->client?->city){{ $invoice->client->city }}<br>@endif
                        @if($invoice->client?->phone){{ $invoice->client->phone }}@endif
                    </div>
                </div>
            </td>
            <td>
                <div class="document-details-box">
                    <div class="document-details-row"><span class="document-details-label">Rok dospijeća</span> <span class="document-details-value">{{ $invoice->due_date->format('d.m.Y.') }}</span></div>
                    <div class="document-details-row"><span class="document-details-label">Datum izdavanja</span> <span class="document-details-value">{{ $invoice->date->format('d.m.Y.') }}</span></div>
                    <div class="document-details-row"><span class="document-details-label">Broj računa</span> <span class="document-details-value">#{{ $invoice->invoice_number }}</span></div>
                    <div class="document-details-row"><span class="document-details-label">Referenca</span> <span class="document-details-value">INV-{{ $invoice->id }}</span></div>
                </div>
            </td>
        </tr>
    </table>

    <div class="document-title-bar">
        <div class="document-title-line">Račun <span class="document-title-number">#{{ $invoice->invoice_number }}</span></div>
    </div>

    <table class="invoice-table">
        <thead>
        <tr>
            <th style="width:4%; background-color: {{ $color_bg_light }};" class="text-center">#</th>
            <th style="width:{{ $showVat ? '24%' : '46%' }}; background-color: {{ $color_bg_light }};">Naziv</th>
            <th style="width:6%; background-color: {{ $color_bg_light }};" class="text-center">JM</th>
            <th style="width:6%; background-color: {{ $color_bg_light }};" class="text-center">Kol.</th>
            <th style="width:{{ $showVat ? '8%' : '14%' }}; background-color: {{ $color_bg_light }};" class="text-right">Cijena</th>
            @if($showVat)
                <th style="width:10%; background-color: {{ $color_bg_light }};" class="text-right">Cijena sa PDV</th>
                <th style="width:6%; background-color: {{ $color_bg_light }};" class="text-center">PDV %</th>
                <th style="width:10%; background-color: {{ $color_bg_light }};" class="text-right">Iznos PDV-a</th>
                <th style="width:10%; background-color: {{ $color_bg_light }};" class="text-right">Iznos bez PDV</th>
                <th style="width:14%; background-color: {{ $color_bg_light }};" class="text-right th-panel-end">Iznos sa PDV</th>
            @else
                <th style="width:24%; background-color: {{ $color_bg_light }};" class="text-right th-panel-end">Iznos</th>
            @endif
        </tr>
        </thead>
        <tbody>
        @foreach($invoice->items as $item)
            @php
                $quantity = (float)($item->quantity ?? 0);
                $taxRateRaw = (int)($item->tax_rate ?? 0);
                $unitPriceWithVat = (int)$item->unit_price;
                $subtotal = (int)$item->subtotal;
                $taxAmount = (int)$item->tax_amount;
                $total = (int)$item->total;
                $unitPriceWithoutVat = $quantity > 0 ? (int)round($subtotal / $quantity) : 0;
                $unit = $item->article?->unit ?? $item->unit ?? 'kom';
                $taxRatePercent = $taxRateRaw / 100;
            @endphp
            <tr>
                <td class="text-center">{{ $loop->iteration }}</td>
                <td class="cell-description">
                    <div style="font-weight: bold;">{{ $item->name }}</div>
                    @if($item->description)<div style="font-size: 7.5pt; color: {{ $color_text_muted }};">{{ $item->description }}</div>@endif
                </td>
                <td class="cell-blue text-center">{{ $unit }}</td>
                <td class="cell-blue text-center">{{ rtrim(rtrim(number_format($quantity, 3, ',', '.'), '0'), ',') }}</td>
                @if($showVat)
                    <td class="cell-blue text-right">{{ $formatAmount($unitPriceWithoutVat) }}</td>
                    <td class="cell-blue text-right">{{ $formatAmount($unitPriceWithVat) }}</td>
                    <td class="cell-blue text-right">{{ rtrim(rtrim(number_format($taxRatePercent, 2, ',', '.'), '0'), ',') }}%</td>
                    <td class="cell-blue text-right">{{ $formatAmount($taxAmount) }}</td>
                    <td class="cell-blue text-right">{{ $formatAmount($subtotal) }}</td>
                    <td class="cell-blue text-right" style="font-weight: bold;">{{ $formatAmount($total) }} {{ $currency }}</td>
                @else
                    <td class="cell-blue text-right">{{ $formatAmount($quantity > 0 ? (int)round($total / $quantity) : 0) }}</td>
                    <td class="cell-blue text-right" style="font-weight: bold;">{{ $formatAmount($total) }} {{ $currency }}</td>
                @endif
            </tr>
        @endforeach
        </tbody>
    </table>

    <table class="summary-table">
        <tr>
            <td class="summary-col-left" style="width: {{ $showVat ? '28%' : '50%' }};"></td>
            <td class="summary-col-right" style="width: {{ $showVat ? '72%' : '50%' }};">
                <table class="summary-item-table">
                    <tr class="summary-row-line">
                        <td class="summary-label">Osnovica:</td>
                        <td class="summary-value">{{ $formatAmount($invoice->subtotal) }} {{ $currency }}</td>
                    </tr>

                    @if($showVat)
                        <tr class="summary-row-line" style="border-bottom: none;">
                            <td class="summary-label">PDV:</td>
                            <td class="summary-value">{{ $formatAmount($invoice->tax_total) }} {{ $currency }}</td>
                        </tr>
                    @endif
                </table>

                <div class="total-blue-box">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="font-weight: bold; font-size: 10pt; color: #ffffff;">UKUPNO:</td>
                            <td style="text-align: right; font-weight: bold; font-size: 11pt; color: #ffffff;">
                                {{ $formatAmount($invoice->total) }} {{ $currency }}
                            </td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <div class="amount-in-words">
        Slovima:
        @php
            $locale = $invoice->language?->value ?? 'sr_Latn_BA';
            $nf = new \NumberFormatter($locale, \NumberFormatter::SPELLOUT);
        @endphp
        {{ $nf->format(intdiv($invoice->total, 100)) }}
        {{ $currency }}
        i {{ str_pad($invoice->total % 100, 2, '0', STR_PAD_LEFT) }}/100
    </div>

    @if($invoice->notes)
    <div class="notes-section">
        <div class="notes-label">Napomena</div>
        <div class="notes-text">{{ $invoice->notes }}</div>
    </div>
    @endif

    <div class="footer-container">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="vertical-align: top; width: 55%;"></td>
                <td class="text-right" style="vertical-align: top; width: 45%;">
                    <div class="payment-card">
                        <div style="font-weight: bold; font-size: 8pt; margin-bottom: 10px; text-transform: uppercase; color: {{ $color_text_dark }};">Detalji plaćanja</div>
                        @if(isset($bankAccounts) && $bankAccounts->isNotEmpty())
                            @foreach($bankAccounts as $acc)
                                <div class="bank-name">{{ $acc->bank_name }}</div>
                                <div class="bank-detail">Račun: {{ $acc->account_number }}</div>
                                @if($acc->swift)<div class="bank-detail">SWIFT: {{ $acc->swift }}</div>@endif
                                @if(!$loop->last)<div style="height: 8px;"></div>@endif
                            @endforeach
                        @else
                            <div class="bank-detail">Nije unesen bankovni račun.</div>
                        @endif
                        <div class="bank-contact">
                            @if($company->phone){{ $company->phone }}@endif
                            @if($company->phone && $company->email) | @endif
                            @if($company->email){{ $company->email }}@endif
                        </div>
                    </div>
                </td>
            </tr>
        </table>
    </div>

</div>

</body>
</html>
