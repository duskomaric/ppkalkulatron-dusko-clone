<?php

use App\Models\Article;
use App\Models\Client;
use App\Models\Company;
use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\FiscalPaymentTypeEnum;
use App\Models\Invoice;
use App\Models\InvoiceItem;

/** Render a PDF template to HTML the same way InvoicePdfService does, without Browsershot. */
function renderInvoiceTemplate(
    DocumentTemplateEnum $template,
    array $invoiceAttributes = [],
    ?string $articleUnit = 'kom',
): string {
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);

    $invoice = Invoice::factory()->create($invoiceAttributes + [
        'company_id' => $company->id,
        'client_id' => $client->id,
        'invoice_number' => '0001/2026',
        'invoice_template' => $template,
    ]);

    InvoiceItem::factory()->create([
        'invoice_id' => $invoice->id,
        'name' => 'Test artikal',
        // The items table has no unit column — the unit comes from the article, or falls back.
        'article_id' => $articleUnit === null
            ? null
            : Article::factory()->create(['company_id' => $company->id, 'unit' => $articleUnit])->id,
    ]);

    return view($template->getViewName(), [
        'invoice' => $invoice->load(['client', 'items.article', 'company', 'currency', 'fiscalRecords']),
        'company' => $company,
        'bankAccounts' => collect(),
    ])->render();
}

it('shows the payment type label instead of the raw enum value', function (string $template) {
    $html = renderInvoiceTemplate(
        DocumentTemplateEnum::from($template),
        ['payment_type' => FiscalPaymentTypeEnum::WireTransfer],
    );

    expect($html)->toContain('Bankovni transfer')
        ->and($html)->not->toContain('WireTransfer');
})->with(['classic', 'modern', 'minimal', 'standard']);

it('leaves no payment type rendering as its raw value', function (string $paymentType) {
    $type = FiscalPaymentTypeEnum::from($paymentType);
    $html = renderInvoiceTemplate(DocumentTemplateEnum::Classic, ['payment_type' => $type]);

    expect($html)->toContain($type->label())
        ->and($html)->not->toContain($paymentType);
})->with(['Cash', 'Card', 'Check', 'WireTransfer', 'Voucher', 'MobileMoney', 'Other']);

it('renders units with their proper symbol', function (string $template) {
    $html = renderInvoiceTemplate(DocumentTemplateEnum::from($template), articleUnit: 'm2');

    expect($html)->toContain('m²')
        ->and($html)->not->toContain('>m2<');
})->with(['classic', 'modern']);

it('passes a unit it does not know through as written', function () {
    $html = renderInvoiceTemplate(DocumentTemplateEnum::Classic, articleUnit: 'tona');

    expect($html)->toContain('tona');
});

it('falls back to kom when the item has no article', function () {
    $html = renderInvoiceTemplate(DocumentTemplateEnum::Classic, articleUnit: null);

    expect($html)->toContain('>kom<');
});
