@php
    $formatAmount = fn ($pfening) => number_format($pfening / 100, 2, ',', '.');
    $currency = $invoice->currencyRelation?->code ?? $invoice->currency ?? 'BAM';
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Faktura {{ $invoice->invoice_number }}</title>
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
        .fiscal {
            margin-top: 20px;
            padding: 12px;
            background-color: #e8f5e9;
            border-radius: 5px;
            font-size: 12px;
            color: #2e7d32;
        }
        .fiscal a { color: #1b5e20; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header clearfix">
            <div class="invoice-details">
                <h1>FAKTURA</h1>
                <p>
                    <strong>Broj:</strong> {{ $invoice->invoice_number }}<br>
                    <strong>Datum:</strong> {{ $invoice->date->format('d.m.Y') }}<br>
                    <strong>Dospijeće:</strong> {{ $invoice->due_date->format('d.m.Y') }}<br>
                    @if($invoice->status)
                    <span class="badge badge-{{ strtolower($invoice->status->value) }}">
                        {{ $invoice->status->getLabel() }}
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
                    @if($invoice->bankAccount)
                    Račun: {{ $invoice->bankAccount->account_number }}<br>
                    Banka: {{ $invoice->bankAccount->bank_name }}
                    @if($invoice->bankAccount->swift)
                    <br>SWIFT: {{ $invoice->bankAccount->swift }}
                    @endif
                    @endif
                </p>
            </div>
        </div>

        <div class="client-details">
            <h3>Kupac:</h3>
            <p>
                <strong>{{ $invoice->client?->name ?? '—' }}</strong><br>
                @if($invoice->client?->address)
                {{ $invoice->client->address }}<br>
                @endif
                @if($invoice->client?->city || $invoice->client?->zip)
                {{ $invoice->client->zip }} {{ $invoice->client->city }}
                @if($invoice->client?->country)
                , {{ $invoice->client->country }}
                @endif
                <br>
                @endif
                @if($invoice->client?->email)
                Email: {{ $invoice->client->email }}
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
                @foreach($invoice->items as $item)
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
                    <td class="text-right">{{ $formatAmount($invoice->subtotal) }} {{ $currency }}</td>
                </tr>
                <tr>
                    <td><strong>PDV:</strong></td>
                    <td class="text-right">{{ $formatAmount($invoice->tax_total) }} {{ $currency }}</td>
                </tr>
                <tr class="total-row">
                    <td><strong>Ukupno:</strong></td>
                    <td class="text-right">{{ $formatAmount($invoice->total) }} {{ $currency }}</td>
                </tr>
            </table>
        </div>

        @if($invoice->notes)
        <div class="notes">
            <strong>Napomena:</strong> {{ $invoice->notes }}
        </div>
        @endif

        @if($invoice->fiscal_verification_url || $invoice->fiscal_invoice_number)
        <div class="fiscal">
            @if($invoice->fiscal_invoice_number)
            <strong>Fiskalni broj:</strong> {{ $invoice->fiscal_invoice_number }}
            @endif
            @if($invoice->fiscal_verification_url)
            <br><a href="{{ $invoice->fiscal_verification_url }}">Verifikacija na Poreskoj upravi</a>
            @endif
        </div>
        @endif

        <div class="footer">
            <p>{{ $company->name }}</p>
        </div>
    </div>
</body>
</html>
