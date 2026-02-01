<?php

use App\Http\Controllers\API\V1\AuthController;
use App\Http\Controllers\API\V1\ClientController;
use App\Http\Controllers\API\V1\UserController;
use App\Http\Controllers\API\V1\CompanyController;
use App\Http\Controllers\API\V1\ArticleController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
        // Admin only routes
        Route::middleware('admin')->group(function () {
            Route::apiResource('users', UserController::class);
            Route::apiResource('companies', CompanyController::class);
        });

        Route::middleware('company')
            ->prefix('{company:slug}')
            ->scopeBindings()
            ->group(function () {
                Route::apiResource('clients', ClientController::class);
                Route::apiResource('articles', ArticleController::class);
            });
    });
});



