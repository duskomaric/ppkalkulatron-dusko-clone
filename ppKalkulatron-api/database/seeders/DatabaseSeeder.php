<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Contract;
use App\Models\ContractItem;
use App\Models\Enums\ArticleTypeEnum;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\LanguageEnum;
use App\Models\Enums\UserRoleEnum;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Proforma;
use App\Models\ProformaItem;
use App\Models\Quote;
use App\Models\QuoteItem;
use App\Models\User;
use App\Models\Company;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
//        $makeItemData = function (string $name, ?int $articleId, int $quantity, int $unitPrice, int $taxRate): array {
//            $subtotal = $quantity * $unitPrice;
//            $taxAmount = (int) ($subtotal * $taxRate / 10000);
//            $total = $subtotal + $taxAmount;
//
//            return [
//                'article_id' => $articleId,
//                'name' => $name,
//                'description' => null,
//                'quantity' => $quantity,
//                'unit_price' => $unitPrice,
//                'subtotal' => $subtotal,
//                'tax_rate' => $taxRate,
//                'tax_amount' => $taxAmount,
//                'total' => $total,
//            ];
//        };
//
//        $makeInvoiceItemData = function (string $name, ?int $articleId, int $quantity, int $unitPrice, int $taxRate, string $taxLabel = 'A') use ($makeItemData): array {
//            return array_merge($makeItemData($name, $articleId, $quantity, $unitPrice, $taxRate), ['tax_label' => $taxLabel]);
//        };
//
//        $recalcTotals = function (iterable $items): array {
//            $subtotal = 0;
//            $taxTotal = 0;
//            $total = 0;
//
//            foreach ($items as $item) {
//                $subtotal += (int) $item['subtotal'];
//                $taxTotal += (int) $item['tax_amount'];
//                $total += (int) $item['total'];
//            }
//
//            return [$subtotal, $taxTotal, $total];
//        };

        // Create existing admin user
        $adminUser = User::factory()->create([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => 'admin',
            'role' => UserRoleEnum::ADMIN,
            'is_active' => true,
            'last_seen_at' => now(),
        ]);

        // Create 3 additional users
        $duskoUser = User::factory()->create([
            'first_name' => 'Dusko',
            'last_name' => 'User',
            'email' => 'dusko@dusko.com',
            'password' => 'dusko',
            'role' => UserRoleEnum::USER,
            'is_active' => true,
            'last_seen_at' => now(),
        ]);

//        $sandroUser = User::factory()->create([
//            'first_name' => 'Sandro',
//            'last_name' => 'User',
//            'email' => 'sandro@sandro.com',
//            'password' => 'sandro',
//            'role' => UserRoleEnum::USER,
//            'is_active' => true,
//            'last_seen_at' => now(),
//        ]);
//
//        $borisUser = User::factory()->create([
//            'first_name' => 'Boris',
//            'last_name' => 'User',
//            'email' => 'boris@boris.com',
//            'password' => 'boris',
//            'role' => UserRoleEnum::USER,
//            'is_active' => true,
//            'last_seen_at' => now(),
//        ]);

        // Create 4 companies
        $duskoCompany = Company::factory()->create(['name' => '++Dusko d.o.o.', 'slug' => 'plusplus-dusko', 'subscription_ends_at' => now()->addMonths(1)]);
//        $sandroCompany = Company::factory()->create(['name' => '++Sandro d.o.o.', 'slug' => 'plusplus-sandro', 'subscription_ends_at' => now()->addDays(8)]);
//        $borisCompany = Company::factory()->create(['name' => '++Boris d.o.o.', 'slug' => 'plusplus-boris', 'subscription_ends_at' => null ]);
        $plusiCompany = Company::factory()->create(['name' => '++i d.o.o.', 'slug' => 'plusplus-i']);

        // Assign companies to users
        // Dusko sees ++i and ++Dusko
        $duskoUser->companies()->attach([$duskoCompany->id]);

        // Sandro sees ++i and ++Sandro
//        $sandroUser->companies()->attach([$sandroCompany->id, $plusiCompany->id]);
//
//        // Boris sees ++i and ++Boris
//        $borisUser->companies()->attach([$borisCompany->id, $plusiCompany->id]);

        // Admin sees ++i
        $adminUser->companies()->attach([$plusiCompany->id, $duskoCompany->id]);

        // Create clients for each company (test data for leak detection)
