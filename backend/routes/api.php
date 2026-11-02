<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PublicQuoteController;
use App\Http\Controllers\Api\QuotationActivityController;
use App\Http\Controllers\Api\QuotationController;
use App\Http\Controllers\Api\QuotationNoteController;
use App\Http\Controllers\Api\QuotationRecipientController;
use Illuminate\Support\Facades\Route;

// No login screen: staff requests act as the main user (see App\Http\Middleware\UseDefaultUser).
Route::middleware('default.user')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);

    Route::get('quotation-options', [QuotationController::class, 'options']);
    Route::get('quotations', [QuotationController::class, 'index']);
    Route::post('quotations', [QuotationController::class, 'store']);
    Route::get('quotations/{quotation}', [QuotationController::class, 'show']);
    // POST (not PUT) so drafts can be saved with file uploads.
    Route::post('quotations/{quotation}', [QuotationController::class, 'update']);
    Route::get('quotations/{quotation}/documents/download-all', [QuotationController::class, 'downloadAll']);
    Route::get('quotations/{quotation}/documents/{document}', [QuotationController::class, 'downloadDocument']);

    Route::patch('quotations/{quotation}/recipients/{recipient}', [QuotationRecipientController::class, 'updateStatus']);
    Route::post('quotations/{quotation}/recipients/{recipient}/remind', [QuotationRecipientController::class, 'remind']);
    Route::get('quotations/{quotation}/recipients/{recipient}/quote', [QuotationRecipientController::class, 'downloadQuote']);

    Route::get('quotations/{quotation}/notes', [QuotationNoteController::class, 'index']);
    Route::post('quotations/{quotation}/notes', [QuotationNoteController::class, 'store']);
    Route::put('quotations/{quotation}/notes/{note}', [QuotationNoteController::class, 'update']);
    Route::delete('quotations/{quotation}/notes/{note}', [QuotationNoteController::class, 'destroy']);
    Route::get('quotations/{quotation}/note-attachments/{attachment}', [QuotationNoteController::class, 'download']);

    Route::get('quotations/{quotation}/activities', [QuotationActivityController::class, 'index']);
});

// Contractors upload their quote here from the emailed link, without logging in.
Route::middleware('throttle:30,1')->group(function () {
    Route::get('public/quotes/{token}', [PublicQuoteController::class, 'show']);
    Route::post('public/quotes/{token}', [PublicQuoteController::class, 'submit']);
});
