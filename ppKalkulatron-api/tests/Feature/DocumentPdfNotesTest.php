<?php

use App\Models\Article;
use App\Models\Client;
use App\Models\Company;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Proforma;
use App\Models\ProformaItem;
use App\Models\Quote;
use App\Models\QuoteItem;

/**
 * Notes are entered in a textarea, so they contain newlines. HTML collapses those into spaces,
 * which is why the PDF printed a multi-line note as one paragraph.
 */
const MULTILINE_NOTE = "Prva linija.\nDruga linija.\n\nNakon praznog reda.";

function renderDocumentTemplate(string $view, string $documentType): string
{
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    $article = Article::factory()->create(['company_id' => $company->id, 'unit' => 'kom']);

    $attributes = [
        'company_id' => $company->id,
        'client_id' => $client->id,
        'notes' => MULTILINE_NOTE,
    ];

    [$document, $key] = match ($documentType) {
        'invoice' => [Invoice::factory()->create($attributes + ['invoice_number' => '0001/2026']), 'invoice'],
        'proforma' => [Proforma::factory()->create($attributes + ['proforma_number' => '0001/2026']), 'proforma'],
        'quote' => [Quote::factory()->create($attributes + ['quote_number' => '0001/2026']), 'quote'],
    };

    match ($documentType) {
        'invoice' => InvoiceItem::factory()->create(['invoice_id' => $document->id, 'article_id' => $article->id]),
        'proforma' => ProformaItem::factory()->create(['proforma_id' => $document->id, 'article_id' => $article->id]),
        'quote' => QuoteItem::factory()->create(['quote_id' => $document->id, 'article_id' => $article->id]),
    };

    return view($view, [
        $key => $document->load(['client', 'items', 'company']),
        'company' => $company,
        'bankAccounts' => collect(),
    ])->render();
}

it('keeps the line breaks of a note', function (string $view, string $documentType) {
    $html = renderDocumentTemplate($view, $documentType);

    expect($html)->toContain('Prva linija.')
        ->and($html)->toContain('Druga linija.')
        // Without <br> the newlines collapse and the note prints as one paragraph.
        ->and($html)->toMatch('/Prva linija\.\s*<br\s*\/?>\s*Druga linija\./');
})->with([
    ['pdf.invoice', 'invoice'],
    ['pdf.invoice-modern', 'invoice'],
    ['pdf.invoice-minimal', 'invoice'],
    ['pdf.invoice-standard', 'invoice'],
    ['pdf.proforma', 'proforma'],
    ['pdf.proforma-modern', 'proforma'],
    ['pdf.proforma-minimal', 'proforma'],
    ['pdf.proforma-standard', 'proforma'],
    ['pdf.quote', 'quote'],
    ['pdf.quote-modern', 'quote'],
    ['pdf.quote-minimal', 'quote'],
    ['pdf.quote-standard', 'quote'],
]);

it('escapes a note before turning newlines into breaks', function () {
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    $article = Article::factory()->create(['company_id' => $company->id, 'unit' => 'kom']);

    $invoice = Invoice::factory()->create([
        'company_id' => $company->id,
        'client_id' => $client->id,
        'invoice_number' => '0001/2026',
        'notes' => "<script>alert(1)</script>\nDruga linija.",
    ]);
    InvoiceItem::factory()->create(['invoice_id' => $invoice->id, 'article_id' => $article->id]);

    $html = view('pdf.invoice', [
        'invoice' => $invoice->load(['client', 'items', 'company']),
        'company' => $company,
        'bankAccounts' => collect(),
    ])->render();

    expect($html)->not->toContain('<script>alert(1)</script>')
        ->and($html)->toContain('&lt;script&gt;')
        // Escaped first, then newlines turned into breaks — not the other way round.
        ->and($html)->toMatch('/&lt;\/script&gt;\s*<br\s*\/?>\s*Druga linija\./');
});
