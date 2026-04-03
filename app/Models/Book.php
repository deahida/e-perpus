<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'judul', 'isbn', 'penulis', 'penerbit_id', 'category_id',
        'rak_id', 'tahun_terbit', 'stok', 'stok_tersedia', 'cover',
        'deskripsi', 'bahasa', 'jumlah_halaman', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'stok' => 'integer',
        'stok_tersedia' => 'integer',
    ];

    public function penerbit()
    {
        return $this->belongsTo(Penerbit::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function rak()
    {
        return $this->belongsTo(RakBuku::class, 'rak_id');
    }

    public function peminjaman()
    {
        return $this->hasMany(Peminjaman::class, 'book_id');
    }

    public function isAvailable(): bool
    {
        return $this->stok_tersedia > 0;
    }
}
