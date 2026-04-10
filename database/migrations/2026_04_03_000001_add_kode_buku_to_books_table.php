<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->string('kode_buku')->nullable()->unique()->after('id');
        });

        // Auto-generate kode_buku for existing books
        $books = DB::table('books')->whereNull('kode_buku')->get();
        foreach ($books as $index => $book) {
            $kode = 'BK-' . str_pad($book->id, 6, '0', STR_PAD_LEFT);
            DB::table('books')->where('id', $book->id)->update(['kode_buku' => $kode]);
        }
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropColumn('kode_buku');
        });
    }
};
