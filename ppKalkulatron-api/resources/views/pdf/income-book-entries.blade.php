@php
    $formatAmount = fn ($pfening) => number_format($pfening / 100, 2, ',', '.');
    // Decide if VAT should be displayed
    $showVat = count($entries) > 0 ? $entries->first()->company->is_vat_obligor : true;
@endphp
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="utf-8">
    <title>Knjiga Prihoda</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: DejaVu Sans, sans-serif; }
        body { font-size: 8.5pt; color: #000; line-height: 1.3; background: #fff; }
        .page { padding: 10mm; margin: 0 auto; background: #fff; position: relative; }
        
        .header { margin-bottom: 20px; text-align: center; }
        .header h1 { font-size: 14pt; margin-bottom: 5px; }
        .header p { font-size: 9pt; }

        .company-info { margin-bottom: 20px; font-size: 9pt; }
        .company-info strong { font-weight: bold; }

        table.ledger {
            width: 100%;
            border-collapse: collapse;
            font-size: 7.5pt;
        }

        table.ledger th, table.ledger td {
            border: 1px solid #000;
            padding: 4px;
            text-align: right;
            vertical-align: top;
        }

        table.ledger th.text-left, table.ledger td.text-left { text-align: left; }
        table.ledger th.text-center, table.ledger td.text-center { text-align: center; }

        table.ledger th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
            vertical-align: middle;
        }

        /* Totals row */
        tr.totals td {
            font-weight: bold;
            background-color: #e6e6e6;
        }

    </style>
</head>
<body>
<div class="page">
    <div class="header">
        <h1>KNJIGA PRIHODA</h1>
        @if($startDate && $endDate)
            <p>Za period: {{ \Carbon\Carbon::parse($startDate)->format('d.m.Y') }} - {{ \Carbon\Carbon::parse($endDate)->format('d.m.Y') }}</p>
        @else
            <p>Za sve periode</p>
        @endif
    </div>

    <div class="company-info">
        <p><strong>Obveznik:</strong> {{ $company->name }}</p>
        <p><strong>Adresa:</strong> {{ $company->address }}, {{ $company->city }}</p>
        <p><strong>JIB:</strong> {{ $company->identification_number }}
           @if($company->vat_number) | <strong>PDV:</strong> {{ $company->vat_number }} @endif
        </p>
    </div>

    <table class="ledger">
        <thead>
            <tr>
                <th rowspan="2" style="width: 3%">Red. br.</th>
                <th rowspan="2" style="width: 8%">Datum knjiž.</th>
                <th rowspan="2" style="width: 20%">Opis promjene (naziv, broj, datum)</th>
                <th colspan="3">Naplaćeni prihodi od prodaje</th>
                <th rowspan="2" style="width: 8%">Naplaćeni ostali prihodi</th>
                <th rowspan="2" style="width: 8%">Naplaćeni fin. prihodi</th>
                <th rowspan="2" style="width: 10%">Ukupno naplaćeni prihodi</th>
                @if($showVat)
                <th rowspan="2" style="width: 10%">Obračunati PDV</th>
                @endif
            </tr>
            <tr>
                <th style="width: 9%">Usluge</th>
                <th style="width: 9%">Roba</th>
                <th style="width: 9%">Proizvodi</th>
            </tr>
            <tr>
                <th>1</th>
                <th>2</th>
                <th>3</th>
                <th>4a</th>
                <th>4b</th>
                <th>4c</th>
                <th>5</th>
                <th>6</th>
                <th>7 (4a-6)</th>
                @if($showVat)
                <th>8</th>
                @endif
            </tr>
        </thead>
        <tbody>
            @php
                $sumServices = 0;
                $sumGoods = 0;
                $sumProducts = 0;
                $sumOther = 0;
                $sumFinancial = 0;
                $sumTotal = 0;
                $sumVat = 0;
            @endphp
            @forelse($entries as $index => $entry)
                @php
                    $sumServices += $entry->amount_services;
                    $sumGoods += $entry->amount_goods;
                    $sumProducts += $entry->amount_products;
                    $sumOther += $entry->amount_other_income;
                    $sumFinancial += $entry->amount_financial_income;
                    $sumTotal += $entry->total_amount;
                    $sumVat += $entry->vat_amount;
                @endphp
                <tr>
                    <td class="text-center">{{ $entry->entry_number }}</td>
                    <td class="text-center">{{ $entry->booking_date ? $entry->booking_date->format('d.m.Y') : '-' }}</td>
                    <td class="text-left">{{ $entry->description ?: '-' }}</td>
                    
                    <td>{{ $formatAmount($entry->amount_services) }}</td>
                    <td>{{ $formatAmount($entry->amount_goods) }}</td>
                    <td>{{ $formatAmount($entry->amount_products) }}</td>
                    <td>{{ $formatAmount($entry->amount_other_income) }}</td>
                    <td>{{ $formatAmount($entry->amount_financial_income) }}</td>
                    
                    <td style="font-weight: bold;">{{ $formatAmount($entry->total_amount) }}</td>
                    @if($showVat)
                    <td>{{ $formatAmount($entry->vat_amount) }}</td>
                    @endif
                </tr>
            @empty
                <tr>
                    <td colspan="{{ $showVat ? 10 : 9 }}" class="text-center">Nema unosa za odabrani period.</td>
                </tr>
            @endforelse
            
            {{-- Grand Totals --}}
            @if(count($entries) > 0)
                <tr class="totals">
                    <td colspan="3" class="text-center">UKUPNO:</td>
                    <td>{{ $formatAmount($sumServices) }}</td>
                    <td>{{ $formatAmount($sumGoods) }}</td>
                    <td>{{ $formatAmount($sumProducts) }}</td>
                    <td>{{ $formatAmount($sumOther) }}</td>
                    <td>{{ $formatAmount($sumFinancial) }}</td>
                    <td>{{ $formatAmount($sumTotal) }}</td>
                    @if($showVat)
                    <td>{{ $formatAmount($sumVat) }}</td>
                    @endif
                </tr>
            @endif
        </tbody>
    </table>
</div>
</body>
</html>
