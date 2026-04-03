<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Category;
use App\Models\Kelas;
use App\Models\Peminjaman;
use App\Models\Penerbit;
use App\Models\RakBuku;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Settings ────────────────────────────────────
        $settings = [
            ['key' => 'nama_sekolah', 'value' => 'SMA Negeri 1 Indonesia', 'type' => 'text', 'group' => 'general'],
            ['key' => 'alamat_sekolah', 'value' => 'Jl. Pendidikan No. 1, Jakarta', 'type' => 'text', 'group' => 'general'],
            ['key' => 'telepon_sekolah', 'value' => '(021) 1234567', 'type' => 'text', 'group' => 'general'],
            ['key' => 'logo_sekolah', 'value' => null, 'type' => 'image', 'group' => 'general'],
            ['key' => 'max_peminjaman', 'value' => '3', 'type' => 'number', 'group' => 'peminjaman'],
            ['key' => 'lama_peminjaman', 'value' => '7', 'type' => 'number', 'group' => 'peminjaman'],
            ['key' => 'denda_per_hari', 'value' => '1000', 'type' => 'number', 'group' => 'peminjaman'],
            ['key' => 'max_perpanjangan', 'value' => '1', 'type' => 'number', 'group' => 'peminjaman'],
        ];

        foreach ($settings as $s) {
            Setting::create($s);
        }

        // ─── Kelas ──────────────────────────────────────
        $kelasData = [];
        foreach (['X', 'XI', 'XII'] as $tingkat) {
            foreach (['IPA 1', 'IPA 2', 'IPS 1', 'IPS 2'] as $jurusan) {
                $kelasData[] = Kelas::create([
                    'nama_kelas' => "{$tingkat} {$jurusan}",
                    'tingkat' => $tingkat,
                    'jurusan' => str_contains($jurusan, 'IPA') ? 'IPA' : 'IPS',
                ]);
            }
        }

        // ─── Users ──────────────────────────────────────
        // Admin
        User::create([
            'name' => 'Administrator',
            'email' => 'admin@perpustakaan.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        // Guru
        $guruNames = ['Budi Santoso', 'Siti Rahayu', 'Ahmad Fauzi', 'Dewi Lestari', 'Eko Prasetyo'];
        foreach ($guruNames as $i => $name) {
            User::create([
                'name' => $name,
                'email' => 'guru' . ($i + 1) . '@perpustakaan.com',
                'password' => Hash::make('password'),
                'role' => 'guru',
                'nip' => '19800' . str_pad($i + 1, 3, '0', STR_PAD_LEFT) . '200501100' . ($i + 1),
                'is_active' => true,
            ]);
        }

        // Siswa
        $siswaNames = [
            'Andi Pratama', 'Bella Safitri', 'Cahya Wulandari', 'Dimas Aditya',
            'Eva Nur Aisyah', 'Fajar Setiawan', 'Gita Permatasari', 'Hadi Kurniawan',
            'Indah Putri', 'Joko Susilo', 'Kartika Sari', 'Lukman Hakim',
            'Maya Anggraeni', 'Nanda Saputra', 'Okta Rahmawati', 'Putra Wijaya',
            'Qori Amalia', 'Rizki Maulana', 'Sari Dewi', 'Taufik Hidayat',
        ];

        foreach ($siswaNames as $i => $name) {
            User::create([
                'name' => $name,
                'email' => 'siswa' . ($i + 1) . '@perpustakaan.com',
                'password' => Hash::make('password'),
                'role' => 'siswa',
                'nis' => '2024' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                'kelas_id' => $kelasData[$i % count($kelasData)]->id,
                'is_active' => true,
            ]);
        }

        // ─── Categories ─────────────────────────────────
        $categories = [
            ['nama_kategori' => 'Fiksi', 'kode_kategori' => 'FIK', 'deskripsi' => 'Novel, cerpen, dan karya fiksi lainnya'],
            ['nama_kategori' => 'Non-Fiksi', 'kode_kategori' => 'NFK', 'deskripsi' => 'Buku pengetahuan umum'],
            ['nama_kategori' => 'Sains', 'kode_kategori' => 'SNS', 'deskripsi' => 'Fisika, Kimia, Biologi'],
            ['nama_kategori' => 'Matematika', 'kode_kategori' => 'MTK', 'deskripsi' => 'Buku pelajaran matematika'],
            ['nama_kategori' => 'Bahasa', 'kode_kategori' => 'BHS', 'deskripsi' => 'Bahasa Indonesia, Inggris, dll'],
            ['nama_kategori' => 'Sejarah', 'kode_kategori' => 'SJR', 'deskripsi' => 'Buku sejarah dan IPS'],
            ['nama_kategori' => 'Agama', 'kode_kategori' => 'AGM', 'deskripsi' => 'Buku pendidikan agama'],
            ['nama_kategori' => 'Teknologi', 'kode_kategori' => 'TEK', 'deskripsi' => 'Komputer dan teknologi informasi'],
            ['nama_kategori' => 'Ensiklopedia', 'kode_kategori' => 'ENS', 'deskripsi' => 'Buku referensi dan ensiklopedia'],
            ['nama_kategori' => 'Biografi', 'kode_kategori' => 'BIO', 'deskripsi' => 'Biografi tokoh terkenal'],
        ];

        $categoryModels = [];
        foreach ($categories as $cat) {
            $categoryModels[] = Category::create($cat);
        }

        // ─── Penerbit ───────────────────────────────────
        $penerbitData = [
            ['nama_penerbit' => 'Erlangga', 'alamat' => 'Jakarta', 'telepon' => '021-8711414'],
            ['nama_penerbit' => 'Gramedia Pustaka Utama', 'alamat' => 'Jakarta', 'telepon' => '021-53677100'],
            ['nama_penerbit' => 'Yudhistira', 'alamat' => 'Jakarta', 'telepon' => '021-8490660'],
            ['nama_penerbit' => 'Tiga Serangkai', 'alamat' => 'Solo', 'telepon' => '0271-714344'],
            ['nama_penerbit' => 'Intan Pariwara', 'alamat' => 'Klaten', 'telepon' => '0272-322441'],
            ['nama_penerbit' => 'Mizan', 'alamat' => 'Bandung', 'telepon' => '022-7834310'],
        ];

        $penerbitModels = [];
        foreach ($penerbitData as $p) {
            $penerbitModels[] = Penerbit::create($p);
        }

        // ─── Rak Buku ───────────────────────────────────
        $rakData = [];
        $rakLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        foreach ($rakLabels as $i => $label) {
            $rakData[] = RakBuku::create([
                'kode_rak' => 'R-' . $label,
                'nama_rak' => 'Rak ' . $label,
                'lokasi' => 'Lantai ' . ($i < 5 ? '1' : '2'),
                'category_id' => $categoryModels[$i]->id ?? null,
            ]);
        }

        // ─── Books ──────────────────────────────────────
        $booksData = [
            ['judul' => 'Laskar Pelangi', 'penulis' => 'Andrea Hirata', 'isbn' => '978-979-1227-01-4', 'cat' => 0, 'pub' => 1, 'stok' => 5, 'tahun' => 2005],
            ['judul' => 'Bumi Manusia', 'penulis' => 'Pramoedya Ananta Toer', 'isbn' => '978-979-3062-24-1', 'cat' => 0, 'pub' => 1, 'stok' => 3, 'tahun' => 1980],
            ['judul' => 'Filosofi Teras', 'penulis' => 'Henry Manampiring', 'isbn' => '978-602-291-555-6', 'cat' => 1, 'pub' => 5, 'stok' => 4, 'tahun' => 2018],
            ['judul' => 'Fisika SMA Kelas X', 'penulis' => 'Marthen Kanginan', 'isbn' => '978-979-015-500-1', 'cat' => 2, 'pub' => 0, 'stok' => 10, 'tahun' => 2020],
            ['judul' => 'Kimia SMA Kelas XI', 'penulis' => 'Unggul Sudarmo', 'isbn' => '978-979-015-501-8', 'cat' => 2, 'pub' => 0, 'stok' => 8, 'tahun' => 2020],
            ['judul' => 'Biologi SMA Kelas XII', 'penulis' => 'Irnaningtyas', 'isbn' => '978-979-015-502-5', 'cat' => 2, 'pub' => 0, 'stok' => 7, 'tahun' => 2020],
            ['judul' => 'Matematika SMA Kelas X', 'penulis' => 'Sukino', 'isbn' => '978-979-015-503-2', 'cat' => 3, 'pub' => 0, 'stok' => 12, 'tahun' => 2020],
            ['judul' => 'Bahasa Indonesia Kelas XI', 'penulis' => 'Tim Kemendikbud', 'isbn' => '978-602-282-870-6', 'cat' => 4, 'pub' => 2, 'stok' => 15, 'tahun' => 2021],
            ['judul' => 'English in Focus', 'penulis' => 'Artono Wardiman', 'isbn' => '978-979-068-711-3', 'cat' => 4, 'pub' => 3, 'stok' => 10, 'tahun' => 2019],
            ['judul' => 'Sejarah Indonesia Kelas X', 'penulis' => 'Restu Gunawan', 'isbn' => '978-602-282-871-3', 'cat' => 5, 'pub' => 2, 'stok' => 9, 'tahun' => 2021],
            ['judul' => 'Pendidikan Agama Islam', 'penulis' => 'Syamsuri', 'isbn' => '978-979-015-504-9', 'cat' => 6, 'pub' => 0, 'stok' => 6, 'tahun' => 2020],
            ['judul' => 'Pemrograman Web dengan PHP', 'penulis' => 'Budi Raharjo', 'isbn' => '978-602-048-999-1', 'cat' => 7, 'pub' => 1, 'stok' => 5, 'tahun' => 2019],
            ['judul' => 'Dasar-Dasar Pemrograman', 'penulis' => 'Abdul Kadir', 'isbn' => '978-979-29-4510-3', 'cat' => 7, 'pub' => 1, 'stok' => 4, 'tahun' => 2018],
            ['judul' => 'Ensiklopedia Sains', 'penulis' => 'Tim Penyusun', 'isbn' => '978-979-22-4510-1', 'cat' => 8, 'pub' => 1, 'stok' => 2, 'tahun' => 2015],
            ['judul' => 'Biografi B.J. Habibie', 'penulis' => 'Aditjondro', 'isbn' => '978-979-22-4510-2', 'cat' => 9, 'pub' => 5, 'stok' => 3, 'tahun' => 2010],
            ['judul' => 'Negeri 5 Menara', 'penulis' => 'Ahmad Fuadi', 'isbn' => '978-979-1227-31-1', 'cat' => 0, 'pub' => 1, 'stok' => 4, 'tahun' => 2009],
            ['judul' => 'Ayat-Ayat Cinta', 'penulis' => 'Habiburrahman El Shirazy', 'isbn' => '978-979-1227-32-8', 'cat' => 0, 'pub' => 5, 'stok' => 3, 'tahun' => 2004],
            ['judul' => 'Sapiens: Riwayat Singkat Umat Manusia', 'penulis' => 'Yuval Noah Harari', 'isbn' => '978-602-291-123-7', 'cat' => 1, 'pub' => 1, 'stok' => 5, 'tahun' => 2017],
            ['judul' => 'Atomic Habits', 'penulis' => 'James Clear', 'isbn' => '978-602-291-321-7', 'cat' => 1, 'pub' => 1, 'stok' => 6, 'tahun' => 2019],
            ['judul' => 'Seni Berpikir Jernih', 'penulis' => 'Rolf Dobelli', 'isbn' => '978-602-291-654-3', 'cat' => 1, 'pub' => 1, 'stok' => 3, 'tahun' => 2020],
        ];

        $bookModels = [];
        foreach ($booksData as $b) {
            $bookModels[] = Book::create([
                'judul' => $b['judul'],
                'penulis' => $b['penulis'],
                'isbn' => $b['isbn'],
                'category_id' => $categoryModels[$b['cat']]->id,
                'penerbit_id' => $penerbitModels[$b['pub']]->id,
                'rak_id' => $rakData[$b['cat']]->id,
                'tahun_terbit' => $b['tahun'],
                'stok' => $b['stok'],
                'stok_tersedia' => $b['stok'],
                'bahasa' => 'Indonesia',
                'deskripsi' => 'Buku ' . $b['judul'] . ' oleh ' . $b['penulis'],
            ]);
        }

        // ─── Peminjaman Sample ──────────────────────────
        $siswaUsers = User::where('role', 'siswa')->get();
        $adminUser = User::where('role', 'admin')->first();

        for ($i = 0; $i < 15; $i++) {
            $user = $siswaUsers[$i % count($siswaUsers)];
            $book = $bookModels[$i % count($bookModels)];
            $tanggalPinjam = now()->subDays(rand(1, 60));
            $status = ['dipinjam', 'dikembalikan', 'dikembalikan'][$i % 3];

            $peminjaman = Peminjaman::create([
                'kode_peminjaman' => 'PNJ-' . $tanggalPinjam->format('Ymd') . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                'user_id' => $user->id,
                'book_id' => $book->id,
                'tanggal_pinjam' => $tanggalPinjam,
                'tanggal_kembali_rencana' => $tanggalPinjam->copy()->addDays(7),
                'tanggal_kembali_aktual' => $status === 'dikembalikan' ? $tanggalPinjam->copy()->addDays(rand(3, 10)) : null,
                'status' => $status,
                'approved_by' => $adminUser->id,
            ]);

            if ($status === 'dipinjam') {
                $book->decrement('stok_tersedia');
            }
        }
    }
}
