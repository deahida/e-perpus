import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';

export default function Penerbit() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ nama_penerbit: '', alamat: '', telepon: '', email: '', is_active: true });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try { const res = await api.get('/penerbit', { params: { search, page, per_page: 10 } }); setItems(res.data.data.data); setMeta(res.data.data); }
        catch { toast.error('Gagal memuat data'); } finally { setLoading(false); }
    }, [search, page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openCreate = () => { setEditing(null); setForm({ nama_penerbit: '', alamat: '', telepon: '', email: '', is_active: true }); setShowModal(true); };
    const openEdit = (item) => { setEditing(item); setForm({ nama_penerbit: item.nama_penerbit, alamat: item.alamat || '', telepon: item.telepon || '', email: item.email || '', is_active: item.is_active }); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) { await api.put(`/penerbit/${editing.id}`, form); toast.success('Penerbit diperbarui'); }
            else { await api.post('/penerbit', form); toast.success('Penerbit ditambahkan'); }
            setShowModal(false); fetchData();
        } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin hapus penerbit ini?')) return;
        try { await api.delete(`/penerbit/${id}`); toast.success('Penerbit dihapus'); fetchData(); }
        catch (err) { toast.error(err.response?.data?.message || 'Gagal menghapus'); }
    };

    return (
        <div className="fade-in">
            <div className="toolbar">
                <div className="toolbar-search"><HiOutlineSearch className="search-icon" /><input placeholder="Cari penerbit..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
                <div className="toolbar-actions"><button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus /> Tambah Penerbit</button></div>
            </div>
            <div className="card">
                <div className="table-container">
                    {loading ? <div className="loading-spinner"><div className="spinner"></div> Memuat...</div> :
                        items.length === 0 ? <div className="empty-state"><div className="icon">🏢</div><h3>Belum ada penerbit</h3></div> :
                            <table className="data-table">
                                <thead><tr><th>Nama Penerbit</th><th>Alamat</th><th>Telepon</th><th>Email</th><th>Jml Buku</th><th>Aksi</th></tr></thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.nama_penerbit}</td>
                                            <td>{item.alamat || '-'}</td>
                                            <td>{item.telepon || '-'}</td>
                                            <td>{item.email || '-'}</td>
                                            <td>{item.books_count}</td>
                                            <td><div style={{ display: 'flex', gap: 4 }}><button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}><HiOutlinePencil /></button><button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}><HiOutlineTrash /></button></div></td>
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
                        <div className="modal-header"><h2>{editing ? 'Edit' : 'Tambah'} Penerbit</h2><button className="modal-close" onClick={() => setShowModal(false)}><HiOutlineX /></button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group"><label>Nama Penerbit *</label><input className="form-control" value={form.nama_penerbit} onChange={e => setForm({ ...form, nama_penerbit: e.target.value })} required /></div>
                                <div className="form-group"><label>Alamat</label><textarea className="form-control" value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} rows={2} /></div>
                                <div className="grid-2">
                                    <div className="form-group"><label>Telepon</label><input className="form-control" value={form.telepon} onChange={e => setForm({ ...form, telepon: e.target.value })} /></div>
                                    <div className="form-group"><label>Email</label><input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                                </div>
                            </div>
                            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button><button type="submit" className="btn btn-primary">{editing ? 'Simpan' : 'Tambah'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
