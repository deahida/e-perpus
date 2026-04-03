import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineSearch } from 'react-icons/hi';

export default function Checkpoints() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [tipe, setTipe] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { search, page, tipe, from_date: fromDate, to_date: toDate, per_page: 10 };
            const res = await api.get('/checkpoints', { params });
            setItems(res.data.data.data);
            setMeta(res.data.data);
        } catch { toast.error('Gagal memuat data'); }
        finally { setLoading(false); }
    }, [search, page, tipe, fromDate, toDate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '-';

    return (
        <div className="fade-in">
            <div className="toolbar" style={{ flexWrap: 'wrap' }}>
                <div className="toolbar-search">
                    <HiOutlineSearch className="search-icon" />
                    <input placeholder="Cari..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <div className="toolbar-actions" style={{ flexWrap: 'wrap' }}>
                    <select className="form-control" style={{ width: 'auto' }} value={tipe} onChange={e => { setTipe(e.target.value); setPage(1); }}>
                        <option value="">Semua Tipe</option>
                        <option value="keluar">Keluar</option>
                        <option value="masuk">Masuk</option>
                    </select>
                    <input type="date" className="form-control" style={{ width: 150 }} value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
                    <input type="date" className="form-control" style={{ width: 150 }} value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
                </div>
            </div>
            <div className="card">
                <div className="table-container">
                    {loading ? <div className="loading-spinner"><div className="spinner"></div></div> :
                        items.length === 0 ? <div className="empty-state"><h3>Belum ada checkpoint</h3></div> :
                            <table className="data-table">
                                <thead>
                                    <tr><th>Waktu</th><th>Kode</th><th>Pengguna</th><th>Buku</th><th>Tipe</th><th>Keterangan</th><th>Verifikator</th></tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(item.waktu)}</td>
                                            <td><span className="badge badge-info">{item.peminjaman?.kode_peminjaman}</span></td>
                                            <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.user?.name}</td>
                                            <td>{item.book?.judul}</td>
                                            <td><span className={`badge ${item.tipe === 'keluar' ? 'badge-warning' : 'badge-success'}`}>{item.tipe === 'keluar' ? '↗ Keluar' : '↙ Masuk'}</span></td>
                                            <td>{item.keterangan || '-'}</td>
                                            <td>{item.verifier?.name || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>}
                </div>
                {meta.last_page > 1 && (
                    <div className="pagination">
                        <span className="pagination-info">Hal {meta.current_page}/{meta.last_page}</span>
                        <div className="pagination-buttons">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
                            <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>→</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
