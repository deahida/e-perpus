<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'kode_buku', 'judul', 'isbn', 'penulis', 'penerbit_id', 'category_id',
        'rak_id', 'tahun_terbit', 'stok', 'stok_tersedia', 'cover',
        'deskripsi', 'bahasa', 'jumlah_halaman', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'stok' => 'integer',
        'stok_tersedia' => 'integer',
    ];

    /**
     * Generate unique kode_buku in format BK-XXXXXX
     */
    public static function generateKodeBuku(): string
    {
        $last = static::where('kode_buku', 'like', 'BK-%')
            ->orderByRaw("CAST(SUBSTRING(kode_buku, 4) AS UNSIGNED) DESC")
            ->first();

        $number = $last ? (int) substr($last->kode_buku, 3) + 1 : 1;
        return 'BK-' . str_pad($number, 6, '0', STR_PAD_LEFT);
    }

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
