import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
    HiOutlineBookOpen, HiOutlineChevronRight,
    HiOutlineX, HiOutlineStar, HiOutlineCalendar,
    HiOutlineClipboardList, HiOutlineCheckCircle, HiOutlineExclamation,
    HiOutlineSearch, HiOutlineUsers, HiOutlineShieldCheck,
    HiOutlineAcademicCap, HiOutlineBell, HiOutlineClock,
    HiOutlineArrowSmRight, HiOutlineChartBar, HiOutlineCash,
} from 'react-icons/hi';

export default function DashboardGuru() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedBook, setSelectedBook] = useState(null);
    const [bookDetail, setBookDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState(null);
    const [borrowing, setBorrowing] = useState(false);
    const [books, setBooks] = useState([]);
    const [booksLoading, setBooksLoading] = useState(true);
    const [myBorrowings, setMyBorrowings] = useState([]);
    const [borrowingsLoading, setBorrowingsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const fetchDashboard = useCallback(() => {
        return api.get('/dashboard')
            .then(res => setData(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    useEffect(() => {
        api.get('/books-list', { params: { per_page: 200 } })
            .then(res => {
                const d = res.data.data;
                setBooks(Array.isArray(d) ? d : (d?.data || []));
            })
            .catch(() => setBooks([]))
            .finally(() => setBooksLoading(false));
    }, []);

    useEffect(() => {
        api.get('/my-peminjaman')
            .then(res => {
                const d = res.data.data;
                setMyBorrowings(Array.isArray(d) ? d : (d?.data || []));
            })
            .catch(() => setMyBorrowings([]))
            .finally(() => setBorrowingsLoading(false));
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const openBookDetail = async (book) => {
        setSelectedBook(book);
        setLoadingDetail(true);
        try {
            const res = await api.get(`/books-list/${book.id}`);
            setBookDetail(res.data.data);
        } catch {
            setBookDetail(book);
        } finally {
            setLoadingDetail(false);
        }
    };

    const closeBookDetail = () => {
        setSelectedBook(null);
        setBookDetail(null);
    };

    const handleBorrow = async () => {
        if (!bookDetail || borrowing) return;
        setBorrowing(true);
        try {
            const res = await api.post('/borrow', { book_id: bookDetail.id });
            setToast({ type: 'success', message: res.data.message || 'Peminjaman berhasil!' });
            closeBookDetail();
            setLoading(true);
            setBooksLoading(true);
            setBorrowingsLoading(true);
            await Promise.all([
                fetchDashboard(),
                api.get('/books-list', { params: { per_page: 200 } })
                    .then(res => { const d = res.data.data; setBooks(Array.isArray(d) ? d : (d?.data || [])); })
                    .finally(() => setBooksLoading(false)),
                api.get('/my-peminjaman')
                    .then(res => { const d = res.data.data; setMyBorrowings(Array.isArray(d) ? d : (d?.data || [])); })
                    .finally(() => setBorrowingsLoading(false)),
            ]);
        } catch (err) {
            const msg = err.response?.data?.message || 'Gagal meminjam buku. Silakan coba lagi.';
            setToast({ type: 'error', message: msg });
        } finally {
            setBorrowing(false);
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner"></div> Memuat dashboard...</div>;
    if (!data) return <div className="empty-state"><h3>Gagal memuat data</h3></div>;

    const {
        statistik, notifikasi_terlambat, jatuh_tempo_hari_ini,
        peminjaman_terbaru, aktivitas_siswa,
        active_borrow_count, max_peminjaman, denda_per_hari,
    } = data;

    const today = new Date();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dateStr = `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

    const activeBorrows = myBorrowings.filter(b => b.status === 'dipinjam');
    const maxPinjam = max_peminjaman || 3;
    const progressPercent = Math.min((active_borrow_count / maxPinjam) * 100, 100);

    const filteredBooks = books.filter(book => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            book.judul?.toLowerCase().includes(q) ||
            book.penulis?.toLowerCase().includes(q) ||
            book.category?.nama_kategori?.toLowerCase().includes(q)
        );
    });

    const getCoverUrl = (cover) => {
        if (!cover) return null;
        if (cover.startsWith('http')) return cover;
        return `/storage/${cover}`;
    };

    const formatDate = (d) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (d) => {
        if (!d) return '';
        const date = new Date(d);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return 'Baru saja';
        if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
        return formatDate(d);
    };

    const terlambatList = notifikasi_terlambat || [];
    const jatuhTempoList = jatuh_tempo_hari_ini || [];
    const totalNotif = terlambatList.length + jatuhTempoList.length;

    const statCards = [
        { label: 'Peminjaman Aktif', value: statistik?.total_peminjaman_aktif || 0, icon: HiOutlineClipboardList, color: 'purple' },
        { label: 'Total Siswa', value: statistik?.total_siswa || 0, icon: HiOutlineUsers, color: 'cyan' },
        { label: 'Koleksi Buku', value: statistik?.total_buku || 0, icon: HiOutlineBookOpen, color: 'green' },
        { label: 'Terlambat', value: statistik?.terlambat || 0, icon: HiOutlineExclamation, color: 'red' },
        { label: 'Total Denda', value: statistik?.total_denda_aktif ? `Rp ${Number(statistik.total_denda_aktif).toLocaleString('id-ID')}` : 'Rp 0', icon: HiOutlineCash, color: 'orange', isText: true },
    ];

    return (
        <div className="siswa-dashboard fade-in">
            {/* ─── Toast ─────────────────────────────────── */}
            {toast && (
                <div className={`siswa-toast siswa-toast--${toast.type}`}>
                    <div className="siswa-toast-icon">
                        {toast.type === 'success' ? <HiOutlineCheckCircle /> : <HiOutlineExclamation />}
                    </div>
                    <span className="siswa-toast-msg">{toast.message}</span>
                    <button className="siswa-toast-close" onClick={() => setToast(null)}><HiOutlineX /></button>
                </div>
            )}

            {/* ─── Greeting Card ─────────────────────────── */}
            <div className="siswa-greeting siswa-greeting--guru">
                <div className="siswa-greeting-bg" />
                <div className="siswa-greeting-content">
                    <span className="siswa-greeting-badge siswa-greeting-badge--guru">
                        <HiOutlineAcademicCap /> Dashboard Guru
                    </span>
                    <h1 className="siswa-greeting-name">Halo, {user?.name?.split(' ')[0]}!</h1>
                    <p className="siswa-greeting-date">{dateStr}</p>
                </div>
                <div className="siswa-greeting-stats">
                    <div className="siswa-greeting-stat">
                        <span className="siswa-greeting-stat-num">{active_borrow_count || 0}</span>
                        <span className="siswa-greeting-stat-label">Buku Dipinjam</span>
                    </div>
                    <div className="siswa-greeting-stat">
                        <span className="siswa-greeting-stat-num">{books.length}</span>
                        <span className="siswa-greeting-stat-label">Koleksi Buku</span>
                    </div>
                </div>
            </div>

            {/* ─── Borrow Progress ──────────────────────── */}
            <div className="borrow-progress-card">
                <div className="borrow-progress-header">
                    <span className="borrow-progress-title"><HiOutlineBookOpen /> Peminjaman Pribadi</span>
                    <span className="borrow-progress-count">{active_borrow_count || 0} / {maxPinjam} buku</span>
                </div>
                <div className="borrow-progress-bar">
                    <div
                        className={`borrow-progress-fill ${progressPercent >= 100 ? 'full' : progressPercent >= 60 ? 'warning' : ''}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                {progressPercent >= 100 && (
                    <p className="borrow-progress-note">⚠️ Batas peminjaman tercapai</p>
                )}
            </div>

            {/* ─── Stat Cards ────────────────────────────── */}
            <div className="guru-stats-row">
                {statCards.map((stat, i) => (
                    <div key={i} className={`guru-stat-card guru-stat--${stat.color}`}>
                        <div className="guru-stat-icon">
                            <stat.icon />
                        </div>
                        <div className="guru-stat-content">
                            <span className="guru-stat-num">{stat.isText ? stat.value : stat.value?.toLocaleString('id-ID')}</span>
                            <span className="guru-stat-label">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── Tab Navigation ────────────────────────── */}
            <div className="guru-tab-nav">
                <button
                    className={`guru-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <HiOutlineChartBar /> Ikhtisar
                </button>
                <button
                    className={`guru-tab-btn ${activeTab === 'books' ? 'active' : ''}`}
                    onClick={() => setActiveTab('books')}
                >
                    <HiOutlineBookOpen /> Koleksi Buku
                </button>
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* ─── Notifications Panel ──────────────── */}
                    {totalNotif > 0 && (
                        <div className="notif-panel">
                            <div className="notif-panel-header">
                                <h3><HiOutlineBell /> Notifikasi <span className="notif-panel-count">{totalNotif}</span></h3>
                            </div>
                            <div className="notif-panel-list">
                                {terlambatList.map((item, i) => (
                                    <div key={`late-${i}`} className="notif-item notif-item--danger">
                                        <div className="notif-icon notif-icon--danger"><HiOutlineExclamation /></div>
                                        <div className="notif-content">
                                            <div className="notif-title">{item.user?.name}</div>
                                            <div className="notif-desc">
                                                "{item.book?.judul}" — terlambat {item.hari_terlambat} hari
                                            </div>
                                            {item.denda_realtime > 0 && (
                                                <div className="notif-fine">
                                                    💰 Denda: Rp {Number(item.denda_realtime).toLocaleString('id-ID')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {jatuhTempoList.map((item, i) => (
                                    <div key={`due-${i}`} className="notif-item notif-item--warning">
                                        <div className="notif-icon notif-icon--warning"><HiOutlineClock /></div>
                                        <div className="notif-content">
                                            <div className="notif-title">{item.user?.name}</div>
                                            <div className="notif-desc">
                                                "{item.book?.judul}" — jatuh tempo hari ini
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ─── Recent Borrowings Table ─────────── */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="card-header">
                            <h2>📋 Data Peminjaman Terbaru</h2>
                        </div>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Peminjam</th>
                                        <th>Buku</th>
                                        <th>Tanggal</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(peminjaman_terbaru || []).length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                                                Belum ada data peminjaman
                                            </td>
                                        </tr>
                                    ) : (
                                        peminjaman_terbaru.map((p, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 500 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        {p.user?.name}
                                                        <span className={`role-badge-mini role-badge-mini--${p.user?.role}`}>
                                                            {p.user?.role}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>{p.book?.judul}</td>
                                                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {formatDate(p.tanggal_pinjam || p.created_at)}
                                                </td>
                                                <td>
                                                    <span className={`badge ${p.status === 'dipinjam' ? 'badge-warning' :
                                                        p.status === 'dikembalikan' ? 'badge-success' : 'badge-danger'
                                                        }`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ─── Activity Log ─────────────────────── */}
                    <div className="activity-log-card">
                        <div className="activity-log-header">
                            <h3><HiOutlineClock /> Aktivitas Terbaru Siswa</h3>
                        </div>
                        <div className="activity-log-list">
                            {(aktivitas_siswa || []).length === 0 ? (
                                <div className="activity-log-empty">
                                    <HiOutlineClipboardList />
                                    <p>Belum ada aktivitas</p>
                                </div>
                            ) : (
                                aktivitas_siswa.slice(0, 10).map((act, i) => (
                                    <div key={i} className="activity-log-item">
                                        <div className={`activity-log-dot ${act.status === 'dikembalikan' ? 'activity-log-dot--return' : 'activity-log-dot--borrow'}`} />
                                        <div className="activity-log-content">
                                            <p className="activity-log-desc">{act.deskripsi}</p>
                                            <span className="activity-log-time">{formatTime(act.waktu)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ─── My Active Borrowings ────────────── */}
                    {activeBorrows.length > 0 && (
                        <div className="siswa-section">
                            <div className="siswa-section-header">
                                <h2><HiOutlineClipboardList /> Buku Saya yang Dipinjam</h2>
                            </div>
                            <div className="siswa-borrows-list">
                                {activeBorrows.map(borrow => (
                                    <div key={borrow.id} className="siswa-borrow-item">
                                        <div className="siswa-borrow-cover">
                                            {borrow.book?.cover ? (
                                                <img src={getCoverUrl(borrow.book.cover)} alt={borrow.book.judul} />
                                            ) : (
                                                <div className="siswa-cover-placeholder"><HiOutlineBookOpen /></div>
                                            )}
                                        </div>
                                        <div className="siswa-borrow-info">
                                            <h4>{borrow.book?.judul}</h4>
                                            <p className="siswa-borrow-author">{borrow.book?.penulis}</p>
                                            <div className="siswa-borrow-meta">
                                                <span className={`badge ${borrow.status === 'dipinjam' ? 'badge-warning' : 'badge-success'}`}>
                                                    {borrow.status}
                                                </span>
                                                <span className="siswa-borrow-date">
                                                    <HiOutlineCalendar />
                                                    Kembali: {borrow.tanggal_kembali_rencana ? new Date(borrow.tanggal_kembali_rencana).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'books' && (
                <>
                    {/* ─── Book Collection ────────────────────────── */}
                    <div className="siswa-section">
                        <div className="siswa-section-header">
                            <h2><HiOutlineStar /> Koleksi Buku Perpustakaan</h2>
                        </div>
                        <div className="siswa-search-bar">
                            <HiOutlineSearch className="siswa-search-icon" />
                            <input
                                type="text"
                                placeholder="Cari judul, penulis, atau kategori..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="siswa-search-input"
                            />
                            {searchQuery && (
                                <button className="siswa-search-clear" onClick={() => setSearchQuery('')}>
                                    <HiOutlineX />
                                </button>
                            )}
                        </div>

                        {booksLoading ? (
                            <div className="loading-spinner"><div className="spinner"></div> Memuat koleksi buku...</div>
                        ) : filteredBooks.length > 0 ? (
                            <div className="siswa-books-grid">
                                {filteredBooks.map(book => (
                                    <div key={book.id} className="siswa-book-card siswa-book-card--grid" onClick={() => openBookDetail(book)}>
                                        <div className="siswa-book-cover">
                                            {book.cover ? (
                                                <img src={getCoverUrl(book.cover)} alt={book.judul} />
                                            ) : (
                                                <div className="siswa-cover-placeholder"><HiOutlineBookOpen /></div>
                                            )}
                                            <span className={`siswa-book-stock-badge ${book.stok_tersedia > 0 ? 'in-stock' : 'out-stock'}`}>
                                                {book.stok_tersedia > 0 ? `Stok: ${book.stok_tersedia}` : 'Habis'}
                                            </span>
                                            {book.peminjaman_count > 0 && (
                                                <span className="siswa-book-badge">{book.peminjaman_count}× dipinjam</span>
                                            )}
                                        </div>
                                        <div className="siswa-book-info">
                                            <h4>{book.judul}</h4>
                                            <p>{book.penulis}</p>
                                            {book.category && <span className="siswa-book-cat">{book.category.nama_kategori}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="siswa-empty-books">
                                <HiOutlineBookOpen />
                                <p>{searchQuery ? 'Tidak ada buku yang cocok dengan pencarian.' : 'Belum ada buku di perpustakaan.'}</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ─── Book Detail Modal ──────────────────────── */}
            {selectedBook && (
                <div className="modal-overlay" onClick={closeBookDetail}>
                    <div className="siswa-book-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeBookDetail}><HiOutlineX /></button>

                        {loadingDetail ? (
                            <div className="loading-spinner"><div className="spinner"></div> Memuat...</div>
                        ) : bookDetail ? (
                            <>
                                <div className="siswa-modal-cover">
                                    {bookDetail.cover ? (
                                        <img src={getCoverUrl(bookDetail.cover)} alt={bookDetail.judul} />
                                    ) : (
                                        <div className="siswa-cover-placeholder siswa-cover-placeholder--lg"><HiOutlineBookOpen /></div>
                                    )}
                                </div>
                                <div className="siswa-modal-body">
                                    <h2>{bookDetail.judul}</h2>
                                    <p className="siswa-modal-author">{bookDetail.penulis}</p>
                                    <div className="siswa-modal-meta">
                                        {bookDetail.category && <span className="siswa-book-cat">{bookDetail.category.nama_kategori}</span>}
                                        {bookDetail.penerbit && <span className="siswa-book-cat">{bookDetail.penerbit.nama_penerbit}</span>}
                                        {bookDetail.tahun_terbit && <span className="siswa-book-cat">{bookDetail.tahun_terbit}</span>}
                                    </div>
                                    {bookDetail.deskripsi && <p className="siswa-modal-desc">{bookDetail.deskripsi}</p>}
                                    <div className="siswa-modal-details">
                                        {bookDetail.isbn && <div><strong>ISBN:</strong> {bookDetail.isbn}</div>}
                                        {bookDetail.bahasa && <div><strong>Bahasa:</strong> {bookDetail.bahasa}</div>}
                                        {bookDetail.jumlah_halaman && <div><strong>Halaman:</strong> {bookDetail.jumlah_halaman}</div>}
                                    </div>
                                    <div className="siswa-modal-availability">
                                        {bookDetail.stok_tersedia > 0 ? (
                                            <div className="siswa-available"><HiOutlineCheckCircle /><span>Tersedia ({bookDetail.stok_tersedia} buku)</span></div>
                                        ) : (
                                            <div className="siswa-unavailable"><HiOutlineExclamation /><span>Stok Habis</span></div>
                                        )}
                                    </div>
                                    <div className="siswa-modal-actions">
                                        <button
                                            className="btn btn-primary btn-lg btn-block siswa-btn-borrow"
                                            disabled={!bookDetail.stok_tersedia || bookDetail.stok_tersedia <= 0 || borrowing}
                                            onClick={handleBorrow}
                                        >
                                            {borrowing ? (
                                                <><div className="spinner spinner--sm"></div> Memproses...</>
                                            ) : (
                                                <><HiOutlineBookOpen /> {bookDetail.stok_tersedia > 0 ? 'Pinjam Buku Ini' : 'Tidak Tersedia'}</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
