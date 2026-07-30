<?php

use App\Models\Client;
use App\Models\Company;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\FiscalRecordTypeEnum;
use App\Models\FiscalRecord;
use App\Models\Invoice;
use App\Models\User;
use App\Services\FiscalReceiptStore;
use Illuminate\Support\Facades\Storage;

/**
 * The receipt disk is swapped for a fake one, which also proves the code no longer depends on
 * real filesystem paths — it would break on any non-local driver.
 */
function fakeReceiptDisk(): Illuminate\Contracts\Filesystem\Filesystem
{
    config()->set('filesystems.fiscal_receipts_disk', 'receipts-test');

    return Storage::fake('receipts-test');
}

function invoiceWithFiscalRecord(Company $company, ?string $imagePath): array
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
        'fiscalized_at' => now(),
        'fiscal_receipt_image_path' => $imagePath,
    ]);

    return [$invoice, $record];
}

it('streams the receipt from the configured disk', function () {
    $disk = fakeReceiptDisk();
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    [$invoice, $record] = invoiceWithFiscalRecord($company, 'acme/2026-07/0001-2026-original.png');
    $disk->put('acme/2026-07/0001-2026-original.png', 'fake-png-bytes');

    $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/invoices/{$invoice->id}/fiscal-receipt-image?fiscal_record_id={$record->id}")
        ->assertStatus(200)
        ->assertHeader('Content-Type', 'image/png');
});

it('serves a pdf receipt with the pdf content type', function () {
    $disk = fakeReceiptDisk();
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    [$invoice, $record] = invoiceWithFiscalRecord($company, 'acme/2026-07/0001-2026-original.pdf');
    $disk->put('acme/2026-07/0001-2026-original.pdf', '%PDF-1.4 fake');

    $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/invoices/{$invoice->id}/fiscal-receipt-image?fiscal_record_id={$record->id}")
        ->assertStatus(200)
        ->assertHeader('Content-Type', 'application/pdf');
});

it('explains that the file is gone rather than that no image exists', function () {
    fakeReceiptDisk(); // path recorded, nothing written — the production symptom
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    [$invoice, $record] = invoiceWithFiscalRecord($company, 'acme/2026-07/0001-2026-original.png');

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/invoices/{$invoice->id}/fiscal-receipt-image?fiscal_record_id={$record->id}")
        ->assertStatus(404);

    expect($response->json('message'))->toContain('datoteke nema na disku');
});

it('distinguishes a record that never got an image', function () {
    fakeReceiptDisk();
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    [$invoice, $record] = invoiceWithFiscalRecord($company, null);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/invoices/{$invoice->id}/fiscal-receipt-image?fiscal_record_id={$record->id}")
        ->assertStatus(404);

    expect($response->json('message'))->toContain('OFS nije vratio sliku');
});

it('does not leak receipts of another company', function () {
    $disk = fakeReceiptDisk();
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $other = Company::factory()->create();
    attachUserToCompany($user, $company);
    attachUserToCompany($user, $other);

    [$invoice, $record] = invoiceWithFiscalRecord($other, 'other/2026-07/0001-2026-original.png');
    $disk->put('other/2026-07/0001-2026-original.png', 'fake-png-bytes');

    $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/invoices/{$invoice->id}/fiscal-receipt-image?fiscal_record_id={$record->id}")
        ->assertStatus(404);
});

it('names the mail attachment after what was actually stored', function () {
    $disk = fakeReceiptDisk();
    $company = Company::factory()->create();

    [$invoice, $record] = invoiceWithFiscalRecord($company, 'acme/2026-07/0001-2026-original.pdf');
    $disk->put('acme/2026-07/0001-2026-original.pdf', '%PDF-1.4 fake');

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

    [$invoice, $record] = invoiceWithFiscalRecord($company, 'acme/2026-07/0001-2026-original.png');

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

    [$invoice, $record] = invoiceWithFiscalRecord($company, 'acme/2026-07/0001-2026-original.png');

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

it('resolves the disk from configuration', function () {
    config()->set('filesystems.fiscal_receipts_disk', 'receipts-test');

    expect(app(FiscalReceiptStore::class)->diskName())->toBe('receipts-test');

    // FISCAL_RECEIPTS_DISK present but empty must not reach Storage::disk('').
    config()->set('filesystems.fiscal_receipts_disk', '');

    expect(app(FiscalReceiptStore::class)->diskName())->toBe('fiscal_receipts');

    config()->set('filesystems.fiscal_receipts_disk', null);

    expect(app(FiscalReceiptStore::class)->diskName())->toBe('fiscal_receipts');
});
