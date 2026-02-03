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
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
        // Admin only routes
        Route::middleware('admin')->group(function () {
            Route::apiResource('users', UserController::class);
            Route::apiResource('companies', CompanyController::class);
        });

        Route::prefix('me')->group(function () {
            Route::get('settings', [UserSettingController::class, 'show']);
            Route::patch('settings', [UserSettingController::class, 'update']);
        });

        Route::middleware('company')
            ->prefix('{company:slug}')
            ->scopeBindings()
            ->group(function () {
                Route::apiResource('clients', ClientController::class);
                Route::apiResource('articles', ArticleController::class);
                Route::apiResource('currencies', CurrencyController::class);
                Route::apiResource('bank-accounts', BankAccountController::class)
                    ->parameters(['bank-accounts' => 'bankAccount']);

                Route::get('settings', [CompanySettingController::class, 'show']);
                Route::patch('settings', [CompanySettingController::class, 'update']);

                // Document number endpoints
                Route::get('document-numbers/next', [DocumentNumberController::class, 'getNextNumber']);
                Route::post('document-numbers/reserve', [DocumentNumberController::class, 'reserveNumber']);

                // Documents
                Route::apiResource('invoices', InvoiceController::class);
                Route::post('proformas/{proforma}/convert-to-invoice', [ProformaController::class, 'convertToInvoice']);
                Route::post('proformas/{proforma}/create-invoice', [InvoiceController::class, 'createFromProforma']);
                Route::apiResource('proformas', ProformaController::class);
                Route::post('quotes/{quote}/convert-to-proforma', [QuoteController::class, 'convertToProforma']);
                Route::post('quotes/{quote}/create-proforma', [ProformaController::class, 'createFromQuote']);
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



