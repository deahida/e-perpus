import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';

export default function Users() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [kelasList, setKelasList] = useState([]);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'siswa', nis: '', nip: '', phone: '', address: '', kelas_id: '', is_active: true });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try { const res = await api.get('/users', { params: { search, page, role, per_page: 10 } }); setItems(res.data.data.data); setMeta(res.data.data); }
        catch { toast.error('Gagal memuat'); } finally { setLoading(false); }
    }, [search, page, role]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { api.get('/kelas', { params: { per_page: 100 } }).then(r => setKelasList(r.data.data.data || [])).catch(() => { }); }, []);

    const openCreate = () => { setEditing(null); setForm({ name: '', email: '', password: '', role: 'siswa', nis: '', nip: '', phone: '', address: '', kelas_id: '', is_active: true }); setShowModal(true); };
    const openEdit = (u) => { setEditing(u); setForm({ name: u.name, email: u.email, password: '', role: u.role, nis: u.nis || '', nip: u.nip || '', phone: u.phone || '', address: u.address || '', kelas_id: u.kelas_id || '', is_active: u.is_active }); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = { ...form };
        if (editing && !data.password) delete data.password;
        try {
            if (editing) { await api.put(`/users/${editing.id}`, data); toast.success('Pengguna diperbarui'); }
            else { await api.post('/users', data); toast.success('Pengguna ditambahkan'); }
            setShowModal(false); fetchData();
        } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin hapus pengguna ini?')) return;
        try { await api.delete(`/users/${id}`); toast.success('Pengguna dihapus'); fetchData(); }
        catch (err) { toast.error(err.response?.data?.message || 'Gagal menghapus'); }
    };

    return (
        <div className="fade-in">
            <div className="toolbar">
                <div className="toolbar-search"><HiOutlineSearch className="search-icon" /><input placeholder="Cari pengguna..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
                <div className="toolbar-actions">
                    <select className="form-control" style={{ width: 'auto' }} value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
                        <option value="">Semua Role</option>
                        <option value="admin">Admin</option>
                        <option value="guru">Guru</option>
                        <option value="siswa">Siswa</option>
                    </select>
                    <button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus /> Tambah</button>
                </div>
            </div>
            <div className="card">
                <div className="table-container">
                    {loading ? <div className="loading-spinner"><div className="spinner"></div></div> :
                        items.length === 0 ? <div className="empty-state"><h3>Tidak ada data</h3></div> :
                            <table className="data-table">
                                <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>NIS/NIP</th><th>Kelas</th><th>Status</th><th>Aksi</th></tr></thead>
                                <tbody>
                                    {items.map(u => (
                                        <tr key={u.id}>
                                            <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{u.name}</td>
                                            <td>{u.email}</td>
                                            <td><span className={`badge role-${u.role}`}>{u.role}</span></td>
                                            <td>{u.nis || u.nip || '-'}</td>
                                            <td>{u.kelas?.nama_kelas || '-'}</td>
                                            <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                                            <td><div style={{ display: 'flex', gap: 4 }}><button className="btn btn-sm btn-secondary" onClick={() => openEdit(u)}><HiOutlinePencil /></button><button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}><HiOutlineTrash /></button></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>}
                </div>
                {meta.last_page > 1 && <div className="pagination"><span className="pagination-info">Hal {meta.current_page}/{meta.last_page} ({meta.total} data)</span><div className="pagination-buttons"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button><button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>→</button></div></div>}
            </div>
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>{editing ? 'Edit' : 'Tambah'} Pengguna</h2><button className="modal-close" onClick={() => setShowModal(false)}><HiOutlineX /></button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="grid-2">
                                    <div className="form-group"><label>Nama *</label><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                                    <div className="form-group"><label>Email *</label><input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
                                    <div className="form-group"><label>Password {editing ? '(kosongkan jika tidak diubah)' : '*'}</label><input type="password" className="form-control" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editing} /></div>
                                    <div className="form-group"><label>Role *</label><select className="form-control" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="siswa">Siswa</option><option value="guru">Guru</option><option value="admin">Admin</option></select></div>
                                    {form.role === 'siswa' && <div className="form-group"><label>NIS</label><input className="form-control" value={form.nis} onChange={e => setForm({ ...form, nis: e.target.value })} /></div>}
                                    {form.role === 'guru' && <div className="form-group"><label>NIP</label><input className="form-control" value={form.nip} onChange={e => setForm({ ...form, nip: e.target.value })} /></div>}
                                    {form.role === 'siswa' && <div className="form-group"><label>Kelas</label><select className="form-control" value={form.kelas_id} onChange={e => setForm({ ...form, kelas_id: e.target.value })}><option value="">-- Pilih --</option>{kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}</select></div>}
                                    <div className="form-group"><label>Telepon</label><input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                                </div>
                                <div className="form-group"><label>Alamat</label><textarea className="form-control" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} /></div>
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
