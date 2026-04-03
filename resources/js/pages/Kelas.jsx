import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';

export default function Kelas() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ nama_kelas: '', tingkat: '', jurusan: '', is_active: true });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try { const res = await api.get('/kelas', { params: { search, page, per_page: 15 } }); setItems(res.data.data.data); setMeta(res.data.data); }
        catch { toast.error('Gagal memuat'); } finally { setLoading(false); }
    }, [search, page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openCreate = () => { setEditing(null); setForm({ nama_kelas: '', tingkat: '', jurusan: '', is_active: true }); setShowModal(true); };
    const openEdit = (k) => { setEditing(k); setForm({ nama_kelas: k.nama_kelas, tingkat: k.tingkat || '', jurusan: k.jurusan || '', is_active: k.is_active }); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) { await api.put(`/kelas/${editing.id}`, form); toast.success('Kelas diperbarui'); }
            else { await api.post('/kelas', form); toast.success('Kelas ditambahkan'); }
            setShowModal(false); fetchData();
        } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin hapus kelas ini?')) return;
        try { await api.delete(`/kelas/${id}`); toast.success('Kelas dihapus'); fetchData(); }
        catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
    };

    return (
        <div className="fade-in">
            <div className="toolbar">
                <div className="toolbar-search"><HiOutlineSearch className="search-icon" /><input placeholder="Cari kelas..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
                <div className="toolbar-actions"><button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus /> Tambah Kelas</button></div>
            </div>
            <div className="card">
                <div className="table-container">
                    {loading ? <div className="loading-spinner"><div className="spinner"></div></div> :
                        items.length === 0 ? <div className="empty-state"><h3>Belum ada kelas</h3></div> :
                            <table className="data-table">
                                <thead><tr><th>Nama Kelas</th><th>Tingkat</th><th>Jurusan</th><th>Jml Siswa</th><th>Status</th><th>Aksi</th></tr></thead>
                                <tbody>
                                    {items.map(k => (
                                        <tr key={k.id}>
                                            <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{k.nama_kelas}</td>
                                            <td><span className="badge badge-purple">{k.tingkat || '-'}</span></td>
                                            <td>{k.jurusan || '-'}</td>
                                            <td>{k.siswa_count}</td>
                                            <td><span className={`badge ${k.is_active ? 'badge-success' : 'badge-danger'}`}>{k.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                                            <td><div style={{ display: 'flex', gap: 4 }}><button className="btn btn-sm btn-secondary" onClick={() => openEdit(k)}><HiOutlinePencil /></button><button className="btn btn-sm btn-danger" onClick={() => handleDelete(k.id)}><HiOutlineTrash /></button></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>}
                </div>
                {meta.last_page > 1 && <div className="pagination"><span className="pagination-info">Hal {meta.current_page}/{meta.last_page}</span><div className="pagination-buttons"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button><button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>→</button></div></div>}
            </div>
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>{editing ? 'Edit' : 'Tambah'} Kelas</h2><button className="modal-close" onClick={() => setShowModal(false)}><HiOutlineX /></button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group"><label>Nama Kelas *</label><input className="form-control" value={form.nama_kelas} onChange={e => setForm({ ...form, nama_kelas: e.target.value })} required /></div>
                                <div className="grid-2">
                                    <div className="form-group"><label>Tingkat</label><select className="form-control" value={form.tingkat} onChange={e => setForm({ ...form, tingkat: e.target.value })}><option value="">-- Pilih --</option><option value="X">X</option><option value="XI">XI</option><option value="XII">XII</option></select></div>
                                    <div className="form-group"><label>Jurusan</label><input className="form-control" value={form.jurusan} onChange={e => setForm({ ...form, jurusan: e.target.value })} /></div>
                                </div>
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
