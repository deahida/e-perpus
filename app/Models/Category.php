<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_kategori', 'kode_kategori', 'deskripsi', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function books()
    {
        return $this->hasMany(Book::class, 'category_id');
    }

    public function rakBuku()
    {
        return $this->hasMany(RakBuku::class, 'category_id');
    }
}
