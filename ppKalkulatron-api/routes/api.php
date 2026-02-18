<?php

use App\Http\Controllers\API\V1\AuthController;
use App\Http\Controllers\API\V1\ClientController;
use App\Http\Controllers\API\V1\BankAccountController;
use App\Http\Controllers\API\V1\CompanySettingController;
use App\Http\Controllers\API\V1\CurrencyController;
use App\Http\Controllers\API\V1\UserSettingController;
use App\Http\Controllers\API\V1\UserController;
use App\Http\Controllers\API\V1\CompanyController;
use App\Http\Controllers\API\V1\ArticleController;
use App\Http\Controllers\API\V1\InvoiceController;
use App\Http\Controllers\API\V1\ProformaController;
use App\Http\Controllers\API\V1\ContractController;
use App\Http\Controllers\API\V1\QuoteController;
use App\Http\Controllers\API\V1\DocumentNumberController;
use App\Http\Controllers\API\V1\FiscalController;
use App\Http\Controllers\API\V1\MeController;
use App\Models\Company;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Test invoice templates
    ///api/v1/{company:slug}/test-invoice/classic
    ///api/v1/{company:slug}/test-invoice/modern
    ///api/v1/{company:slug}/test-invoice/minimal
    ///api/v1/{company:slug}/test-invoice/standard
    Route::get('{company:slug}/test-invoice/{template}', function (Company $company, string $template) {
        $templateEnum = \App\Models\Enums\DocumentTemplateEnum::tryFrom($template);
        if ($templateEnum === null) {
            abort(404, 'Template not found');
        }

        $invoice = $company->invoices()
            ->with(['client', 'items', 'fiscalRecords', 'currency', 'bankAccount'])
//            ->whereStatus('fiscalized')
            ->firstOrFail();

        return view($templateEnum->getViewName(), [
            'invoice' => $invoice,
            'company' => $company,
        ]);
    });

    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'throttle:90,1'])->group(function () {
        // Admin only routes
        Route::middleware('admin')->group(function () {
            Route::apiResource('users', UserController::class);
            Route::apiResource('companies', CompanyController::class);
        });

        // Current user settings
        Route::prefix('me')->group(function () {
            Route::get('settings', [UserSettingController::class, 'show']);
            Route::patch('settings', [UserSettingController::class, 'update']);
        });

        Route::middleware('company')
            ->prefix('{company:slug}')
            ->scopeBindings()
            ->group(function () {
                // Company Context Me Endpoint
                Route::get('me', [MeController::class, 'show']);

                Route::apiResource('clients', ClientController::class);
                Route::apiResource('articles', ArticleController::class);
                Route::apiResource('currencies', CurrencyController::class)->except(['destroy']);
                Route::apiResource('bank-accounts', BankAccountController::class)
                    ->parameters(['bank-accounts' => 'bankAccount'])
                    ->except(['destroy']);

                Route::get('settings', [CompanySettingController::class, 'show']);
                Route::patch('settings', [CompanySettingController::class, 'update']);

                // Document number endpoints
                Route::get('document-numbers/next', [DocumentNumberController::class, 'getNextNumber']);
                Route::post('document-numbers/reserve', [DocumentNumberController::class, 'reserveNumber']);

                // Documents
                Route::apiResource('invoices', InvoiceController::class);
                Route::get('invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf']);
                Route::post('invoices/{invoice}/send-email', [InvoiceController::class, 'sendEmail']);
                Route::post('invoices/{invoice}/create-refund', [InvoiceController::class, 'createRefund']);
                Route::post('invoices/{invoice}/fiscalize', [FiscalController::class, 'fiscalize']);
                Route::post('invoices/{invoice}/fiscalize-copy', [FiscalController::class, 'fiscalizeCopy']);
                Route::post('invoices/{invoice}/fiscalize-refund', [FiscalController::class, 'fiscalizeRefund']);
                Route::get('invoices/{invoice}/fiscal-receipt-image', [FiscalController::class, 'fiscalReceiptImage']);



                // Fiscal (OFS ESIR)
                Route::get('fiscal/test-attention', [FiscalController::class, 'testAttention']);
                Route::get('fiscal/test-settings', [FiscalController::class, 'testSettings']);
                Route::get('fiscal/test-status', [FiscalController::class, 'testStatus']);
                Route::get('fiscal/invoices/request/{requestId}', [FiscalController::class, 'getInvoiceByRequestId']);
                Route::post('proformas/{proforma}/convert-to-invoice', [ProformaController::class, 'convertToInvoice']);
                Route::post('proformas/{proforma}/create-invoice', [InvoiceController::class, 'createFromProforma']);
                Route::get('proformas/{proforma}/pdf', [ProformaController::class, 'downloadPdf']);
                Route::post('proformas/{proforma}/send-email', [ProformaController::class, 'sendEmail']);
                Route::apiResource('proformas', ProformaController::class);
                Route::post('quotes/{quote}/convert-to-proforma', [QuoteController::class, 'convertToProforma']);
                Route::post('quotes/{quote}/create-proforma', [ProformaController::class, 'createFromQuote']);
                Route::get('quotes/{quote}/pdf', [QuoteController::class, 'downloadPdf']);
                Route::post('quotes/{quote}/send-email', [QuoteController::class, 'sendEmail']);
                Route::apiResource('quotes', QuoteController::class);
                Route::post('contracts/{contract}/convert-to-invoice', [ContractController::class, 'convertToInvoice']);
                Route::post('contracts/{contract}/create-invoice', [InvoiceController::class, 'createFromContract']);
                Route::post('contracts/{contract}/upload-file', [ContractController::class, 'uploadFile']);
                Route::get('contracts/{contract}/download-file/{fileIndex}', [ContractController::class, 'downloadFile']);
                Route::delete('contracts/{contract}/delete-file/{fileIndex}', [ContractController::class, 'deleteFile']);
                Route::apiResource('contracts', ContractController::class);
            });
    });
});

