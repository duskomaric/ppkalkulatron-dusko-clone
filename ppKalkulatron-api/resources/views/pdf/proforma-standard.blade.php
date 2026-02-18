@php
    $formatAmount = fn ($pfening) => number_format($pfening / 100, 2, ',', '.');
    $currency = $proforma->currency?->code ?? 'BAM';
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Predračun {{ $proforma->proforma_number }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            margin-bottom: 40px;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
        }
        .company-details {
            float: right;
            text-align: right;
        }
        .company-details h2 {
            margin: 0;
            color: #2c3e50;
            font-size: 24px;
        }
        .invoice-details {
            float: left;
        }
        .invoice-details h1 {
            margin: 0 0 10px 0;
            color: #2c3e50;
            font-size: 32px;
            letter-spacing: 1px;
        }
        .client-details {
            margin-bottom: 40px;
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
        }
        .client-details h3 {
            margin: 0 0 10px 0;
            color: #2c3e50;
            font-size: 16px;
            text-transform: uppercase;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        table th {
            background-color: #2c3e50;
            color: #fff;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
        }
        table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .text-right {
            text-align: right;
        }
        .totals {
            float: right;
            width: 350px;
        }
        .totals table th {
            background-color: transparent;
            color: #555;
            text-align: left;
            padding: 5px 10px;
            border: none;
        }
        .totals table td {
            padding: 5px 10px;
            border: none;
        }
        .totals .total-row td {
            border-top: 2px solid #2c3e50;
            font-weight: bold;
            font-size: 18px;
            color: #2c3e50;
            padding-top: 10px;
        }
        .notes {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-style: italic;
            color: #666;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 50px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
        .badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            color: #fff;
        }
        .badge-created { background-color: #6c757d; }
        .badge-fiscalized { background-color: #28a745; }
        .badge-refunded { background-color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header clearfix">
            <div class="invoice-details">
                <h1>PREDRAČUN</h1>
                <p>
                    <strong>Broj:</strong> {{ $proforma->proforma_number }}<br>
                    <strong>Datum:</strong> {{ $proforma->date->format('d.m.Y') }}<br>
                    @if($proforma->due_date)
                    <strong>Dospijeće:</strong> {{ $proforma->due_date->format('d.m.Y') }}<br>
                    @endif
                    @if($proforma->status)
                    <span class="badge badge-{{ strtolower($proforma->status->value) }}">
                        {{ $proforma->status->getLabel() }}
                    </span>
                    @endif
                </p>
            </div>
            <div class="company-details">
                <h2>{{ $company->name }}</h2>
                <p>
                    @if($company->address)
                    {!! nl2br(e($company->address)) !!}<br>
                    @endif
                    @if($company->postal_code || $company->city)
                    {{ $company->postal_code }} {{ $company->city }}
                    @if($company->country)
                    , {{ $company->country }}
                    @endif
                    <br>
                    @endif
                    @if($company->email)
                    Email: {{ $company->email }}<br>
                    @endif
                    @if($company->phone)
                    Tel: {{ $company->phone }}<br>
                    @endif
                    @if($company->vat_number)
                    PDV: {{ $company->vat_number }}<br>
                    @endif
                    @if($company->identification_number)
                    JIB: {{ $company->identification_number }}<br>
                    @endif
                    Valuta: {{ $currency }}
                </p>
            </div>
        </div>

        <div class="client-details">
            <h3>Kupac:</h3>
            <p>
                <strong>{{ $proforma->client?->name ?? '—' }}</strong><br>
                @if($proforma->client?->address)
                {{ $proforma->client->address }}<br>
                @endif
                @if($proforma->client?->city || $proforma->client?->zip)
                {{ $proforma->client->zip }} {{ $proforma->client->city }}
                @if($proforma->client?->country)
                , {{ $proforma->client->country }}
                @endif
                <br>
                @endif
                @if($proforma->client?->email)
                Email: {{ $proforma->client->email }}
                @endif
            </p>
        </div>

        <table>
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
                        @if($item->description)
                        <br><span style="font-size: 12px; color: #666;">{{ $item->description }}</span>
                        @endif
                    </td>
                    <td class="text-right">{{ $item->quantity }}</td>
                    <td class="text-right">{{ $formatAmount($item->quantity > 0 ? $item->total / $item->quantity : 0) }} {{ $currency }}</td>
                    <td class="text-right">{{ $item->tax_rate / 100 }}%</td>
                    <td class="text-right">{{ $formatAmount($item->total) }} {{ $currency }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals clearfix">
            <table>
                <tr>
                    <td><strong>Osnovica:</strong></td>
                    <td class="text-right">{{ $formatAmount($proforma->subtotal) }} {{ $currency }}</td>
                </tr>
                <tr>
                    <td><strong>PDV:</strong></td>
                    <td class="text-right">{{ $formatAmount($proforma->tax_total) }} {{ $currency }}</td>
                </tr>
                <tr class="total-row">
                    <td><strong>Ukupno:</strong></td>
                    <td class="text-right">{{ $formatAmount($proforma->total) }} {{ $currency }}</td>
                </tr>
            </table>
        </div>

        @if($proforma->notes)
        <div class="notes">
            <strong>Napomena:</strong> {{ $proforma->notes }}
        </div>
        @endif

        <div class="footer">
            <p>{{ $company->name }}</p>
        </div>
    </div>
</body>
</html>
