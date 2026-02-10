<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\FiscalRecordTypeEnum;
use App\Models\FiscalRecord;
use App\Models\Invoice;
use App\Services\OFSService;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

#[Group('Fiscal', weight: 10)]
class FiscalController extends Controller
{
    /**
     * Test OFS API availability (GET /api/attention)
     */
    #[Endpoint(operationId: 'testFiscalAttention', title: 'Test fiscal API', description: 'Test OFS ESIR API connectivity')]
    public function testAttention(Company $company): JsonResponse
    {
        try {
            $ofs = new OFSService($company);
            $response = $ofs->testAttention();

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'API dostupan - OFS ESIR je pravilno konfigurisan.',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'API nije dostupan',
                'status' => $response->status(),
                'body' => $response->body(),
            ], 502);
        } catch (\Exception $e) {
            Log::error('Fiscal test attention failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Greška: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Test OFS settings (GET /api/settings)
     */
    #[Endpoint(operationId: 'testFiscalSettings', title: 'Test fiscal settings', description: 'Fetch and verify OFS device settings')]
    public function testSettings(Company $company): JsonResponse
    {
        try {
            $ofs = new OFSService($company);
            $response = $ofs->getSettings();

            if ($response->successful()) {
                $data = $response->json();

                return response()->json([
                    'success' => true,
                    'message' => 'Settings uspješno učitani',
                    'data' => [
                        'printer_name' => $data['printerName'] ?? null,
                        'lpfr_url' => $data['lpfrUrl'] ?? null,
                    ],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Greška pri učitavanju settings-a',
                'status' => $response->status(),
                'body' => $response->body(),
            ], 502);
        } catch (\Exception $e) {
            Log::error('Fiscal test settings failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Greška: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Fiskalizuj i štampaj račun (Sale)
     */
    #[Endpoint(operationId: 'fiscalizeInvoice', title: 'Fiscalize invoice', description: 'Create and print fiscal invoice')]
    public function fiscalize(Company $company, Invoice $invoice): JsonResponse
    {
        abort_if($invoice->company_id !== $company->id, 404);

        if (
            $invoice->status === \App\Models\Enums\DocumentStatusEnum::Fiscalized
            || $invoice->status === \App\Models\Enums\DocumentStatusEnum::Refunded
            || $invoice->status === \App\Models\Enums\DocumentStatusEnum::RefundCreated
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Račun nije moguće fiskalizovati.',
            ], 422);
        }

        try {
            $invoice->load(['items.article', 'client']);
            $ofs = new OFSService($company);

            $items = $this->buildInvoiceItems($invoice);
            // payment mora biti = sum(items) prema Postman dokumentaciji
            $paymentAmount = (float) array_sum(array_column($items, 'totalAmount'));

            $payload = $this->buildInvoicePayload($company, $invoice, $items, $paymentAmount, 'Sale', 'Normal');

            $requestId = 'inv-'.$invoice->id.'-'.Str::random(8);

            Log::info('Fiscalizing invoice', [
                'invoice_id' => $invoice->id,
                'request_id' => $requestId,
                'payment_amount_bam' => $paymentAmount,
            ]);

            $response = $ofs->createInvoice($payload, $requestId);

            if ($response->successful()) {
                $data = $response->json();

                $fiscalCounter = $data['invoiceCounter'] ?? null;
                if ($fiscalCounter !== null) {
                    $fiscalCounter = (string) $fiscalCounter;
                }

                $receiptImagePath = null;
                $base64Image = $data['invoiceImagePngBase64'] ?? null;
                if ($base64Image) {
                    $receiptImagePath = $this->saveFiscalReceiptImage(
                        $company,
                        $invoice,
                        $base64Image,
                        'original'
                    );
                }

                FiscalRecord::create([
                    'invoice_id' => $invoice->id,
                    'type' => FiscalRecordTypeEnum::Original,
                    'fiscal_invoice_number' => $data['invoiceNumber'] ?? null,
                    'fiscal_counter' => $fiscalCounter,
                    'request_id' => $requestId,
                    'verification_url' => $data['verificationUrl'] ?? null,
                    'fiscalized_at' => now(),
                    'fiscal_receipt_image_path' => $receiptImagePath,
                ]);

                $invoice->update(['status' => DocumentStatusEnum::Fiscalized]);

                return response()->json([
                    'success' => true,
                    'message' => 'Račun uspješno fiskalizovan',
                    'data' => [
                        'fiscal_invoice_number' => $data['invoiceNumber'] ?? null,
                        'fiscal_counter' => $data['invoiceCounter'] ?? null,
                        'verification_url' => $data['verificationUrl'] ?? null,
                        'request_id' => $requestId,
                    ],
                ]);
            }

            Log::error('Fiscalization failed', [
                'invoice_id' => $invoice->id,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Greška prilikom fiskalizacije',
                'status' => $response->status(),
                'body' => $response->body(),
            ], 502);
        } catch (\Exception $e) {
            Log::error('Exception during fiscalization', [
                'invoice_id' => $invoice->id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Greška: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Štampaj kopiju fiskalnog računa (Copy)
     */
    #[Endpoint(operationId: 'fiscalizeCopy', title: 'Print fiscal copy', description: 'Print copy of fiscal invoice')]
    public function fiscalizeCopy(Company $company, Invoice $invoice): JsonResponse
    {
        abort_if($invoice->company_id !== $company->id, 404);

        $originalRecord = $invoice->originalFiscalRecord();
        if (! $originalRecord?->fiscal_invoice_number) {
            return response()->json([
                'success' => false,
                'message' => 'Račun mora biti fiskalizovan prije štampe kopije.',
            ], 422);
        }

        try {
            $invoice->load(['items.article', 'client']);
            $ofs = new OFSService($company);

            $items = $this->buildInvoiceItems($invoice);
            $paymentAmount = (float) array_sum(array_column($items, 'totalAmount'));

            $referentDT = $originalRecord->fiscalized_at?->format('c');

            $payload = $this->buildInvoicePayload(
                $company,
                $invoice,
                $items,
                $paymentAmount,
                'Sale',
                'Copy',
                $originalRecord->fiscal_invoice_number,
                $referentDT
            );

            $requestId = 'copy-'.$invoice->id.'-'.Str::random(8);

            Log::info('Fiscalizing copy', ['invoice_id' => $invoice->id, 'request_id' => $requestId, 'referent' => $originalRecord->fiscal_invoice_number]);

            $response = $ofs->createInvoice($payload, $requestId);

            logger('Fiscal copy response:', $response->json());

            if ($response->successful()) {
                $data = $response->json();

                $receiptImagePath = null;
                $base64Image = $data['invoiceImagePngBase64'] ?? null;
                if ($base64Image) {
                    $receiptImagePath = $this->saveFiscalReceiptImage(
                        $company,
                        $invoice,
                        $base64Image,
                        'copy'
                    );
                }

                FiscalRecord::create([
                    'invoice_id' => $invoice->id,
                    'type' => FiscalRecordTypeEnum::Copy,
                    'fiscal_invoice_number' => $data['invoiceNumber'] ?? null,
                    'fiscal_counter' => $data['invoiceCounter'] ?? null,
                    'request_id' => $requestId,
                    'verification_url' => $data['verificationUrl'] ?? null,
                    'fiscalized_at' => now(),
                    'fiscal_receipt_image_path' => $receiptImagePath,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Kopija uspješno odštampana',
                    'data' => [
                        'fiscal_invoice_number' => $data['invoiceNumber'] ?? null,
                        'request_id' => $requestId,
                    ],
                ]);
            }

            Log::error('Fiscal copy failed', [
                'invoice_id' => $invoice->id,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Greška prilikom štampe kopije',
                'status' => $response->status(),
                'body' => $response->body(),
            ], 502);
        } catch (\Exception $e) {
            Log::error('Exception during fiscal copy', [
                'invoice_id' => $invoice->id,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Greška: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Storniraj (Refund) fiskalni račun
     */
    #[Endpoint(operationId: 'fiscalizeRefund', title: 'Fiscalize refund', description: 'Create refund/storno fiscal invoice')]
    public function fiscalizeRefund(Company $company, Invoice $invoice): JsonResponse
    {
        abort_if($invoice->company_id !== $company->id, 404);

        if ($invoice->status !== DocumentStatusEnum::RefundCreated) {
            return response()->json([
                'success' => false,
                'message' => 'Storno faktura mora biti kreirana prije refundacije.',
            ], 422);
        }

        $originalInvoice = $invoice->originalInvoice()->with('fiscalRecords')->first();
        if (! $originalInvoice) {
            return response()->json([
                'success' => false,
                'message' => 'Originalni račun nije pronađen.',
            ], 422);
        }

        $originalRecord = $originalInvoice->originalFiscalRecord();
        if (! $originalRecord?->fiscal_invoice_number) {
            return response()->json([
                'success' => false,
                'message' => 'Originalni račun mora biti fiskalizovan prije refundacije.',
            ], 422);
        }

        try {
            $invoice->load(['items.article', 'client']);
            $ofs = new OFSService($company);

            // OFS API: refund ima isti sadržaj kao original (pozitivni iznosi), transactionType: Refund + referent polja
            $items = $this->buildInvoiceItems($invoice);
            $paymentAmount = (float) array_sum(array_column($items, 'totalAmount'));

            $referentDT = $originalRecord->fiscalized_at?->format('c');

            $payload = $this->buildInvoicePayload(
                $company,
                $invoice,
                $items,
                $paymentAmount,
                'Refund',
                'Normal',
                $originalRecord->fiscal_invoice_number,
                $referentDT
            );

            $requestId = 'refund-'.$invoice->id.'-'.Str::random(8);

            Log::info('Fiscalizing refund', ['invoice_id' => $invoice->id, 'request_id' => $requestId, 'referent' => $originalRecord->fiscal_invoice_number]);

            $response = $ofs->createInvoice($payload, $requestId);

            if ($response->successful()) {
                $data = $response->json();

                $receiptImagePath = null;
                $base64Image = $data['invoiceImagePngBase64'] ?? null;
                if ($base64Image) {
                    $receiptImagePath = $this->saveFiscalReceiptImage(
                        $company,
                        $invoice,
                        $base64Image,
                        'refund'
                    );
                }

                FiscalRecord::create([
                    'invoice_id' => $invoice->id,
                    'type' => FiscalRecordTypeEnum::Refund,
                    'fiscal_invoice_number' => $data['invoiceNumber'] ?? null,
                    'fiscal_counter' => $data['invoiceCounter'] ?? null,
                    'request_id' => $requestId,
                    'verification_url' => $data['verificationUrl'] ?? null,
                    'fiscalized_at' => now(),
                    'fiscal_receipt_image_path' => $receiptImagePath,
                ]);

                $invoice->update(['status' => DocumentStatusEnum::Refunded]);

                return response()->json([
                    'success' => true,
                    'message' => 'Refundacija uspješno izvršena',
                    'data' => [
                        'fiscal_invoice_number' => $data['invoiceNumber'] ?? null,
                        'fiscal_counter' => $data['invoiceCounter'] ?? null,
                        'verification_url' => $data['verificationUrl'] ?? null,
                        'request_id' => $requestId,
                    ],
                ]);
            }

            Log::error('Fiscal refund failed', [
                'invoice_id' => $invoice->id,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Greška prilikom storniranja',
                'status' => $response->status(),
                'body' => $response->body(),
            ], 502);
        } catch (\Exception $e) {
            Log::error('Exception during fiscal refund', [
                'invoice_id' => $invoice->id,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Greška: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Build OFS API invoice items from Invoice model.
     * Koristi se za Original (Sale), Copy i Refund - svi šalju iste iznose (sa porezom).
     * Za Refund: isti sadržaj kao original (pozitivni iznosi), transactionType: Refund označava refundaciju.
     *
     * Prema dokumentaciji: unitPrice, totalAmount i payment su iznosi SA porezom (inkluzivno).
     * OFS izračunava osnovicu i porez iz labels.
     */
    protected function buildInvoiceItems(Invoice $invoice): array
    {
        $items = [];

        foreach ($invoice->items as $item) {
            $taxLabel = $item->tax_label ?? $item->article?->tax_rate ?? 'A';
            $quantity = (float) $item->quantity;
            $unit = $item->article?->unit ?? 'kom';
            $name = $item->name . ' / ' . $unit;

            // unit_price i total su SA porezom (inclusive) - ono što kupac plaća
            $unitPrice = (float) (abs($item->unit_price) / 100);
            $totalAmount = (float) (abs($item->total) / 100);

            $items[] = [
                'name' => $name,
                'quantity' => $quantity,
                'unitPrice' => $unitPrice,
                'totalAmount' => $totalAmount,
                'labels' => [$taxLabel],
            ];
        }

        return $items;
    }

    /**
     * Build full OFS createInvoice payload with company receipt settings
     */
    protected function buildInvoicePayload(
        Company $company,
        Invoice $invoice,
        array $items,
        float $totalAmount,
        string $transactionType,
        string $invoiceType,
        ?string $referentDocumentNumber = null,
        ?string $referentDocumentDT = null
    ): array {
        $headerLines = CompanySetting::get('ofs_receipt_header_text_lines', [], $company->id);
        $renderImage = CompanySetting::get('ofs_render_receipt_image', true, $company->id);
        $imageFormat = CompanySetting::get('ofs_receipt_image_format', 'Png', $company->id);
        $layout = CompanySetting::get('ofs_receipt_layout', 'Slip', $company->id);
        $paymentType = $invoice->payment_type?->value ?? CompanySetting::get('ofs_default_payment_type', 'Cash', $company->id);

        $payload = [
            'renderReceiptImage' => $renderImage,
            'receiptImageFormat' => $imageFormat,
            'receiptLayout' => $layout,
            'receiptHeaderTextLines' => $headerLines,
            'invoiceRequest' => [
                'invoiceType' => $invoiceType,
                'transactionType' => $transactionType,
                'payment' => [
                    ['amount' => $totalAmount, 'paymentType' => $paymentType],
                ],
                'items' => $items,
                'cashier' => auth()->user()?->name ?? 'System',
            ],
        ];

        if ($referentDocumentNumber) {
            $payload['invoiceRequest']['referentDocumentNumber'] = $referentDocumentNumber;
        }
        if ($referentDocumentDT) {
            $payload['invoiceRequest']['referentDocumentDT'] = $referentDocumentDT;
        }

        // buyerId: samo kada račun ima klijenta (račun sa podacima o kupcu)
        $client = $invoice->client;
        if ($client && $client->tax_id) {
            $payload['invoiceRequest']['buyerId'] = ($client->country ?? 'BIH') === 'BIH'
                ? $client->tax_id
                : 'VP:9999999999999';
        }

        return $payload;
    }

    /**
     * Spremi sliku fiskalnog računa u folder: company-slug/mjesec/broj-fakture-(type).png
     */
    protected function saveFiscalReceiptImage(Company $company, Invoice $invoice, string $base64, string $type = 'original'): string
    {
        $month = now()->format('Y-m');
        $safeNumber = preg_replace('/[^a-zA-Z0-9\-_]/', '-', $invoice->invoice_number);
        $relativePath = $company->slug.'/'.$month.'/'.$safeNumber.'-'.$type.'.png';

        $binary = base64_decode($base64, true);
        if ($binary === false) {
            throw new \InvalidArgumentException('Invalid base64 image data');
        }

        Storage::disk('fiscal_receipts')->put($relativePath, $binary);

        return $relativePath;
    }

    /**
     * Vrati sliku fiskalnog računa (original, copy ili refund)
     */
    #[Endpoint(operationId: 'getFiscalReceiptImage', title: 'Get fiscal receipt image', description: 'Stream fiscal receipt image file')]
    public function fiscalReceiptImage(Company $company, Invoice $invoice): mixed
    {
        abort_if($invoice->company_id !== $company->id, 404);

        $fiscalRecordId = request()->query('fiscal_record_id') ? (int) request()->query('fiscal_record_id') : null;

        $invoice->load('fiscalRecords');

        $record = $fiscalRecordId
            ? $invoice->fiscalRecords->firstWhere('id', $fiscalRecordId)
            : $invoice->originalFiscalRecord();

        if (! $record) {
            return response()->json(['message' => 'Zapis nije pronađen'], 404);
        }

        $imagePath = $record->fiscal_receipt_image_path;

        if (! $imagePath) {
            return response()->json(['message' => 'Slika nije dostupna'], 404);
        }

        $path = Storage::disk('fiscal_receipts')->path($imagePath);

        if (! file_exists($path)) {
            return response()->json(['message' => 'Datoteka nije pronađena'], 404);
        }

        return response()->file($path, ['Content-Type' => 'image/png']);
    }

    /**
     * Pregled sadržaja računa po broju zahteva (RequestId).
     * Koristi se kada je zahtev za fiskalizaciju poslat ali odgovor nije stigao (mrežni problemi).
     * Vraća kompletan sadržaj računa ako je fiskalizacija uspela, ili prazan odgovor ako nije.
     * Napomena: OFS čuva poslednjih 100 zahteva.
     */
    #[Endpoint(operationId: 'getFiscalInvoiceByRequestId', title: 'Get fiscal invoice by request ID', description: 'Check if fiscalization succeeded when response was lost')]
    public function getInvoiceByRequestId(Company $company, string $requestId): JsonResponse
    {
        try {
            $ofs = new OFSService($company);
            $response = $ofs->getInvoiceByRequestId($requestId);

            if ($response->successful()) {
                $data = $response->json();

                return response()->json([
                    'success' => true,
                    'message' => empty($data) ? 'Zahtev nije pronađen ili fiskalizacija nije uspela.' : 'Sadržaj računa pronađen.',
                    'data' => $data,
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Greška pri dohvatu podataka',
                'status' => $response->status(),
                'body' => $response->body(),
            ], 502);
        } catch (\Exception $e) {
            Log::error('Fiscal getInvoiceByRequestId failed', [
                'request_id' => $requestId,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Greška: '.$e->getMessage(),
            ], 500);
        }
    }
}
