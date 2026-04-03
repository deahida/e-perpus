import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
    HiOutlineBookOpen, HiOutlineChevronRight,
    HiOutlineX, HiOutlineStar, HiOutlineCalendar,
    HiOutlineClipboardList, HiOutlineCheckCircle, HiOutlineExclamation,
    HiOutlineSearch, HiOutlineUsers, HiOutlineShieldCheck,
    HiOutlineAcademicCap, HiOutlineHeart,
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

    const { statistik, notifikasi_terlambat } = data;

    const today = new Date();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dateStr = `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

    const activeBorrows = myBorrowings.filter(b => b.status === 'dipinjam');

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
                    <span className="siswa-greeting-badge">
                        <HiOutlineAcademicCap /> Dashboard Guru
                    </span>
                    <h1 className="siswa-greeting-name">Halo, {user?.name?.split(' ')[0]}!</h1>
                    <p className="siswa-greeting-date">{dateStr}</p>
                </div>
                <div className="siswa-greeting-stats">
                    <div className="siswa-greeting-stat">
                        <span className="siswa-greeting-stat-num">{activeBorrows.length}</span>
                        <span className="siswa-greeting-stat-label">Buku Dipinjam</span>
                    </div>
                    <div className="siswa-greeting-stat">
                        <span className="siswa-greeting-stat-num">{books.length}</span>
                        <span className="siswa-greeting-stat-label">Koleksi Buku</span>
                    </div>
                </div>
            </div>

            {/* ─── Active Borrowings ─────────────────────── */}
            {activeBorrows.length > 0 && (
                <div className="siswa-section">
                    <div className="siswa-section-header">
                        <h2><HiOutlineClipboardList /> Buku Sedang Dipinjam</h2>
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
