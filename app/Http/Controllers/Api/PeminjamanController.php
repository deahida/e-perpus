<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Checkpoint;
use App\Models\Peminjaman;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PeminjamanController extends Controller
{
    public function index(Request $request)
    {
        $query = Peminjaman::with(['user:id,name,role,nis,nip', 'book:id,judul,isbn', 'approver:id,name']);

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('kode_peminjaman', 'like', "%{$request->search}%")
                  ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$request->search}%"))
                  ->orWhereHas('book', fn($b) => $b->where('judul', 'like', "%{$request->search}%"));
            });
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Siswa & Guru hanya bisa lihat peminjamannya sendiri
        $user = $request->user();
        if ($user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }

        $peminjaman = $query->orderByDesc('created_at')->paginate($request->per_page ?? 15);

        return response()->json(['success' => true, 'data' => $peminjaman]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'book_id' => 'required|exists:books,id',
            'tanggal_pinjam' => 'required|date',
            'tanggal_kembali_rencana' => 'required|date|after:tanggal_pinjam',
            'catatan' => 'nullable|string',
        ]);

        $book = Book::findOrFail($request->book_id);

        if ($book->stok_tersedia <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Stok buku tidak tersedia.',
            ], 422);
        }

        // Cek batas peminjaman
        $maxPinjam = (int) Setting::getValue('max_peminjaman', 3);
        $activeBorrows = Peminjaman::where('user_id', $request->user_id)
            ->where('status', 'dipinjam')->count();

        if ($activeBorrows >= $maxPinjam) {
            return response()->json([
                'success' => false,
                'message' => "Sudah mencapai batas maksimal peminjaman ({$maxPinjam} buku).",
            ], 422);
        }

        DB::beginTransaction();
        try {
            $peminjaman = Peminjaman::create([
                'kode_peminjaman' => Peminjaman::generateKode(),
                'user_id' => $request->user_id,
                'book_id' => $request->book_id,
                'tanggal_pinjam' => $request->tanggal_pinjam,
                'tanggal_kembali_rencana' => $request->tanggal_kembali_rencana,
                'status' => 'dipinjam',
                'catatan' => $request->catatan,
                'approved_by' => $request->user()->id,
            ]);

            $book->decrement('stok_tersedia');

            // Buat checkpoint keluar
            Checkpoint::create([
                'peminjaman_id' => $peminjaman->id,
                'user_id' => $request->user_id,
                'book_id' => $request->book_id,
                'tipe' => 'keluar',
                'keterangan' => 'Buku dipinjam',
                'verified_by' => $request->user()->id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Peminjaman berhasil dicatat.',
                'data' => $peminjaman->load(['user', 'book']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mencatat peminjaman: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Self-borrow — siswa borrows a book for themselves
     */
    public function selfBorrow(Request $request)
    {
        $request->validate([
            'book_id' => 'required|exists:books,id',
        ]);

        $user = $request->user();
        $book = Book::findOrFail($request->book_id);

        if (!$book->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Buku ini tidak aktif.',
            ], 422);
        }

        if ($book->stok_tersedia <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Stok buku tidak tersedia.',
            ], 422);
        }

        // Check if already borrowing the same book
        $alreadyBorrowing = Peminjaman::where('user_id', $user->id)
            ->where('book_id', $book->id)
            ->where('status', 'dipinjam')
            ->exists();

        if ($alreadyBorrowing) {
            return response()->json([
                'success' => false,
                'message' => 'Kamu sudah meminjam buku ini.',
            ], 422);
        }

        // Check borrow limit
        $maxPinjam = (int) Setting::getValue('max_peminjaman', 3);
        $activeBorrows = Peminjaman::where('user_id', $user->id)
            ->where('status', 'dipinjam')->count();

        if ($activeBorrows >= $maxPinjam) {
            return response()->json([
                'success' => false,
                'message' => "Sudah mencapai batas maksimal peminjaman ({$maxPinjam} buku).",
            ], 422);
        }

        $lamaPinjam = (int) Setting::getValue('lama_peminjaman', 7);

        DB::beginTransaction();
        try {
            $peminjaman = Peminjaman::create([
                'kode_peminjaman' => Peminjaman::generateKode(),
                'user_id' => $user->id,
                'book_id' => $book->id,
                'tanggal_pinjam' => now()->toDateString(),
                'tanggal_kembali_rencana' => now()->addDays($lamaPinjam)->toDateString(),
                'status' => 'dipinjam',
                'catatan' => 'Peminjaman mandiri oleh siswa',
            ]);

            $book->decrement('stok_tersedia');

            Checkpoint::create([
                'peminjaman_id' => $peminjaman->id,
                'user_id' => $user->id,
                'book_id' => $book->id,
                'tipe' => 'keluar',
                'keterangan' => 'Buku dipinjam (mandiri)',
                'verified_by' => $user->id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Peminjaman berhasil! Buku harus dikembalikan sebelum ' . now()->addDays($lamaPinjam)->format('d M Y') . '.',
                'data' => $peminjaman->load(['user', 'book']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses peminjaman: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(Peminjaman $peminjaman)
    {
        return response()->json([
            'success' => true,
            'data' => $peminjaman->load(['user.kelas', 'book.category', 'approver', 'checkpoints']),
        ]);
    }

    public function returnBook(Request $request, Peminjaman $peminjaman)
    {
        if ($peminjaman->status === 'dikembalikan') {
            return response()->json([
                'success' => false,
                'message' => 'Buku sudah dikembalikan.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            $tanggalKembali = now();
            $denda = 0;

            if ($tanggalKembali->greaterThan($peminjaman->tanggal_kembali_rencana)) {
                $hariTerlambat = $tanggalKembali->diffInDays($peminjaman->tanggal_kembali_rencana);
                $dendaPerHari = (float) Setting::getValue('denda_per_hari', 1000);
                $denda = $hariTerlambat * $dendaPerHari;
            }

            $peminjaman->update([
                'tanggal_kembali_aktual' => $tanggalKembali,
                'status' => 'dikembalikan',
                'denda' => $denda,
            ]);

            $peminjaman->book->increment('stok_tersedia');

            // Buat checkpoint masuk
            Checkpoint::create([
                'peminjaman_id' => $peminjaman->id,
                'user_id' => $peminjaman->user_id,
                'book_id' => $peminjaman->book_id,
                'tipe' => 'masuk',
                'keterangan' => $denda > 0
                    ? "Buku dikembalikan terlambat. Denda: Rp " . number_format($denda, 0, ',', '.')
                    : 'Buku dikembalikan tepat waktu',
                'verified_by' => $request->user()->id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Buku berhasil dikembalikan.' . ($denda > 0 ? " Denda: Rp " . number_format($denda, 0, ',', '.') : ''),
                'data' => $peminjaman->fresh()->load(['user', 'book']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengembalikan buku: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Peminjaman $peminjaman)
    {
        if ($peminjaman->status === 'dipinjam') {
            $peminjaman->book->increment('stok_tersedia');
        }

        $peminjaman->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data peminjaman berhasil dihapus.',
        ]);
    }
}
