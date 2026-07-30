<?php

use App\Models\Client;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\FiscalRecordTypeEnum;
use App\Models\FiscalReceiptImage;
use App\Models\FiscalRecord;
use App\Models\Invoice;
use App\Models\User;
use App\Services\FiscalReceiptStore;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

/** Swapping the receipt disk for a fake one also proves the fallback is not path-based. */
function fakeReceiptDisk(): Illuminate\Contracts\Filesystem\Filesystem
{
    config()->set('filesystems.fiscal_receipts_disk', 'receipts-test');

    return Storage::fake('receipts-test');
}

function fiscalizedInvoice(Company $company, ?string $imagePath, ?string $requestId = 'req-1'): array
{
    $client = Client::factory()->create(['company_id' => $company->id]);

    $invoice = Invoice::factory()->create([
        'company_id' => $company->id,
        'client_id' => $client->id,
        'invoice_number' => '0001/2026',
        'status' => DocumentStatusEnum::Fiscalized,
    ]);

    $record = FiscalRecord::create([
        'invoice_id' => $invoice->id,
        'type' => FiscalRecordTypeEnum::Original,
        'fiscal_invoice_number' => 'ABC123-ABC123-1',
        'request_id' => $requestId,
        'fiscalized_at' => now(),
        'fiscal_receipt_image_path' => $imagePath,
    ]);

    return [$invoice, $record];
}

function storeReceiptInDb(FiscalRecord $record, string $binary, string $extension = 'png'): void
{
    app(FiscalReceiptStore::class)->store($record, $binary, $extension);
    $record->refresh();
}

function receiptUrl(Company $company, Invoice $invoice, FiscalRecord $record): string
{
    return "/api/v1/{$company->slug}/invoices/{$invoice->id}/fiscal-receipt-image?fiscal_record_id={$record->id}";
}

it('serves a receipt stored in the database', function () {
    fakeReceiptDisk();
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    [$invoice, $record] = fiscalizedInvoice($company, 'acme/2026-07/0001-2026-original.png');
    storeReceiptInDb($record, 'fake-png-bytes');

    $response = $this->withHeaders(authHeaders($user))
        ->get(receiptUrl($company, $invoice, $record))
        ->assertStatus(200)
        ->assertHeader('Content-Type', 'image/png');

    expect($response->content())->toBe('fake-png-bytes');
});

it('serves a pdf receipt with the pdf content type', function () {
    fakeReceiptDisk();
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    [$invoice, $record] = fiscalizedInvoice($company, 'acme/2026-07/0001-2026-original.pdf');
    storeReceiptInDb($record, '%PDF-1.4 fake', 'pdf');

    $this->withHeaders(authHeaders($user))
        ->get(receiptUrl($company, $invoice, $record))
        ->assertStatus(200)
        ->assertHeader('Content-Type', 'application/pdf');
});

it('still serves a receipt that only exists as a legacy file on disk', function () {
    $disk = fakeReceiptDisk();
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    [$invoice, $record] = fiscalizedInvoice($company, 'acme/2026-02/0001-2026-original.png');
    $disk->put('acme/2026-02/0001-2026-original.png', 'legacy-bytes');

    $response = $this->withHeaders(authHeaders($user))
        ->get(receiptUrl($company, $invoice, $record))
        ->assertStatus(200);

    expect($response->content())->toBe('legacy-bytes');
});

it('explains that the content is gone rather than that no image exists', function () {
    fakeReceiptDisk(); // name recorded, nothing in the database and no file — the lost receipts
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    [$invoice, $record] = fiscalizedInvoice($company, 'acme/2026-02/0001-2026-original.png');

    $response = $this->withHeaders(authHeaders($user))
        ->getJson(receiptUrl($company, $invoice, $record))
        ->assertStatus(404);

    expect($response->json('message'))->toContain('fiscal:recover-receipts');
});

it('distinguishes a record that never got an image', function () {
    fakeReceiptDisk();
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    [$invoice, $record] = fiscalizedInvoice($company, null);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson(receiptUrl($company, $invoice, $record))
        ->assertStatus(404);

    expect($response->json('message'))->toContain('OFS nije vratio sliku');
});

it('does not leak receipts of another company', function () {
    fakeReceiptDisk();
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $other = Company::factory()->create();
    attachUserToCompany($user, $company);
    attachUserToCompany($user, $other);

    [$invoice, $record] = fiscalizedInvoice($other, 'other/2026-07/0001-2026-original.png');
    storeReceiptInDb($record, 'fake-png-bytes');

    $this->withHeaders(authHeaders($user))
        ->getJson(receiptUrl($company, $invoice, $record))
        ->assertStatus(404);
});

it('keeps the receipt out of invoice listing queries', function () {
    fakeReceiptDisk();
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    [$invoice, $record] = fiscalizedInvoice($company, 'acme/2026-07/0001-2026-original.png');
    storeReceiptInDb($record, str_repeat('x', 50_000));

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/invoices")
        ->assertStatus(200);

    // A receipt column on fiscal_records would have been read and serialised here.
    expect($response->content())->not->toContain('xxxxxxxxxx');
});

it('names the mail attachment after what was actually stored', function () {
    fakeReceiptDisk();
    $company = Company::factory()->create();

    [$invoice, $record] = fiscalizedInvoice($company, 'acme/2026-07/0001-2026-original.pdf');
    storeReceiptInDb($record, '%PDF-1.4 fake', 'pdf');

    $mail = new App\Mail\InvoiceMail(
        invoice: $invoice->load('fiscalRecords'),
        emailSubject: 'Račun',
        body: 'Tekst',
        attachFiscalRecordIds: [$record->id],
    );

    $attachment = collect($mail->attachments())->first();

    expect($attachment->as)->toBe('fiskalni-racun_0001/2026.pdf')
        ->and($attachment->mime)->toBe('application/pdf');
});

