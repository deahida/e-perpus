<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Semua route web diarahkan ke view 'app' yang memuat React SPA.
| React Router akan menangani semua routing di sisi client.
| API routes didefinisikan di routes/api.php.
|
*/

// Catch-all route: semua request diarahkan ke React SPA
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
