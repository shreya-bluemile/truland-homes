<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContractorCategoryController;
use App\Http\Controllers\Api\ContractorController;
use App\Http\Controllers\Api\EmailTemplateController;
use App\Http\Controllers\Api\LookupController;
use App\Http\Controllers\Api\LotController;
use App\Http\Controllers\Api\PublicQuotationController;
use App\Http\Controllers\Api\QuotationActivityController;
use App\Http\Controllers\Api\QuotationController;
use App\Http\Controllers\Api\QuotationDocumentController;
use App\Http\Controllers\Api\QuotationNoteController;
use App\Http\Controllers\Api\QuotationRecipientController;
use Illuminate\Support\Facades\Route;

// Contractor upload page (no login; the token in the emailed link identifies the contractor).
Route::prefix('public/quotations/{token}')->middleware('throttle:30,1')->group(function () {
    Route::get('/', [PublicQuotationController::class, 'show']);
    Route::post('submit', [PublicQuotationController::class, 'submit'])->middleware('throttle:10,1');
});

// No login screen: staff requests act as the main user (see App\Http\Middleware\UseDefaultUser).
Route::middleware('default.user')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);

    Route::get('lookups', [LookupController::class, 'index']);
    Route::get('lookups/categories/{category}', [LookupController::class, 'category']);

    // Contractor Quotations
    Route::apiResource('quotations', QuotationController::class);
    Route::scopeBindings()->prefix('quotations/{quotation}')->group(function () {
        Route::get('documents/download-all', [QuotationDocumentController::class, 'downloadAll']);
        Route::get('documents/{document}/download', [QuotationDocumentController::class, 'download']);

        Route::patch('recipients/{recipient}', [QuotationRecipientController::class, 'updateStatus']);
        Route::post('recipients/{recipient}/remind', [QuotationRecipientController::class, 'remind'])->middleware('throttle:20,1');
        Route::get('recipients/{recipient}/submission', [QuotationRecipientController::class, 'downloadSubmission']);

        Route::get('notes', [QuotationNoteController::class, 'index']);
        Route::post('notes', [QuotationNoteController::class, 'store']);
        Route::put('notes/{note}', [QuotationNoteController::class, 'update']);
        Route::delete('notes/{note}', [QuotationNoteController::class, 'destroy']);
        Route::get('notes/{note}/attachments/{attachment}/download', [QuotationNoteController::class, 'downloadAttachment']);

        Route::get('activities', [QuotationActivityController::class, 'index']);
    });

    // Contractors and settings
    Route::apiResource('contractors', ContractorController::class)->except('show');
    Route::apiResource('lots', LotController::class)->except('show');
    Route::apiResource('contractor-categories', ContractorCategoryController::class)
        ->parameters(['contractor-categories' => 'category'])->except('show');
    Route::scopeBindings()->prefix('contractor-categories/{category}/templates')->group(function () {
        Route::post('/', [ContractorCategoryController::class, 'storeTemplates']);
        Route::delete('{template}', [ContractorCategoryController::class, 'destroyTemplate']);
        Route::get('{template}/download', [ContractorCategoryController::class, 'downloadTemplate']);
    });
    Route::apiResource('email-templates', EmailTemplateController::class)->only(['index', 'store', 'update']);
});
