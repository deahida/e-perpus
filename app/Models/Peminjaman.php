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

    protected $appends = ['denda_realtime', 'hari_terlambat'];

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

    /**
     * Calculate fine in real-time based on current state.
     */
    public function calculateFine(): float
    {
        $dendaPerHari = (float) Setting::getValue('denda_per_hari', 1000);

        // Already returned — use stored denda or recalculate from return date
        if ($this->status === 'dikembalikan') {
            if ($this->denda > 0) {
                return (float) $this->denda;
            }
            if ($this->tanggal_kembali_aktual && $this->tanggal_kembali_aktual->greaterThan($this->tanggal_kembali_rencana)) {
                return $this->tanggal_kembali_aktual->diffInDays($this->tanggal_kembali_rencana) * $dendaPerHari;
            }
            return 0;
        }

        // Still borrowed and overdue — calculate from today
        if ($this->status === 'dipinjam' && now()->greaterThan($this->tanggal_kembali_rencana)) {
            return now()->diffInDays($this->tanggal_kembali_rencana) * $dendaPerHari;
        }

        return 0;
    }

    /**
     * Accessor: real-time fine amount (auto-appended to JSON).
     */
    public function getDendaRealtimeAttribute(): float
    {
        return $this->calculateFine();
    }

    /**
     * Accessor: days overdue (auto-appended to JSON).
     */
    public function getHariTerlambatAttribute(): int
    {
        if ($this->status === 'dikembalikan' && $this->tanggal_kembali_aktual) {
            if ($this->tanggal_kembali_aktual->greaterThan($this->tanggal_kembali_rencana)) {
                return (int) $this->tanggal_kembali_aktual->diffInDays($this->tanggal_kembali_rencana);
            }
            return 0;
        }

        if ($this->status === 'dipinjam' && now()->greaterThan($this->tanggal_kembali_rencana)) {
            return (int) now()->diffInDays($this->tanggal_kembali_rencana);
        }

        return 0;
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
