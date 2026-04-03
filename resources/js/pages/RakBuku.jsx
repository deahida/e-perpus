import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';

export default function RakBuku() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({ kode_rak: '', nama_rak: '', lokasi: '', category_id: '', is_active: true });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/rak-buku', { params: { search, page, per_page: 10 } });
            setItems(res.data.data.data);
            setMeta(res.data.data);
        } catch { toast.error('Gagal memuat data'); }
        finally { setLoading(false); }
    }, [search, page]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { api.get('/categories', { params: { per_page: 100 } }).then(r => setCategories(r.data.data.data || [])); }, []);

    const openCreate = () => { setEditing(null); setForm({ kode_rak: '', nama_rak: '', lokasi: '', category_id: '', is_active: true }); setShowModal(true); };
    const openEdit = (item) => { setEditing(item); setForm({ kode_rak: item.kode_rak, nama_rak: item.nama_rak, lokasi: item.lokasi || '', category_id: item.category_id || '', is_active: item.is_active }); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) { await api.put(`/rak-buku/${editing.id}`, form); toast.success('Rak berhasil diperbarui'); }
            else { await api.post('/rak-buku', form); toast.success('Rak berhasil ditambahkan'); }
            setShowModal(false); fetchData();
        } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin hapus rak ini?')) return;
        try { await api.delete(`/rak-buku/${id}`); toast.success('Rak dihapus'); fetchData(); }
        catch (err) { toast.error(err.response?.data?.message || 'Gagal menghapus'); }
    };

    return (
        <div className="fade-in">
            <div className="toolbar">
                <div className="toolbar-search">
                    <HiOutlineSearch className="search-icon" />
                    <input placeholder="Cari rak buku..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <div className="toolbar-actions">
                    <button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus /> Tambah Rak</button>
                </div>
            </div>
            <div className="card">
                <div className="table-container">
                    {loading ? <div className="loading-spinner"><div className="spinner"></div> Memuat...</div> :
                        items.length === 0 ? <div className="empty-state"><div className="icon">🗄️</div><h3>Belum ada rak buku</h3></div> :
                            <table className="data-table">
                                <thead><tr><th>Kode</th><th>Nama Rak</th><th>Lokasi</th><th>Kategori</th><th>Jml Buku</th><th>Status</th><th>Aksi</th></tr></thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td><span className="badge badge-info">{item.kode_rak}</span></td>
                                            <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.nama_rak}</td>
                                            <td>{item.lokasi || '-'}</td>
                                            <td>{item.category?.nama_kategori || '-'}</td>
                                            <td>{item.books_count}</td>
                                            <td><span className={`badge ${item.is_active ? 'badge-success' : 'badge-danger'}`}>{item.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}><HiOutlinePencil /></button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}><HiOutlineTrash /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>}
                </div>
                {meta.last_page > 1 && <div className="pagination"><div className="pagination-info">Halaman {meta.current_page} dari {meta.last_page}</div><div className="pagination-buttons"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button><button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>→</button></div></div>}
            </div>
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>{editing ? 'Edit' : 'Tambah'} Rak Buku</h2><button className="modal-close" onClick={() => setShowModal(false)}><HiOutlineX /></button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="grid-2">
                                    <div className="form-group"><label>Kode Rak *</label><input className="form-control" value={form.kode_rak} onChange={e => setForm({ ...form, kode_rak: e.target.value })} required /></div>
                                    <div className="form-group"><label>Nama Rak *</label><input className="form-control" value={form.nama_rak} onChange={e => setForm({ ...form, nama_rak: e.target.value })} required /></div>
                                </div>
                                <div className="form-group"><label>Lokasi</label><input className="form-control" value={form.lokasi} onChange={e => setForm({ ...form, lokasi: e.target.value })} /></div>
                                <div className="form-group"><label>Kategori</label><select className="form-control" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}><option value="">-- Pilih --</option>{categories.map(c => <option key={c.id} value={c.id}>{c.nama_kategori}</option>)}</select></div>
                                <div className="form-group"><label><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} style={{ marginRight: 8 }} />Aktif</label></div>
                            </div>
                            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button><button type="submit" className="btn btn-primary">{editing ? 'Simpan' : 'Tambah'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
