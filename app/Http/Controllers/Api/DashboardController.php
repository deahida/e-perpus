<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Peminjaman;
use App\Models\User;
use App\Models\Category;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Route to role-specific dashboard
        if ($user->role === 'siswa') {
            return $this->siswaDashboard($request);
        }

        if ($user->role === 'guru') {
            return $this->guruDashboard($request);
        }

        // Admin dashboard
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
     * Guru-specific dashboard — can see all student borrowings + their own
     */
    protected function guruDashboard(Request $request)
    {
        $user = $request->user();
        $maxPinjam = (int) Setting::getValue('max_peminjaman', 3);

        // ─── Statistics ──────────────────────────────────
        $totalPeminjamanAktif = Peminjaman::where('status', 'dipinjam')->count();
        $totalSiswa = User::where('role', 'siswa')->where('is_active', true)->count();
        $totalBuku = Book::where('is_active', true)->count();

        $terlambatCount = Peminjaman::where('status', 'dipinjam')
            ->where('tanggal_kembali_rencana', '<', now())
            ->count();

        // ─── Total active fines (all overdue borrows) ────
        $dendaPerHari = (float) Setting::getValue('denda_per_hari', 1000);
        $totalDendaAktif = Peminjaman::where('status', 'dipinjam')
            ->where('tanggal_kembali_rencana', '<', now())
            ->get()
            ->sum(function ($p) {
                return $p->denda_realtime;
            });

        // ─── Overdue notifications (all students) ────────
        $notifikasiTerlambat = Peminjaman::where('status', 'dipinjam')
            ->where('tanggal_kembali_rencana', '<', now())
            ->with(['user:id,name,role,nis', 'book:id,judul'])
            ->orderBy('tanggal_kembali_rencana')
            ->limit(10)
            ->get();

        // ─── Due today / soon (all students) ─────────────
        $jatuhTempoHariIni = Peminjaman::where('status', 'dipinjam')
            ->whereDate('tanggal_kembali_rencana', now()->toDateString())
            ->with(['user:id,name,role', 'book:id,judul'])
            ->get();

        // ─── Recent borrowings (all students) ────────────
        $peminjamanTerbaru = Peminjaman::with(['user:id,name,role,nis', 'book:id,judul'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        // ─── Student activity log ────────────────────────
        $aktivitasSiswa = Peminjaman::with(['user:id,name,role', 'book:id,judul'])
            ->orderByDesc('updated_at')
            ->limit(15)
            ->get()
            ->map(function ($p) {
                $action = $p->status === 'dikembalikan' ? 'mengembalikan' : 'meminjam';
                $p->deskripsi = "{$p->user->name} {$action} buku \"{$p->book->judul}\"";
                $p->waktu = $p->status === 'dikembalikan'
                    ? ($p->tanggal_kembali_aktual ?? $p->updated_at)
                    : $p->tanggal_pinjam;
                return $p;
            });

        // ─── Guru's own borrowings ───────────────────────
        $myBorrowings = Peminjaman::with(['book:id,judul,penulis,cover,isbn'])
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $activeBorrowCount = Peminjaman::where('user_id', $user->id)
            ->where('status', 'dipinjam')
            ->count();

        // ─── All books for browsing ──────────────────────
        $popularBooks = Book::withCount('peminjaman')
            ->with(['category:id,nama_kategori', 'penerbit:id,nama_penerbit'])
            ->where('is_active', true)
            ->orderByDesc('peminjaman_count')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'type' => 'guru',
                'statistik' => [
                    'total_peminjaman_aktif' => $totalPeminjamanAktif,
                    'total_siswa' => $totalSiswa,
                    'total_buku' => $totalBuku,
                    'terlambat' => $terlambatCount,
                    'total_denda_aktif' => $totalDendaAktif,
                ],
                'denda_per_hari' => $dendaPerHari,
                'notifikasi_terlambat' => $notifikasiTerlambat,
                'jatuh_tempo_hari_ini' => $jatuhTempoHariIni,
                'peminjaman_terbaru' => $peminjamanTerbaru,
                'aktivitas_siswa' => $aktivitasSiswa,
                'my_borrowings' => $myBorrowings,
                'active_borrow_count' => $activeBorrowCount,
                'max_peminjaman' => $maxPinjam,
                'popular_books' => $popularBooks,
            ],
        ]);
    }

    /**
     * Student-specific dashboard
     */
    protected function siswaDashboard(Request $request)
    {
        $user = $request->user();
        $maxPinjam = (int) Setting::getValue('max_peminjaman', 3);

        // All active books sorted by popularity
        $popularBooks = Book::withCount('peminjaman')
            ->with(['category:id,nama_kategori', 'penerbit:id,nama_penerbit'])
            ->where('is_active', true)
            ->orderByDesc('peminjaman_count')
            ->get();

        // My borrowings
        $myBorrowings = Peminjaman::with(['book:id,judul,penulis,cover,isbn'])
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        // Active borrow count
        $activeBorrowCount = Peminjaman::where('user_id', $user->id)
            ->where('status', 'dipinjam')
            ->count();

        // Latest checkpoint
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

        // Recommendations
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

        // ─── Total fines (real-time: persisted + active overdue) ──
        $dendaPerHari = (float) Setting::getValue('denda_per_hari', 1000);

        // Persisted unpaid fines (returned books)
        $dendaPersisted = (float) Peminjaman::where('user_id', $user->id)
            ->where('denda', '>', 0)
            ->where(function ($q) {
                $q->where('denda_dibayar', false)->orWhereNull('denda_dibayar');
            })
            ->sum('denda');

        // Active overdue fines (still borrowed)
        $dendaAktif = (float) Peminjaman::where('user_id', $user->id)
            ->where('status', 'dipinjam')
            ->where('tanggal_kembali_rencana', '<', now())
            ->get()
            ->sum(function ($p) {
                return $p->denda_realtime;
            });

        $totalDenda = $dendaPersisted + $dendaAktif;

        // ─── Notifications ──────────────────────────────
        $notifications = [];

        // Overdue books
        $overdueBooks = Peminjaman::with(['book:id,judul'])
            ->where('user_id', $user->id)
            ->where('status', 'dipinjam')
            ->where('tanggal_kembali_rencana', '<', now())
            ->get();

        foreach ($overdueBooks as $p) {
            $daysLate = now()->diffInDays($p->tanggal_kembali_rencana);
            $fineAmount = $daysLate * $dendaPerHari;
            $fineFormatted = number_format($fineAmount, 0, ',', '.');
            $notifications[] = [
                'type' => 'overdue',
                'message' => "Buku \"{$p->book->judul}\" terlambat {$daysLate} hari! Denda: Rp {$fineFormatted}",
                'severity' => 'danger',
                'date' => $p->tanggal_kembali_rencana,
                'denda' => $fineAmount,
            ];
        }

        // Due today
        $dueTodayBooks = Peminjaman::with(['book:id,judul'])
            ->where('user_id', $user->id)
            ->where('status', 'dipinjam')
            ->whereDate('tanggal_kembali_rencana', now()->toDateString())
            ->get();

        foreach ($dueTodayBooks as $p) {
            $notifications[] = [
                'type' => 'due_today',
                'message' => "Buku \"{$p->book->judul}\" harus dikembalikan hari ini!",
                'severity' => 'warning',
                'date' => $p->tanggal_kembali_rencana,
            ];
        }

        // Fines
        if ($totalDenda > 0) {
            $notifications[] = [
                'type' => 'denda',
                'message' => "Kamu memiliki denda sebesar Rp " . number_format($totalDenda, 0, ',', '.'),
                'severity' => 'danger',
                'date' => now(),
            ];
        }

        // ─── Activity log ────────────────────────────────
        $activityLog = Peminjaman::with(['book:id,judul'])
            ->where('user_id', $user->id)
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get()
            ->map(function ($p) {
                $action = $p->status === 'dikembalikan' ? 'mengembalikan' : 'meminjam';
                return [
                    'id' => $p->id,
                    'deskripsi' => "Kamu {$action} buku \"{$p->book->judul}\"",
                    'status' => $p->status,
                    'waktu' => $p->status === 'dikembalikan'
                        ? ($p->tanggal_kembali_aktual ?? $p->updated_at)
                        : $p->tanggal_pinjam,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'type' => 'siswa',
                'popular_books' => $popularBooks,
                'my_borrowings' => $myBorrowings,
                'active_borrow_count' => $activeBorrowCount,
                'max_peminjaman' => $maxPinjam,
                'latest_checkpoint' => $latestCheckpoint,
                'top_readers' => $topReaders,
                'recommendations' => $recommendations,
                'total_denda' => (float) $totalDenda,
                'denda_per_hari' => $dendaPerHari,
                'notifications' => $notifications,
                'activity_log' => $activityLog,
            ],
        ]);
    }
}
