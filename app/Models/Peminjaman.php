<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Peminjaman extends Model
{
    use HasFactory;

    protected $table = 'peminjaman';

    protected $fillable = [
        'kode_peminjaman', 'user_id', 'book_id', 'tanggal_pinjam',
        'tanggal_kembali_rencana', 'tanggal_kembali_aktual', 'status',
        'denda', 'denda_dibayar', 'catatan', 'approved_by',
    ];

    protected $casts = [
        'tanggal_pinjam' => 'date',
        'tanggal_kembali_rencana' => 'date',
        'tanggal_kembali_aktual' => 'date',
        'denda' => 'decimal:2',
        'denda_dibayar' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function checkpoints()
    {
        return $this->hasMany(Checkpoint::class, 'peminjaman_id');
    }

    public function isOverdue(): bool
    {
        return $this->status === 'dipinjam'
            && now()->greaterThan($this->tanggal_kembali_rencana);
    }

    public static function generateKode(): string
    {
        $prefix = 'PNJ-' . date('Ymd');
        $last = static::where('kode_peminjaman', 'like', $prefix . '%')
            ->orderBy('id', 'desc')->first();
        $number = $last ? (int) substr($last->kode_peminjaman, -4) + 1 : 1;
        return $prefix . '-' . str_pad($number, 4, '0', STR_PAD_LEFT);
    }
}
