import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
    HiOutlineBookOpen, HiOutlineChevronRight,
    HiOutlineX, HiOutlineStar, HiOutlineCalendar,
    HiOutlineClipboardList, HiOutlineCheckCircle, HiOutlineExclamation,
    HiOutlineHeart, HiOutlineSearch, HiOutlineBell, HiOutlineClock,
    HiOutlineCash, HiOutlineArrowSmRight,
} from 'react-icons/hi';

export default function DashboardSiswa() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedBook, setSelectedBook] = useState(null);
    const [bookDetail, setBookDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [borrowing, setBorrowing] = useState(false);
    const [toast, setToast] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchDashboard = useCallback(() => {
        return api.get('/dashboard')
            .then(res => setData(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    // Auto-dismiss toast
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
            // Refresh dashboard data
            setLoading(true);
            await fetchDashboard();
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
        popular_books, my_borrowings, active_borrow_count, latest_checkpoint,
        top_readers, recommendations, max_peminjaman, total_denda,
        notifications, activity_log, denda_per_hari,
    } = data;

    const today = new Date();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dateStr = `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

    const activeBorrows = my_borrowings?.filter(b => b.status === 'dipinjam') || [];
    const maxPinjam = max_peminjaman || 3;
    const progressPercent = Math.min(((active_borrow_count || 0) / maxPinjam) * 100, 100);

    // Filter books based on search query
    const filteredBooks = (popular_books || []).filter(book => {
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

    // Calculate days remaining for each active borrow
    const getDaysRemaining = (dateStr) => {
        if (!dateStr) return null;
        const dueDate = new Date(dateStr);
        const now = new Date();
        const diff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <div className="siswa-dashboard fade-in">
            {/* ─── Toast Notification ─────────────────────── */}
            {toast && (
                <div className={`siswa-toast siswa-toast--${toast.type}`}>
                    <div className="siswa-toast-icon">
                        {toast.type === 'success' ? <HiOutlineCheckCircle /> : <HiOutlineExclamation />}
                    </div>
                    <span className="siswa-toast-msg">{toast.message}</span>
                    <button className="siswa-toast-close" onClick={() => setToast(null)}>
                        <HiOutlineX />
                    </button>
                </div>
            )}

            {/* ─── Greeting Card ─────────────────────────── */}
            <div className="siswa-greeting siswa-greeting--siswa">
                <div className="siswa-greeting-bg" />
                <div className="siswa-greeting-content">
                    <span className="siswa-greeting-badge siswa-greeting-badge--siswa">
                        <HiOutlineBookOpen /> Dashboard Siswa
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
                        <span className="siswa-greeting-stat-num">{popular_books?.length || 0}</span>
                        <span className="siswa-greeting-stat-label">Koleksi Buku</span>
                    </div>
                </div>
            </div>

            {/* ─── Borrow Progress ──────────────────────── */}
            <div className="borrow-progress-card">
                <div className="borrow-progress-header">
                    <span className="borrow-progress-title"><HiOutlineBookOpen /> Progress Peminjaman</span>
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

            {/* ─── Denda & Notifications ──────────────────── */}
            {((total_denda > 0) || (notifications && notifications.length > 0)) && (
                <div className="siswa-alerts-row">
                    {/* Denda Card */}
                    {total_denda > 0 && (
                        <div className="denda-card">
                            <div className="denda-icon"><HiOutlineCash /></div>
                            <div className="denda-content">
                                <div className="denda-label">Total Denda Belum Dibayar</div>
                                <div className="denda-amount">Rp {total_denda?.toLocaleString('id-ID')}</div>
                            </div>
                        </div>
                    )}

                    {/* Notification Cards */}
                    {notifications && notifications.length > 0 && (
                        <div className="notif-panel notif-panel--compact">
                            <div className="notif-panel-header">
                                <h3><HiOutlineBell /> Notifikasi <span className="notif-panel-count">{notifications.length}</span></h3>
                            </div>
                            <div className="notif-panel-list">
                                {notifications.map((n, i) => (
                                    <div key={i} className={`notif-item notif-item--${n.severity}`}>
                                        <div className={`notif-icon notif-icon--${n.severity}`}>
                                            {n.type === 'denda' ? <HiOutlineCash /> :
                                             n.type === 'due_today' ? <HiOutlineClock /> :
                                             <HiOutlineExclamation />}
                                        </div>
                                        <div className="notif-content">
                                            <div className="notif-desc">{n.message}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Active Borrowings with Countdown ──────── */}
            {activeBorrows.length > 0 && (
                <div className="siswa-section">
                    <div className="siswa-section-header">
                        <h2><HiOutlineClipboardList /> Buku Sedang Dipinjam</h2>
                    </div>
                    <div className="siswa-borrows-list">
                        {activeBorrows.map(borrow => {
                            const daysLeft = getDaysRemaining(borrow.tanggal_kembali_rencana);
                            const isOverdue = daysLeft !== null && daysLeft < 0;
                            const isDueToday = daysLeft === 0;
                            const isDueSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 2;

                            return (
                                <div key={borrow.id} className={`siswa-borrow-item ${isOverdue ? 'siswa-borrow-item--overdue' : ''}`}>
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
                                            <span className={`badge ${isOverdue ? 'badge-danger' : isDueToday ? 'badge-warning' : 'badge-info'}`}>
                                                {isOverdue ? `Terlambat ${Math.abs(daysLeft)} hari` :
                                                 isDueToday ? 'Jatuh tempo hari ini' :
                                                 `${daysLeft} hari lagi`}
                                            </span>
                                            <span className="siswa-borrow-date">
                                                <HiOutlineCalendar />
                                                Kembali: {borrow.tanggal_kembali_rencana ? new Date(borrow.tanggal_kembali_rencana).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}
                                            </span>
                                        </div>
                                    </div>
                                    {isOverdue && (
                                        <div className="siswa-borrow-overdue-badge">
                                            <HiOutlineExclamation />
                                        </div>
                                    )}
                                    {isOverdue && borrow.denda_realtime > 0 && (
                                        <div className="fine-inline-badge">
                                            <HiOutlineCash />
                                            <span>Denda: Rp {Number(borrow.denda_realtime).toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ─── Activity Log ───────────────────────────── */}
            {activity_log && activity_log.length > 0 && (
                <div className="activity-log-card">
                    <div className="activity-log-header">
                        <h3><HiOutlineClock /> Riwayat Aktivitas</h3>
                    </div>
                    <div className="activity-log-list">
                        {activity_log.map((act, i) => (
                            <div key={i} className="activity-log-item">
                                <div className={`activity-log-dot ${act.status === 'dikembalikan' ? 'activity-log-dot--return' : 'activity-log-dot--borrow'}`} />
                                <div className="activity-log-content">
                                    <p className="activity-log-desc">{act.deskripsi}</p>
                                    <span className="activity-log-time">{formatTime(act.waktu)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── All Books (from Database) ───────────────── */}
            <div className="siswa-section">
                <div className="siswa-section-header">
                    <h2><HiOutlineStar /> Koleksi Buku Perpustakaan</h2>
                </div>
                {/* Search */}
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

                {filteredBooks.length > 0 ? (
                    <div className="siswa-books-grid">
                        {filteredBooks.map(book => (
                            <div key={book.id} className="siswa-book-card siswa-book-card--grid" onClick={() => openBookDetail(book)}>
                                <div className="siswa-book-cover">
                                    {book.cover ? (
                                        <img src={getCoverUrl(book.cover)} alt={book.judul} />
                                    ) : (
                                        <div className="siswa-cover-placeholder"><HiOutlineBookOpen /></div>
                                    )}
                                    {/* Stock badge */}
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

            {/* ─── Recommendations ────────────────────────── */}
            {recommendations && recommendations.length > 0 && (
                <div className="siswa-section">
                    <div className="siswa-section-header">
                        <h2><HiOutlineHeart /> Rekomendasi Untukmu</h2>
                    </div>
                    <div className="siswa-books-grid">
                        {recommendations.map(book => (
                            <div key={book.id} className="siswa-book-card siswa-book-card--grid" onClick={() => openBookDetail(book)}>
                                <div className="siswa-book-cover">
                                    {book.cover ? (
                                        <img src={getCoverUrl(book.cover)} alt={book.judul} />
                                    ) : (
                                        <div className="siswa-cover-placeholder"><HiOutlineBookOpen /></div>
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
                </div>
            )}

            {/* ─── Top Readers ────────────────────────────── */}
            {top_readers && top_readers.length > 0 && (
                <div className="siswa-section">
                    <div className="siswa-section-header">
                        <h2>🏆 Top Pembaca Teraktif</h2>
                    </div>
                    <div className="siswa-readers-list">
                        {top_readers.map((reader, idx) => (
                            <div key={reader.id} className={`siswa-reader-item ${reader.id === user?.id ? 'siswa-reader-item--me' : ''}`}>
                                <span className={`siswa-reader-rank rank-${idx + 1}`}>{idx + 1}</span>
                                <div className="siswa-reader-avatar">
                                    {reader.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="siswa-reader-info">
                                    <h4>{reader.name} {reader.id === user?.id && <span className="siswa-reader-me">(Kamu)</span>}</h4>
                                    <p>{reader.peminjaman_count} buku dipinjam</p>
                                </div>
                                {idx === 0 && <span className="siswa-reader-crown">👑</span>}
                            </div>
                        ))}
                    </div>
                </div>
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
                                        {bookDetail.category && (
                                            <span className="siswa-book-cat">{bookDetail.category.nama_kategori}</span>
                                        )}
                                        {bookDetail.penerbit && (
                                            <span className="siswa-book-cat">{bookDetail.penerbit.nama_penerbit}</span>
                                        )}
                                        {bookDetail.tahun_terbit && (
                                            <span className="siswa-book-cat">{bookDetail.tahun_terbit}</span>
                                        )}
                                    </div>

                                    {bookDetail.deskripsi && (
                                        <p className="siswa-modal-desc">{bookDetail.deskripsi}</p>
                                    )}

                                    <div className="siswa-modal-details">
                                        {bookDetail.isbn && <div><strong>ISBN:</strong> {bookDetail.isbn}</div>}
                                        {bookDetail.bahasa && <div><strong>Bahasa:</strong> {bookDetail.bahasa}</div>}
                                        {bookDetail.jumlah_halaman && <div><strong>Halaman:</strong> {bookDetail.jumlah_halaman}</div>}
                                    </div>

                                    <div className="siswa-modal-availability">
                                        {bookDetail.stok_tersedia > 0 ? (
                                            <div className="siswa-available">
                                                <HiOutlineCheckCircle />
                                                <span>Tersedia ({bookDetail.stok_tersedia} buku)</span>
                                            </div>
                                        ) : (
                                            <div className="siswa-unavailable">
                                                <HiOutlineExclamation />
                                                <span>Stok Habis</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="siswa-modal-actions">
                                        <button
                                            className="btn btn-primary btn-lg btn-block siswa-btn-borrow"
                                            disabled={!bookDetail.stok_tersedia || bookDetail.stok_tersedia <= 0 || borrowing}
                                            onClick={handleBorrow}
                                        >
                                            {borrowing ? (
                                                <>
                                                    <div className="spinner spinner--sm"></div>
                                                    Memproses...
                                                </>
                                            ) : (
                                                <>
                                                    <HiOutlineBookOpen />
                                                    {bookDetail.stok_tersedia > 0 ? 'Pinjam Buku Ini' : 'Tidak Tersedia'}
                                                </>
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
