<?php

use App\Models\Client;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Currency;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\FiscalPaymentTypeEnum;
use App\Models\Enums\LanguageEnum;
use App\Models\Invoice;
use App\Models\Proforma;
use App\Models\Quote;
use App\Models\User;
use App\Services\DocumentNumberService;

function numbering(): DocumentNumberService
{
    return app(DocumentNumberService::class);
}

function numberingCompany(): Company
{
    return Company::factory()->create();
}

function numberedInvoice(Company $company, string $number, ?int $year = null): Invoice
{
    $year ??= (int) date('Y');

    return Invoice::factory()->create([
        'company_id' => $company->id,
        'client_id' => Client::factory()->create(['company_id' => $company->id])->id,
        'status' => DocumentStatusEnum::Created,
        'invoice_number' => $number,
        'date' => "{$year}-06-15",
    ]);
}

/** Delete a document the way the controllers do: row first, then release the number. */
function deleteAndRelease(Company $company, string $type, $document, string $numberColumn): void
{
    $number = $document->{$numberColumn};
    $document->delete();
    numbering()->releaseNumber($company, $type, $number);
}

function invoicePayload(int $clientId, int $year): array
{
    return [
        'client_id' => $clientId,
        'date' => "{$year}-06-20",
        'due_date' => "{$year}-07-20",
        'language' => LanguageEnum::English->value,
        'invoice_template' => DocumentTemplateEnum::Classic->value,
        'payment_type' => FiscalPaymentTypeEnum::Cash->value,
        'subtotal' => 10000,
        'tax_total' => 0,
        'discount_total' => 0,
        'total' => 10000,
        'items' => [
            [
                'name' => 'Test',
                'quantity' => 1,
                'unit_price' => 10000,
                'subtotal' => 10000,
                'tax_rate' => 0,
                'tax_amount' => 0,
                'total' => 10000,
            ],
        ],
    ];
}

it('starts from the configured starting number when there are no documents', function () {
    $company = numberingCompany();
    CompanySetting::set('invoice_numbering_starting_number', 5, $company->id);

    expect(numbering()->getNextNumber($company, 'invoice')['number'])->toBe(5);
});

it('continues from the highest number in use', function () {
    $company = numberingCompany();
    $year = (int) date('Y');

    numberedInvoice($company, sprintf('0003/%d', $year));
    numberedInvoice($company, sprintf('0007/%d', $year));

    expect(numbering()->getNextNumber($company, 'invoice')['number'])->toBe(8);
});

it('keeps the starting number as a floor when it is raised above the series', function () {
    $company = numberingCompany();
    $year = (int) date('Y');

    numberedInvoice($company, sprintf('0003/%d', $year));
    CompanySetting::set('invoice_numbering_starting_number', 50, $company->id);

    expect(numbering()->getNextNumber($company, 'invoice')['number'])->toBe(50);
});

it('hands out the number of the deleted highest document again', function () {
    $company = numberingCompany();
    $year = (int) date('Y');

    numberedInvoice($company, sprintf('0001/%d', $year));
    numberedInvoice($company, sprintf('0002/%d', $year));
    $last = numberedInvoice($company, sprintf('0003/%d', $year));

    numbering()->reserveNumber($company, 'invoice', $year); // counter is at 4 now
    deleteAndRelease($company, 'invoice', $last, 'invoice_number');

    expect(numbering()->getNextNumber($company, 'invoice', $year)['number'])->toBe(3);
});

it('releases the whole tail even when documents are deleted out of order', function () {
    $company = numberingCompany();
    $year = (int) date('Y');

    $invoices = [];
    foreach (range(1, 10) as $n) {
        $invoices[$n] = numberedInvoice($company, sprintf('%04d/%d', $n, $year));
    }

    // 0009 first, then 0010 — the counter-only implementation left the series at 10 here.
    deleteAndRelease($company, 'invoice', $invoices[9], 'invoice_number');
    deleteAndRelease($company, 'invoice', $invoices[10], 'invoice_number');

    expect(numbering()->getNextNumber($company, 'invoice', $year)['number'])->toBe(9);
});

it('returns to the starting number once every document is deleted', function () {
    $company = numberingCompany();
    $year = (int) date('Y');
    CompanySetting::set('invoice_numbering_starting_number', 10, $company->id);

    $first = numberedInvoice($company, sprintf('0010/%d', $year));
    $second = numberedInvoice($company, sprintf('0011/%d', $year));

    deleteAndRelease($company, 'invoice', $first, 'invoice_number');
    deleteAndRelease($company, 'invoice', $second, 'invoice_number');

    expect(numbering()->getNextNumber($company, 'invoice', $year)['number'])->toBe(10);
});

