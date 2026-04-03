import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineEye } from 'react-icons/hi';

export default function Books() {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const fetchBooks = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/books', { params: { search, page, per_page: 10 } });
            setBooks(res.data.data.data);
            setMeta(res.data.data);
        } catch { toast.error('Gagal memuat data buku'); }
        finally { setLoading(false); }
    }, [search, page]);

    useEffect(() => { fetchBooks(); }, [fetchBooks]);

    const handleDelete = async (id) => {
        if (!confirm('Yakin hapus buku ini?')) return;
        try {
            await api.delete(`/books/${id}`);
            toast.success('Buku berhasil dihapus');
            fetchBooks();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menghapus');
        }
    };

    return (
        <div className="fade-in">
            <div className="toolbar">
                <div className="toolbar-search">
                    <HiOutlineSearch className="search-icon" />
                    <input placeholder="Cari judul, penulis, ISBN..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <div className="toolbar-actions">
                    <button className="btn btn-primary" onClick={() => navigate('/books/create')}>
                        <HiOutlinePlus /> Tambah Buku
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    {loading ? (
                        <div className="loading-spinner"><div className="spinner"></div> Memuat...</div>
                    ) : books.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">📚</div>
                            <h3>Belum ada data buku</h3>
                            <p>Klik tombol "Tambah Buku" untuk menambahkan</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Cover</th>
                                    <th>Judul</th>
                                    <th>Penulis</th>
                                    <th>Kategori</th>
                                    <th>Penerbit</th>
                                    <th>Rak</th>
                                    <th>Stok</th>
                                    <th>Tersedia</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {books.map(book => (
                                    <tr key={book.id}>
                                        <td>
                                            <div className="book-thumb">
                                                {book.cover ? (
                                                    <img src={`/storage/${book.cover}`} alt={book.judul} />
                                                ) : (
                                                    <div className="book-thumb-placeholder">📖</div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                            {book.judul}
                                            {book.isbn && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ISBN: {book.isbn}</div>}
                                        </td>
                                        <td>{book.penulis}</td>
                                        <td><span className="badge badge-purple">{book.category?.nama_kategori || '-'}</span></td>
                                        <td>{book.penerbit?.nama_penerbit || '-'}</td>
                                        <td>{book.rak?.kode_rak || '-'}</td>
                                        <td>{book.stok}</td>
                                        <td>
                                            <span className={`badge ${book.stok_tersedia > 0 ? 'badge-success' : 'badge-danger'}`}>
                                                {book.stok_tersedia}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/books/${book.id}/edit`)} title="Edit">
                                                    <HiOutlinePencil />
                                                </button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(book.id)} title="Hapus">
                                                    <HiOutlineTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {meta.last_page > 1 && (
                    <div className="pagination">
                        <div className="pagination-info">Halaman {meta.current_page} dari {meta.last_page} ({meta.total} data)</div>
                        <div className="pagination-buttons">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
                            {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => {
                                const p = Math.max(1, Math.min(page - 2, meta.last_page - 4)) + i;
                                return <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>;
                            })}
                            <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>→</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
