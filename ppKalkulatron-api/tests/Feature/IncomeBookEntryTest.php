<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Company;
use App\Models\Enums\ArticleTypeEnum;
use App\Models\IncomeBookEntry;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IncomeBookEntryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->company = Company::factory()->create();

        $this->user->companies()->attach($this->company->id);

        $this->actingAs($this->user);
    }

    public function test_can_create_manual_entry_without_invoice_using_explicit_payload()
    {
        $payload = [
            'booking_date' => now()->format('Y-m-d'),
            'bank_account_id' => null,
            'payment_date' => null,
            'description' => 'Rucno knjizenje',
            'invoice_id' => null,
            'amount_services' => 1000,
            'amount_goods' => 500,
            'amount_products' => 200,
            'amount_other_income' => 100,
            'amount_financial_income' => 50,
            'total_amount' => 1850,
            'vat_amount' => 314,
        ];

        $response = $this->postJson("/api/v1/{$this->company->slug}/income-book-entries", $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.entry_number', 1)
            ->assertJsonPath('data.amount_services', 1000)
            ->assertJsonPath('data.amount_goods', 500)
            ->assertJsonPath('data.amount_products', 200)
            ->assertJsonPath('data.amount_other_income', 100)
            ->assertJsonPath('data.amount_financial_income', 50)
            ->assertJsonPath('data.total_amount', 1850)
            ->assertJsonPath('data.vat_amount', 314)
            ->assertJsonPath('data.invoice_id', null);

        $this->assertDatabaseHas('income_book_entries', [
            'company_id' => $this->company->id,
            'entry_number' => 1,
            'total_amount' => 1850,
        ]);
    }

    public function test_can_create_entry_with_invoice_using_payload_values_from_pwa()
    {
        $invoice = Invoice::factory()->create(['company_id' => $this->company->id]);

        $payload = [
            'booking_date' => now()->format('Y-m-d'),
            'bank_account_id' => null,
            'payment_date' => null,
            'description' => 'Uplata po fakturi',
            'invoice_id' => $invoice->id,
            'amount_services' => 6000,
            'amount_goods' => 3500,
            'amount_products' => 1500,
            'amount_other_income' => 200,
            'amount_financial_income' => 100,
            'total_amount' => 11300,
            'vat_amount' => 1921,
        ];

        $response = $this->postJson("/api/v1/{$this->company->slug}/income-book-entries", $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.entry_number', 1)
            ->assertJsonPath('data.amount_services', 6000)
            ->assertJsonPath('data.amount_goods', 3500)
            ->assertJsonPath('data.amount_products', 1500)
            ->assertJsonPath('data.amount_other_income', 200)
            ->assertJsonPath('data.amount_financial_income', 100)
            ->assertJsonPath('data.invoice_id', $invoice->id)
            ->assertJsonPath('data.total_amount', 11300)
            ->assertJsonPath('data.vat_amount', 1921);
    }

    public function test_can_calculate_allocation_from_invoice_full_payment()
    {
        $invoice = Invoice::factory()->create([
            'company_id' => $this->company->id,
            'subtotal' => 20000,
            'tax_total' => 3400,
            'total' => 23400,
        ]);

        $articleServices = Article::factory()->create([
            'company_id' => $this->company->id,
            'type' => ArticleTypeEnum::SERVICES,
        ]);
        InvoiceItem::factory()->create([
            'invoice_id' => $invoice->id,
            'article_id' => $articleServices->id,
            'subtotal' => 10000,
            'tax_amount' => 1700,
            'total' => 11700,
        ]);

        $articleGoods = Article::factory()->create([
            'company_id' => $this->company->id,
            'type' => ArticleTypeEnum::GOODS,
        ]);
        InvoiceItem::factory()->create([
            'invoice_id' => $invoice->id,
            'article_id' => $articleGoods->id,
            'subtotal' => 10000,
            'tax_amount' => 1700,
            'total' => 11700,
        ]);

        $response = $this->postJson("/api/v1/{$this->company->slug}/income-book-entries/calculate-allocation", [
            'invoice_id' => $invoice->id,
            'payment_amount' => 23400,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.invoice_id', $invoice->id)
            ->assertJsonPath('data.payment_amount', 23400)
            ->assertJsonPath('data.amount_services', 10000)
            ->assertJsonPath('data.amount_goods', 10000)
            ->assertJsonPath('data.amount_products', 0)
            ->assertJsonPath('data.amount_other_income', 0)
            ->assertJsonPath('data.amount_financial_income', 0)
            ->assertJsonPath('data.total_amount', 20000)
            ->assertJsonPath('data.vat_amount', 3400);
    }

    public function test_can_calculate_allocation_from_invoice_partial_payment()
    {
        $invoice = Invoice::factory()->create([
            'company_id' => $this->company->id,
            'subtotal' => 20000,
            'tax_total' => 3400,
            'total' => 23400,
        ]);

        $articleServices = Article::factory()->create([
            'company_id' => $this->company->id,
            'type' => ArticleTypeEnum::SERVICES,
        ]);
        InvoiceItem::factory()->create([
            'invoice_id' => $invoice->id,
            'article_id' => $articleServices->id,
            'subtotal' => 10000,
            'tax_amount' => 1700,
            'total' => 11700,
        ]);

        $articleGoods = Article::factory()->create([
            'company_id' => $this->company->id,
            'type' => ArticleTypeEnum::GOODS,
        ]);
        InvoiceItem::factory()->create([
            'invoice_id' => $invoice->id,
            'article_id' => $articleGoods->id,
            'subtotal' => 10000,
            'tax_amount' => 1700,
            'total' => 11700,
        ]);

        $response = $this->postJson("/api/v1/{$this->company->slug}/income-book-entries/calculate-allocation", [
            'invoice_id' => $invoice->id,
            'payment_amount' => 11700,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.payment_amount', 11700)
            ->assertJsonPath('data.amount_services', 5000)
            ->assertJsonPath('data.amount_goods', 5000)
            ->assertJsonPath('data.total_amount', 10000)
            ->assertJsonPath('data.vat_amount', 1700);
    }

    public function test_store_requires_full_payload()
    {
        $payload = [
            'booking_date' => now()->format('Y-m-d'),
        ];

        $response = $this->postJson("/api/v1/{$this->company->slug}/income-book-entries", $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'bank_account_id',
                'payment_date',
                'description',
                'invoice_id',
                'amount_services',
                'amount_goods',
                'amount_products',
                'amount_other_income',
                'amount_financial_income',
                'total_amount',
                'vat_amount',
            ]);
    }

    public function test_can_update_entry_with_explicit_payload()
    {
        $entry = IncomeBookEntry::create([
            'company_id' => $this->company->id,
            'entry_number' => 1,
            'booking_date' => now()->subDay()->format('Y-m-d'),
            'description' => 'Stari unos',
            'amount_services' => 500,
            'amount_goods' => 0,
            'amount_products' => 0,
            'amount_other_income' => 0,
            'amount_financial_income' => 0,
            'total_amount' => 500,
            'vat_amount' => 85,
            'bank_account_id' => null,
            'payment_date' => null,
            'invoice_id' => null,
        ]);

        $payload = [
            'entry_number' => 1,
            'booking_date' => now()->format('Y-m-d'),
            'bank_account_id' => null,
            'payment_date' => null,
            'description' => 'Azurirani unos',
            'invoice_id' => null,
            'amount_services' => 700,
            'amount_goods' => 300,
            'amount_products' => 200,
            'amount_other_income' => 50,
            'amount_financial_income' => 25,
            'total_amount' => 1275,
            'vat_amount' => 216,
        ];

        $response = $this->putJson("/api/v1/{$this->company->slug}/income-book-entries/{$entry->id}", $payload);

        $response->assertStatus(200)
            ->assertJsonPath('data.description', 'Azurirani unos')
            ->assertJsonPath('data.total_amount', 1275)
            ->assertJsonPath('data.vat_amount', 216);

        $this->assertDatabaseHas('income_book_entries', [
            'id' => $entry->id,
            'description' => 'Azurirani unos',
            'amount_services' => 700,
            'amount_goods' => 300,
            'amount_products' => 200,
            'amount_other_income' => 50,
            'amount_financial_income' => 25,
            'total_amount' => 1275,
            'vat_amount' => 216,
        ]);
    }

    public function test_update_requires_full_payload()
    {
        $entry = IncomeBookEntry::create([
            'company_id' => $this->company->id,
            'entry_number' => 2,
            'booking_date' => now()->format('Y-m-d'),
            'description' => null,
            'amount_services' => 0,
            'amount_goods' => 0,
            'amount_products' => 0,
            'amount_other_income' => 0,
            'amount_financial_income' => 0,
            'total_amount' => 0,
            'vat_amount' => 0,
            'bank_account_id' => null,
            'payment_date' => null,
            'invoice_id' => null,
        ]);

        $response = $this->putJson("/api/v1/{$this->company->slug}/income-book-entries/{$entry->id}", [
            'entry_number' => 2,
            'booking_date' => now()->format('Y-m-d'),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'bank_account_id',
                'payment_date',
                'description',
                'invoice_id',
                'amount_services',
                'amount_goods',
                'amount_products',
                'amount_other_income',
                'amount_financial_income',
                'total_amount',
                'vat_amount',
            ]);
    }
}