//        $duskoCompany->clients()->createMany([
//            ['name' => 'Dusko Client 1', 'email' => 'client1@dusko.com', 'phone' => '+381601111111'],
//            ['name' => 'Dusko Client 2', 'email' => 'client2@dusko.com', 'phone' => '+381602222222'],
//            ['name' => 'Dusko Client 3', 'email' => 'client3@dusko.com', 'phone' => '+381603333333'],
//        ]);

//        $sandroCompany->clients()->createMany([
//            ['name' => 'Sandro Client 1', 'email' => 'client1@sandro.com', 'phone' => '+381604444444'],
//            ['name' => 'Sandro Client 2', 'email' => 'client2@sandro.com', 'phone' => '+381605555555'],
//            ['name' => 'Sandro Client 3', 'email' => 'client3@sandro.com', 'phone' => '+381606666666'],
//        ]);
//
//        $borisCompany->clients()->createMany([
//            ['name' => 'Boris Client 1', 'email' => 'client1@boris.com', 'phone' => '+381607777777'],
//            ['name' => 'Boris Client 2', 'email' => 'client2@boris.com', 'phone' => '+381608888888'],
//            ['name' => 'Boris Client 3', 'email' => 'client3@boris.com', 'phone' => '+381609999999'],
//        ]);

//        $plusiCompany->clients()->createMany([
//            ['name' => '++i Client 1', 'email' => 'client1@plusplus-i.com', 'phone' => '+381610101010'],
//            ['name' => '++i Client 2', 'email' => 'client2@plusplus-i.com', 'phone' => '+381611202020'],
//            ['name' => '++i Client 3', 'email' => 'client3@plusplus-i.com', 'phone' => '+381612303030'],
//        ]);

        // Create articles for each company (test data for leak detection)
//        Article::factory()
//            ->for($duskoCompany)
//            ->createMany([
//                [
//                    'name' => 'Dusko Article 1',
//                    'type' => ArticleTypeEnum::PRODUCTS,
//                ],
//                [
//                    'name' => 'Dusko Article 2',
//                    'type' => ArticleTypeEnum::SERVICES,
//                ],
//                [
//                    'name' => 'Dusko Article 3',
//                    'type' => ArticleTypeEnum::PRODUCTS,
//                ],
//            ]);

//        $sandroCompany->articles()->createMany([
//            ['name' => 'Sandro Article 1', 'type' => 'products'],
//            ['name' => 'Sandro Article 2', 'type' => 'services'],
//            ['name' => 'Sandro Article 3', 'type' => 'products'],
//        ]);
//
//        $borisCompany->articles()->createMany([
//            ['name' => 'Boris Article 1', 'type' => 'products'],
//            ['name' => 'Boris Article 2', 'type' => 'services'],
//            ['name' => 'Boris Article 3', 'type' => 'products'],
//        ]);
//
//        $plusiCompany->articles()->createMany([
//            ['name' => '++i Article 1', 'type' => 'products'],
//            ['name' => '++i Article 2', 'type' => 'services'],
//            ['name' => '++i Article 3', 'type' => 'products'],
//        ]);

        // Create currencies for each company (test data for leak detection)
//        $duskoCompany->currencies()->createMany([
//            ['code' => 'BAM', 'name' => 'Dusko BAM', 'symbol' => 'KM'],
//        ]);
//
//        $sandroCompany->currencies()->createMany([
//            ['code' => 'BAM', 'name' => 'Sandro BAM', 'symbol' => 'KM'],
//            ['code' => 'USD', 'name' => 'Sandro USD', 'symbol' => '$'],
//        ]);
//
//        $borisCompany->currencies()->createMany([
//            ['code' => 'BAM', 'name' => 'Boris BAM', 'symbol' => 'KM'],
//            ['code' => 'CHF', 'name' => 'Boris CHF', 'symbol' => 'CHF'],
//        ]);
//
//        $plusiCompany->currencies()->createMany([
//            ['code' => 'BAM', 'name' => '++i BAM', 'symbol' => 'KM'],
//            ['code' => 'EUR', 'name' => '++i EUR', 'symbol' => '€'],
//            ['code' => 'USD', 'name' => '++i USD', 'symbol' => '$'],
//        ]);
//
//        // Create bank accounts for each company (test data for leak detection)
//        $duskoCompany->bankAccounts()->createMany([
//            ['bank_name' => 'Dusko Bank 1', 'account_number' => 'DUSKO-0001', 'swift' => 'DUSKBA22XXX', 'is_default' => true],
//            ['bank_name' => 'Dusko Bank 2', 'account_number' => 'DUSKO-0002', 'swift' => 'DUSKBA22YYY', 'is_default' => false],
//        ]);
//
//        $sandroCompany->bankAccounts()->createMany([
//            ['bank_name' => 'Sandro Bank 1', 'account_number' => 'SANDRO-0001', 'swift' => 'SANDRO22XXX', 'is_default' => true],
//            ['bank_name' => 'Sandro Bank 2', 'account_number' => 'SANDRO-0002', 'swift' => 'SANDRO22YYY', 'is_default' => false],
//        ]);
//
//        $borisCompany->bankAccounts()->createMany([
//            ['bank_name' => 'Boris Bank 1', 'account_number' => 'BORIS-0001', 'swift' => 'BORISB22XXX', 'is_default' => true],
//            ['bank_name' => 'Boris Bank 2', 'account_number' => 'BORIS-0002', 'swift' => 'BORISB22YYY', 'is_default' => false],
//        ]);
//
//        $plusiCompany->bankAccounts()->createMany([
//            ['bank_name' => '++i Bank 1', 'account_number' => 'PLUSA-0001', 'swift' => 'PLUSIB22XXX', 'is_default' => true],
//            ['bank_name' => '++i Bank 2', 'account_number' => 'PLUSA-0002', 'swift' => 'PLUSIB22YYY', 'is_default' => false],
//        ]);

