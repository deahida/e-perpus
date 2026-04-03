<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Peminjaman;
use App\Models\User;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // If siswa, redirect to siswa dashboard
        if ($user->role === 'siswa') {
            return $this->siswaDashboard($request);
        }

        $totalBuku = Book::count();
        $bukuDipinjam = Peminjaman::where('status', 'dipinjam')->count();
        $bukuTersedia = Book::sum('stok_tersedia');
        $totalSiswa = User::where('role', 'siswa')->where('is_active', true)->count();
        $totalGuru = User::where('role', 'guru')->where('is_active', true)->count();
        $totalAdmin = User::where('role', 'admin')->where('is_active', true)->count();

        // Peminjaman terlambat
        $terlambat = Peminjaman::where('status', 'dipinjam')
            ->where('tanggal_kembali_rencana', '<', now())
            ->with(['user:id,name,role', 'book:id,judul'])
            ->limit(10)
            ->get();

        // Grafik peminjaman per bulan (12 bulan terakhir)
        $grafikPeminjaman = Peminjaman::select(
                DB::raw("DATE_FORMAT(tanggal_pinjam, '%Y-%m') as bulan"),
                DB::raw('COUNT(*) as total')
            )
            ->where('tanggal_pinjam', '>=', now()->subMonths(12))
            ->groupBy('bulan')
            ->orderBy('bulan')
            ->get();

        // Kategori terpopuler
        $kategoriPopuler = Category::withCount(['books' => function($q) {
                $q->whereHas('peminjaman');
            }])
            ->orderByDesc('books_count')
            ->limit(5)
            ->get();

        // Peminjaman terbaru
        $peminjamanTerbaru = Peminjaman::with(['user:id,name,role', 'book:id,judul'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'statistik' => [
                    'total_buku' => $totalBuku,
                    'buku_dipinjam' => $bukuDipinjam,
                    'buku_tersedia' => $bukuTersedia,
                    'total_siswa' => $totalSiswa,
                    'total_guru' => $totalGuru,
                    'total_admin' => $totalAdmin,
                ],
                'grafik_peminjaman' => $grafikPeminjaman,
                'kategori_populer' => $kategoriPopuler,
                'peminjaman_terbaru' => $peminjamanTerbaru,
                'notifikasi_terlambat' => $terlambat,
            ],
        ]);
    }

    /**
     * Student-specific dashboard
     */
    protected function siswaDashboard(Request $request)
    {
        $user = $request->user();

        // All active books sorted by popularity (most borrowed first)
        $popularBooks = Book::withCount('peminjaman')
            ->with(['category:id,nama_kategori', 'penerbit:id,nama_penerbit'])
            ->where('is_active', true)
            ->orderByDesc('peminjaman_count')
            ->get();

        // My active borrowings
        $myBorrowings = Peminjaman::with(['book:id,judul,penulis,cover,isbn'])
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        // Active borrow count
        $activeBorrowCount = Peminjaman::where('user_id', $user->id)
            ->where('status', 'dipinjam')
            ->count();

        // Latest checkpoint for this user
        $latestCheckpoint = DB::table('checkpoints')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->first();

        // Top 5 most active readers
        $topReaders = User::where('role', 'siswa')
            ->where('is_active', true)
            ->withCount('peminjaman')
            ->orderByDesc('peminjaman_count')
            ->limit(5)
            ->get(['id', 'name', 'avatar']);

        // Recommendation: books in categories the student has borrowed from
        $borrowedCategoryIds = Peminjaman::where('user_id', $user->id)
            ->join('books', 'peminjaman.book_id', '=', 'books.id')
            ->whereNotNull('books.category_id')
            ->pluck('books.category_id')
            ->unique();

        $recommendations = Book::with(['category:id,nama_kategori'])
            ->whereIn('category_id', $borrowedCategoryIds)
            ->whereDoesntHave('peminjaman', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->where('is_active', true)
            ->where('stok_tersedia', '>', 0)
            ->inRandomOrder()
            ->limit(6)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'type' => 'siswa',
                'popular_books' => $popularBooks,
                'my_borrowings' => $myBorrowings,
                'active_borrow_count' => $activeBorrowCount,
                'latest_checkpoint' => $latestCheckpoint,
                'top_readers' => $topReaders,
                'recommendations' => $recommendations,
            ],
        ]);
    }
}
