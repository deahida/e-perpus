<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Peminjaman;
use App\Models\Setting;
use Illuminate\Http\Request;

class ScanController extends Controller
{
    /**
     * Scan buku — cari berdasarkan kode_buku atau isbn
     */
    public function scanBuku(Request $request)
    {
        $request->validate([
            'kode' => 'required|string',
        ]);

        $kode = trim($request->kode);

        $book = Book::with(['penerbit', 'category', 'rak'])
            ->where('kode_buku', $kode)
            ->orWhere('isbn', $kode)
            ->first();

        if (!$book) {
            return response()->json([
                'success' => false,
                'message' => "Buku dengan kode \"{$kode}\" tidak ditemukan.",
            ], 404);
        }

        // Check if book has active borrows
        $activeBorrow = Peminjaman::where('book_id', $book->id)
            ->where('status', 'dipinjam')
            ->with('user:id,name,role,nis,nip')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $book->id,
                'kode_buku' => $book->kode_buku,
                'judul' => $book->judul,
                'isbn' => $book->isbn,
                'penulis' => $book->penulis,
                'penerbit' => $book->penerbit,
                'category' => $book->category,
                'rak' => $book->rak,
                'tahun_terbit' => $book->tahun_terbit,
                'stok' => $book->stok,
                'stok_tersedia' => $book->stok_tersedia,
                'cover' => $book->cover,
                'deskripsi' => $book->deskripsi,
                'bahasa' => $book->bahasa,
                'jumlah_halaman' => $book->jumlah_halaman,
                'is_active' => $book->is_active,
                'is_available' => $book->stok_tersedia > 0,
                'cover_url' => $book->cover ? '/storage/' . $book->cover : null,
                'active_borrow' => $activeBorrow ? [
                    'id' => $activeBorrow->id,
                    'user' => $activeBorrow->user,
                    'tanggal_pinjam' => $activeBorrow->tanggal_pinjam,
                    'tanggal_kembali_rencana' => $activeBorrow->tanggal_kembali_rencana,
                ] : null,
            ],
        ]);
    }

    /**
     * Scan pengembalian — cari peminjaman aktif berdasarkan kode buku
     */
    public function scanPeminjaman(Request $request)
    {
        $request->validate([
            'kode' => 'required|string',
        ]);

        $kode = trim($request->kode);

        $book = Book::where('kode_buku', $kode)
            ->orWhere('isbn', $kode)
            ->first();

        if (!$book) {
            return response()->json([
                'success' => false,
                'message' => "Buku dengan kode \"{$kode}\" tidak ditemukan.",
            ], 404);
        }

        // Cari peminjaman aktif
        $peminjaman = Peminjaman::where('book_id', $book->id)
            ->where('status', 'dipinjam')
            ->with(['user:id,name,role,nis,nip,kelas_id', 'user.kelas', 'book:id,judul,kode_buku,isbn,cover'])
            ->orderBy('created_at', 'desc')
            ->get();

        if ($peminjaman->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => "Tidak ada peminjaman aktif untuk buku \"{$book->judul}\".",
                'data' => [
                    'book' => [
                        'id' => $book->id,
                        'judul' => $book->judul,
                        'kode_buku' => $book->kode_buku,
                        'cover_url' => $book->cover ? '/storage/' . $book->cover : null,
                    ],
                ],
            ], 404);
        }

        // Hitung keterlambatan & denda untuk setiap peminjaman
        $dendaPerHari = (float) Setting::getValue('denda_per_hari', 1000);
        $result = $peminjaman->map(function ($p) use ($dendaPerHari) {
            $now = now();
            $terlambat = $now->greaterThan($p->tanggal_kembali_rencana);
            $hariTerlambat = $terlambat
                ? $now->diffInDays($p->tanggal_kembali_rencana)
                : 0;
            $denda = $hariTerlambat * $dendaPerHari;

            return [
                'peminjaman' => $p,
                'keterlambatan' => [
                    'terlambat' => $terlambat,
                    'hari' => $hariTerlambat,
                    'denda' => $denda,
                    'denda_formatted' => 'Rp ' . number_format($denda, 0, ',', '.'),
                    'denda_per_hari' => $dendaPerHari,
                    'denda_per_hari_formatted' => 'Rp ' . number_format($dendaPerHari, 0, ',', '.'),
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }
}