//        $seedDocumentsForCompany = function (Company $company, string $tenantTag) use ($makeItemData, $makeInvoiceItemData, $recalcTotals): void {
//            $client = $company->clients()->orderBy('id')->first();
//            $articles = $company->articles()->orderBy('id')->take(3)->get();
//            $articleIds = $articles->pluck('id')->values();
//
//            if (!$client) {
//                return;
//            }
//
//            $quoteItems = [
//                $makeItemData("{$tenantTag} Quote Item 1", $articleIds->get(0), 2, 12500, 1700),
//                $makeItemData("{$tenantTag} Quote Item 2", $articleIds->get(1), 1, 49900, 0),
//                $makeItemData("{$tenantTag} Quote Item 3", $articleIds->get(2), 3, 9900, 2100),
//            ];
//            [$quoteSubtotal, $quoteTaxTotal, $quoteTotal] = $recalcTotals($quoteItems);
//
//            $quote = Quote::query()->create([
//                'quote_number' => "{$tenantTag}-QUO-0001",
//                'company_id' => $company->id,
//                'client_id' => $client->id,
//                'status' => DocumentStatusEnum::Created,
//                'language' => LanguageEnum::English,
//                'date' => now()->toDateString(),
//                'valid_until' => now()->addDays(14)->toDateString(),
//                'notes' => null,
//                'currency' => 'BAM',
//                'quote_template' => DocumentTemplateEnum::Classic,
//                'subtotal' => $quoteSubtotal,
//                'tax_total' => $quoteTaxTotal,
//                'discount_total' => 0,
//                'total' => $quoteTotal,
//            ]);
//
//            foreach ($quoteItems as $item) {
//                QuoteItem::query()->create(array_merge($item, ['quote_id' => $quote->id]));
//            }
//
//            $contractItems = [
//                $makeItemData("{$tenantTag} Contract Item 1", $articleIds->get(0), 1, 75000, 1700),
//                $makeItemData("{$tenantTag} Contract Item 2", $articleIds->get(1), 2, 25000, 1700),
//            ];
//            [$contractSubtotal, $contractTaxTotal, $contractTotal] = $recalcTotals($contractItems);
//
//            $contract = Contract::query()->create([
//                'contract_number' => "{$tenantTag}-CON-0001",
//                'company_id' => $company->id,
//                'client_id' => $client->id,
//                'status' => DocumentStatusEnum::Created,
//                'language' => LanguageEnum::English,
//                'date' => now()->toDateString(),
//                'due_date' => now()->addDays(30)->toDateString(),
//                'notes' => null,
//                'source_type' => Quote::class,
//                'source_id' => $quote->id,
//                'currency' => 'BAM',
//                'contract_template' => DocumentTemplateEnum::Classic,
//                'file_paths' => null,
//                'subtotal' => $contractSubtotal,
//                'tax_total' => $contractTaxTotal,
//                'discount_total' => 0,
//                'total' => $contractTotal,
//            ]);
//
//            foreach ($contractItems as $item) {
//                ContractItem::query()->create(array_merge($item, ['contract_id' => $contract->id]));
//            }
//
//            $proformaItems = [
//                $makeItemData("{$tenantTag} Proforma Item 1", $articleIds->get(2), 5, 5000, 1700),
//                $makeItemData("{$tenantTag} Proforma Item 2", $articleIds->get(0), 1, 199000, 2100),
//            ];
//            [$proformaSubtotal, $proformaTaxTotal, $proformaTotal] = $recalcTotals($proformaItems);
//
//            $proforma = Proforma::query()->create([
//                'proforma_number' => "{$tenantTag}-PRO-0001",
//                'company_id' => $company->id,
//                'client_id' => $client->id,
//                'status' => DocumentStatusEnum::Created,
//                'language' => LanguageEnum::English,
//                'date' => now()->toDateString(),
//                'due_date' => now()->addDays(7)->toDateString(),
//                'notes' => null,
//                'source_type' => Quote::class,
//                'source_id' => $quote->id,
//                'currency' => 'BAM',
//                'proforma_template' => DocumentTemplateEnum::Classic,
//                'subtotal' => $proformaSubtotal,
//                'tax_total' => $proformaTaxTotal,
//                'discount_total' => 0,
//                'total' => $proformaTotal,
//            ]);
//
//            foreach ($proformaItems as $item) {
//                ProformaItem::query()->create(array_merge($item, ['proforma_id' => $proforma->id]));
//            }
//
//            $invoiceItemsFromProforma = [
//                $makeInvoiceItemData("{$tenantTag} Invoice(P) Item 1", $articleIds->get(0), 1, 30000, 1700, 'A'),
//                $makeInvoiceItemData("{$tenantTag} Invoice(P) Item 2", $articleIds->get(1), 2, 12000, 0, 'N'),
//            ];
//            [$invPSubtotal, $invPTaxTotal, $invPTotal] = $recalcTotals($invoiceItemsFromProforma);
//
//            $invoiceFromProforma = Invoice::query()->create([
//                'invoice_number' => "{$tenantTag}-INV-P-0001",
//                'company_id' => $company->id,
//                'client_id' => $client->id,
//                'status' => DocumentStatusEnum::Created,
//                'language' => LanguageEnum::English,
//                'date' => now()->toDateString(),
//                'due_date' => now()->addDays(15)->toDateString(),
//                'notes' => null,
//                'is_recurring' => false,
//                'frequency' => null,
//                'next_invoice_date' => null,
//                'parent_id' => null,
//                'source_type' => Proforma::class,
//                'source_id' => $proforma->id,
//                'currency' => 'BAM',
//                'invoice_template' => DocumentTemplateEnum::Classic,
//                'subtotal' => $invPSubtotal,
//                'tax_total' => $invPTaxTotal,
//                'discount_total' => 0,
//                'total' => $invPTotal,
//            ]);
//
//            foreach ($invoiceItemsFromProforma as $item) {
//                InvoiceItem::query()->create(array_merge($item, ['invoice_id' => $invoiceFromProforma->id]));
//            }
//
//            $invoiceItemsFromContract = [
//                $makeInvoiceItemData("{$tenantTag} Invoice(C) Item 1", $articleIds->get(2), 1, 100000, 1700, 'A'),
//            ];
//            [$invCSubtotal, $invCTaxTotal, $invCTotal] = $recalcTotals($invoiceItemsFromContract);
//
//            $invoiceFromContract = Invoice::query()->create([
//                'invoice_number' => "{$tenantTag}-INV-C-0001",
//                'company_id' => $company->id,
//                'client_id' => $client->id,
//                'status' => DocumentStatusEnum::Created,
//                'language' => LanguageEnum::English,
//                'date' => now()->toDateString(),
//                'due_date' => now()->addDays(15)->toDateString(),
//                'notes' => null,
//                'is_recurring' => false,
//                'frequency' => null,
//                'next_invoice_date' => null,
//                'parent_id' => null,
//                'source_type' => Contract::class,
//                'source_id' => $contract->id,
//                'currency' => 'BAM',
//                'invoice_template' => DocumentTemplateEnum::Classic,
//                'subtotal' => $invCSubtotal,
//                'tax_total' => $invCTaxTotal,
//                'discount_total' => 0,
//                'total' => $invCTotal,
//            ]);
//
//            foreach ($invoiceItemsFromContract as $item) {
//                InvoiceItem::query()->create(array_merge($item, ['invoice_id' => $invoiceFromContract->id]));
//            }
//        };
//
//        $seedDocumentsForCompany($duskoCompany, 'DUSKO');
//        $seedDocumentsForCompany($sandroCompany, 'SANDRO');
//        $seedDocumentsForCompany($borisCompany, 'BORIS');
//        $seedDocumentsForCompany($plusiCompany, 'PLUSI');
//
//        //seed 50 invoices for dusko
//        for ($i = 0; $i < 50; $i++) {
//            $seedDocumentsForCompany($duskoCompany, 'DUSKO');
//        }


    }
}
