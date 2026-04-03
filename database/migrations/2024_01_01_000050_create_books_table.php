<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->string('judul');
            $table->string('isbn')->nullable()->unique();
            $table->string('penulis');
            $table->foreignId('penerbit_id')->nullable()->constrained('penerbit')->onDelete('set null');
            $table->foreignId('category_id')->nullable()->constrained('categories')->onDelete('set null');
            $table->foreignId('rak_id')->nullable()->constrained('rak_buku')->onDelete('set null');
            $table->year('tahun_terbit')->nullable();
            $table->integer('stok')->default(0);
            $table->integer('stok_tersedia')->default(0);
            $table->string('cover')->nullable();
            $table->text('deskripsi')->nullable();
            $table->string('bahasa')->default('Indonesia');
            $table->integer('jumlah_halaman')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
