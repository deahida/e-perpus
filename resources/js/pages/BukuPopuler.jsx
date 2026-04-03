import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
    HiOutlineBookOpen, HiOutlineSearch, HiOutlineX,
    HiOutlineStar, HiOutlineCheckCircle, HiOutlineExclamation,
} from 'react-icons/hi';

export default function BukuPopuler() {
    const { user } = useAuth();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [bookDetail, setBookDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [borrowing, setBorrowing] = useState(false);
    const [toast, setToast] = useState(null);

    const fetchBooks = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/books-list', {
                params: { search, category_id: categoryFilter || undefined, per_page: 200 }
            });
            setBooks(res.data.data.data || []);
        } catch {
            setBooks([]);
        } finally {
            setLoading(false);
        }
    }, [search, categoryFilter]);

    useEffect(() => { fetchBooks(); }, [fetchBooks]);

    useEffect(() => {
        api.get('/categories-list').then(res => {
            setCategories(res.data.data?.data || res.data.data || []);
        }).catch(() => { });
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const getCoverUrl = (cover) => {
        if (!cover) return null;
        if (cover.startsWith('http')) return cover;
        return `/storage/${cover}`;
    };

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
            fetchBooks();
        } catch (err) {
            const msg = err.response?.data?.message || 'Gagal meminjam buku.';
            setToast({ type: 'error', message: msg });
        } finally {
            setBorrowing(false);
        }
    };

    return (
        <div className="fade-in buku-populer-page">
            {/* Toast */}
            {toast && (
                <div className={`siswa-toast siswa-toast--${toast.type}`}>
                    <div className="siswa-toast-icon">
                        {toast.type === 'success' ? <HiOutlineCheckCircle /> : <HiOutlineExclamation />}
                    </div>
                    <span className="siswa-toast-msg">{toast.message}</span>
                    <button className="siswa-toast-close" onClick={() => setToast(null)}><HiOutlineX /></button>
                </div>
            )}

            {/* Search & Filter */}
            <div className="ps-toolbar">
                <div className="ps-search">
                    <HiOutlineSearch className="ps-search-icon" />
                    <input
                        placeholder="Cari judul, penulis, atau ISBN..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="ps-search-input"
                    />
                    {search && (
                        <button className="ps-search-clear" onClick={() => setSearch('')}><HiOutlineX /></button>
                    )}
                </div>
                <div className="ps-filters">
                    <select
                        className="ps-filter-select"
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                    >
                        <option value="">Semua Kategori</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.nama_kategori}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Book Grid */}
            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div> Memuat koleksi buku...</div>
            ) : books.length === 0 ? (
                <div className="ps-empty">
                    <div className="ps-empty-icon"><HiOutlineBookOpen /></div>
                    <h3>Tidak ada buku ditemukan</h3>
                    <p>{search || categoryFilter ? 'Coba ubah kata kunci pencarian atau filter.' : 'Belum ada buku di perpustakaan.'}</p>
                </div>
            ) : (
                <div className="siswa-books-grid">
                    {books.map(book => (
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
                            </div>
                            <div className="siswa-book-info">
                                <h4>{book.judul}</h4>
                                <p>{book.penulis}</p>
                                {book.category && <span className="siswa-book-cat">{book.category.nama_kategori}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Book Detail Modal */}
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