it('skips a missing receipt attachment instead of failing to send', function () {
    fakeReceiptDisk();
    $company = Company::factory()->create();

    [$invoice, $record] = fiscalizedInvoice($company, 'acme/2026-02/0001-2026-original.png');

    $mail = new App\Mail\InvoiceMail(
        invoice: $invoice->load('fiscalRecords'),
        emailSubject: 'Račun',
        body: 'Tekst',
        attachFiscalRecordIds: [$record->id],
    );

    expect($mail->attachments())->toBe([]);
});

it('reports a receipt it could not attach when sending the mail', function () {
    fakeReceiptDisk();
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    [$invoice, $record] = fiscalizedInvoice($company, 'acme/2026-02/0001-2026-original.png');

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoice->id}/send-email", [
            'to' => 'kupac@example.com',
            'subject' => 'Račun 0001/2026',
            'body' => 'Tekst',
            'attach_pdf' => false,
            'attach_fiscal_record_ids' => [$record->id],
        ])
        ->assertStatus(200);

    expect($response->json('missing_fiscal_receipt_record_ids'))->toBe([$record->id])
        ->and($response->json('message'))->toContain('nije priložena');
});

it('resolves the fallback disk from configuration', function () {
    config()->set('filesystems.fiscal_receipts_disk', 'receipts-test');

    expect(app(FiscalReceiptStore::class)->diskName())->toBe('receipts-test');

    // FISCAL_RECEIPTS_DISK present but empty must not reach Storage::disk('').
    config()->set('filesystems.fiscal_receipts_disk', '');

    expect(app(FiscalReceiptStore::class)->diskName())->toBe('fiscal_receipts');
});

it('reads the receipt out of any OFS response shape', function (string $field, string $value, string $expectedExtension) {
    $receipt = app(FiscalReceiptStore::class)->extractFrom([$field => $value]);

    expect($receipt['extension'])->toBe($expectedExtension);
})->with([
    ['invoiceImagePngBase64', 'ZmFrZS1wbmc=', 'png'],
    ['invoiceImagePdfBase64', 'JVBERi0xLjQ=', 'pdf'],
    ['invoiceImageHtmlBase64', 'PGh0bWw+', 'html'],
    ['invoiceImageHtml', '<html>račun</html>', 'html'],
]);

it('recovers a lost receipt from OFS', function () {
    fakeReceiptDisk();
    $company = Company::factory()->create();
    CompanySetting::set('ofs_base_url', 'https://ofs.test/api', $company->id);

    [, $record] = fiscalizedInvoice($company, 'acme/2026-02/0001-2026-original.png', 'req-abc');

    Http::fake([
        '*/api/invoices/request/req-abc' => Http::response([
            'invoiceNumber' => 'ABC123-ABC123-1',
            'invoiceImagePngBase64' => base64_encode('recovered-bytes'),
        ], 200),
    ]);

    $this->artisan('fiscal:recover-receipts')
        ->assertExitCode(0);

    expect(FiscalReceiptImage::where('fiscal_record_id', $record->id)->exists())->toBeTrue()
        ->and(app(FiscalReceiptStore::class)->binary($record->fresh()))->toBe('recovered-bytes');
});

it('leaves the receipt alone on a dry run', function () {
    fakeReceiptDisk();
    $company = Company::factory()->create();
    CompanySetting::set('ofs_base_url', 'https://ofs.test/api', $company->id);

    [, $record] = fiscalizedInvoice($company, 'acme/2026-02/0001-2026-original.png', 'req-abc');

    Http::fake([
        '*/api/invoices/request/req-abc' => Http::response([
            'invoiceImagePngBase64' => base64_encode('recovered-bytes'),
        ], 200),
    ]);

    $this->artisan('fiscal:recover-receipts --dry-run')->assertExitCode(0);

    expect(FiscalReceiptImage::where('fiscal_record_id', $record->id)->exists())->toBeFalse();
});

it('reports a receipt OFS no longer has', function () {
    fakeReceiptDisk();
    $company = Company::factory()->create();
    CompanySetting::set('ofs_base_url', 'https://ofs.test/api', $company->id);

    [, $record] = fiscalizedInvoice($company, 'acme/2026-02/0001-2026-original.png', 'req-old');

    // OFS keeps only the last 100 requests; an aged-out one comes back empty.
    Http::fake([
        '*/api/invoices/request/req-old' => Http::response([], 200),
    ]);

    $this->artisan('fiscal:recover-receipts')
        ->expectsOutputToContain('Could not recover 1 receipt(s)')
        ->assertExitCode(0);

    expect(FiscalReceiptImage::where('fiscal_record_id', $record->id)->exists())->toBeFalse();
});

it('does not re-fetch a receipt it already has', function () {
    fakeReceiptDisk();
    $company = Company::factory()->create();

    [, $record] = fiscalizedInvoice($company, 'acme/2026-07/0001-2026-original.png');
    storeReceiptInDb($record, 'already-here');

    Http::fake(); // any OFS call would return an empty 200 and overwrite nothing

    $this->artisan('fiscal:recover-receipts')
        ->expectsOutputToContain('Nothing to recover')
        ->assertExitCode(0);

    Http::assertNothingSent();
});
