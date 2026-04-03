import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineX, HiOutlineRefresh, HiOutlineTrash } from 'react-icons/hi';

export default function Peminjaman() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [books, setBooks] = useState([]);
    const [form, setForm] = useState({ user_id: '', book_id: '', tanggal_pinjam: '', tanggal_kembali_rencana: '', catatan: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try { const res = await api.get('/peminjaman', { params: { search, page, status, per_page: 10 } }); setItems(res.data.data.data); setMeta(res.data.data); }
        catch { toast.error('Gagal memuat data'); } finally { setLoading(false); }
    }, [search, page, status]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => {
        Promise.all([
            api.get('/users', { params: { per_page: 200 } }),
            api.get('/books', { params: { per_page: 200, available: true } }),
        ]).then(([u, b]) => { setUsers(u.data.data.data || []); setBooks(b.data.data.data || []); }).catch(() => { });
    }, []);

    const openCreate = () => {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        setForm({ user_id: '', book_id: '', tanggal_pinjam: today, tanggal_kembali_rencana: nextWeek, catatan: '' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try { await api.post('/peminjaman', form); toast.success('Peminjaman berhasil dicatat'); setShowModal(false); fetchData(); }
        catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan'); }
    };

    const handleReturn = async (id) => {
        if (!confirm('Konfirmasi pengembalian buku ini?')) return;
        try { const res = await api.post(`/peminjaman/${id}/return`); toast.success(res.data.message); fetchData(); }
        catch (err) { toast.error(err.response?.data?.message || 'Gagal mengembalikan'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin hapus data peminjaman ini?')) return;
        try { await api.delete(`/peminjaman/${id}`); toast.success('Data dihapus'); fetchData(); }
        catch (err) { toast.error(err.response?.data?.message || 'Gagal menghapus'); }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    return (
        <div className="fade-in">
            <div className="toolbar">
                <div className="toolbar-search"><HiOutlineSearch className="search-icon" /><input placeholder="Cari peminjaman..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
                <div className="toolbar-actions">
                    <select className="form-control" style={{ width: 'auto' }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                        <option value="">Semua Status</option>
                        <option value="dipinjam">Dipinjam</option>
                        <option value="dikembalikan">Dikembalikan</option>
                        <option value="terlambat">Terlambat</option>
                    </select>
                    <button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus /> Tambah Peminjaman</button>
                </div>
            </div>
            <div className="card">
                <div className="table-container">
                    {loading ? <div className="loading-spinner"><div className="spinner"></div> Memuat...</div> :
                        items.length === 0 ? <div className="empty-state"><div className="icon">📋</div><h3>Belum ada peminjaman</h3></div> :
                            <table className="data-table">
                                <thead><tr><th>Kode</th><th>Peminjam</th><th>Buku</th><th>Tgl Pinjam</th><th>Tgl Kembali</th><th>Status</th><th>Denda</th><th>Aksi</th></tr></thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td><span className="badge badge-info" style={{ fontFamily: 'monospace' }}>{item.kode_peminjaman}</span></td>
                                            <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                                {item.user?.name}
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.user?.role}</div>
                                            </td>
                                            <td>{item.book?.judul}</td>
                                            <td>{formatDate(item.tanggal_pinjam)}</td>
                                            <td>{formatDate(item.tanggal_kembali_rencana)}</td>
                                            <td>
                                                <span className={`badge ${item.status === 'dipinjam' ? 'badge-warning' : item.status === 'dikembalikan' ? 'badge-success' : 'badge-danger'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td>{item.denda > 0 ? `Rp ${Number(item.denda).toLocaleString('id-ID')}` : '-'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    {item.status === 'dipinjam' && <button className="btn btn-sm btn-success" onClick={() => handleReturn(item.id)} title="Kembalikan"><HiOutlineRefresh /></button>}
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)} title="Hapus"><HiOutlineTrash /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>}
                </div>
                {meta.last_page > 1 && <div className="pagination"><div className="pagination-info">Halaman {meta.current_page} dari {meta.last_page} ({meta.total} data)</div><div className="pagination-buttons"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button><button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>→</button></div></div>}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Tambah Peminjaman</h2><button className="modal-close" onClick={() => setShowModal(false)}><HiOutlineX /></button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Peminjam *</label>
                                        <select className="form-control" value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} required>
                                            <option value="">-- Pilih Peminjam --</option>
                                            {users.filter(u => u.role !== 'admin').map(u => <option key={u.id} value={u.id}>{u.name} ({u.role}{u.nis ? ' - ' + u.nis : u.nip ? ' - ' + u.nip : ''})</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Buku *</label>
                                        <select className="form-control" value={form.book_id} onChange={e => setForm({ ...form, book_id: e.target.value })} required>
                                            <option value="">-- Pilih Buku --</option>
                                            {books.filter(b => b.stok_tersedia > 0).map(b => <option key={b.id} value={b.id}>{b.judul} (stok: {b.stok_tersedia})</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Tanggal Pinjam *</label><input type="date" className="form-control" value={form.tanggal_pinjam} onChange={e => setForm({ ...form, tanggal_pinjam: e.target.value })} required /></div>
                                    <div className="form-group"><label>Tanggal Kembali *</label><input type="date" className="form-control" value={form.tanggal_kembali_rencana} onChange={e => setForm({ ...form, tanggal_kembali_rencana: e.target.value })} required /></div>
                                </div>
                                <div className="form-group"><label>Catatan</label><textarea className="form-control" value={form.catatan} onChange={e => setForm({ ...form, catatan: e.target.value })} rows={2} /></div>
                            </div>
                            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button><button type="submit" className="btn btn-primary">Simpan</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