it('does not reuse a gap in the middle of the series', function () {
    $company = numberingCompany();
    $year = (int) date('Y');

    $invoices = [];
    foreach (range(1, 5) as $n) {
        $invoices[$n] = numberedInvoice($company, sprintf('%04d/%d', $n, $year));
    }

    deleteAndRelease($company, 'invoice', $invoices[3], 'invoice_number');

    expect(numbering()->getNextNumber($company, 'invoice', $year)['number'])->toBe(6);
});

it('reads and writes prefixed numbers', function () {
    $company = numberingCompany();
    $year = (int) date('Y');
    CompanySetting::set('invoice_numbering_prefix', 'INV', $company->id);

    numberedInvoice($company, sprintf('INV-0003/%d', $year));

    expect(numbering()->getNextNumber($company, 'invoice', $year)['formatted'])
        ->toBe(sprintf('INV-0004/%d', $year));
});

it('works without a year suffix when yearly reset is disabled', function () {
    $company = numberingCompany();
    CompanySetting::set('document_numbering_reset_yearly', false, $company->id);

    numberedInvoice($company, '0004');

    $next = numbering()->getNextNumber($company, 'invoice');

    expect($next['number'])->toBe(5)
        ->and($next['formatted'])->toBe('0005');
});

it('keeps each year independent', function () {
    $company = numberingCompany();

    numberedInvoice($company, '0009/2025', 2025);

    expect(numbering()->getNextNumber($company, 'invoice', 2026)['number'])->toBe(1)
        ->and(numbering()->getNextNumber($company, 'invoice', 2025)['number'])->toBe(10);
});

it('respects a manually entered number above the series', function () {
    $company = numberingCompany();
    $year = (int) date('Y');

    numberedInvoice($company, sprintf('0001/%d', $year));
    numberedInvoice($company, sprintf('0050/%d', $year)); // typed in by hand

    expect(numbering()->getNextNumber($company, 'invoice', $year)['number'])->toBe(51);
});

it('tenant: deleting the last invoice reuses its number on the next create', function () {
    $user = User::factory()->create();
    $company = numberingCompany();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);
    Currency::factory()->bam()->create(['company_id' => $company->id, 'is_default' => true]);

    $year = (int) date('Y');
    numberedInvoice($company, sprintf('0001/%d', $year));
    numberedInvoice($company, sprintf('0002/%d', $year));
    $last = numberedInvoice($company, sprintf('0003/%d', $year));

    $this->withHeaders(authHeaders($user))
        ->deleteJson("/api/v1/{$company->slug}/invoices/{$last->id}")
        ->assertStatus(200);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices", invoicePayload($client->id, $year));

    $response->assertStatus(201);
    expect($response->json('data.invoice_number'))->toBe(sprintf('0003/%d', $year));
});

it('tenant: deleting every invoice restarts from the configured starting number', function () {
    $user = User::factory()->create();
    $company = numberingCompany();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);
    Currency::factory()->bam()->create(['company_id' => $company->id, 'is_default' => true]);
    CompanySetting::set('invoice_numbering_starting_number', 10, $company->id);

    $year = (int) date('Y');
    $invoice = numberedInvoice($company, sprintf('0010/%d', $year));

    $this->withHeaders(authHeaders($user))
        ->deleteJson("/api/v1/{$company->slug}/invoices/{$invoice->id}")
        ->assertStatus(200);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices", invoicePayload($client->id, $year));

    $response->assertStatus(201);
    expect($response->json('data.invoice_number'))->toBe(sprintf('0010/%d', $year));
});

it('tenant: deleting a quote releases its number', function () {
    $user = User::factory()->create();
    $company = numberingCompany();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);

    $year = (int) date('Y');
    Quote::factory()->create([
        'company_id' => $company->id,
        'client_id' => $client->id,
        'quote_number' => sprintf('0001/%d', $year),
    ]);
    $quote = Quote::factory()->create([
        'company_id' => $company->id,
        'client_id' => $client->id,
        'quote_number' => sprintf('0002/%d', $year),
    ]);

    $this->withHeaders(authHeaders($user))
        ->deleteJson("/api/v1/{$company->slug}/quotes/{$quote->id}")
        ->assertStatus(200);

    expect(numbering()->getNextNumber($company, 'quote', $year)['number'])->toBe(2);
});

it('tenant: deleting a proforma releases its number', function () {
    $user = User::factory()->create();
    $company = numberingCompany();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);

    $year = (int) date('Y');
    Proforma::factory()->create([
        'company_id' => $company->id,
        'client_id' => $client->id,
        'proforma_number' => sprintf('0004/%d', $year),
    ]);
    $proforma = Proforma::factory()->create([
        'company_id' => $company->id,
        'client_id' => $client->id,
        'proforma_number' => sprintf('0005/%d', $year),
    ]);

    $this->withHeaders(authHeaders($user))
        ->deleteJson("/api/v1/{$company->slug}/proformas/{$proforma->id}")
        ->assertStatus(200);

    expect(numbering()->getNextNumber($company, 'proforma', $year)['number'])->toBe(5);
});
