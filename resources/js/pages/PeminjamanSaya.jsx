import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
    HiOutlineClipboardList, HiOutlineSearch, HiOutlineBookOpen,
    HiOutlineCalendar, HiOutlineCheckCircle, HiOutlineExclamation,
    HiOutlineClock, HiOutlineEye, HiOutlineX,
} from 'react-icons/hi';

export default function PeminjamanSaya() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/my-peminjaman', {
                params: { search, page, status, per_page: 10 }
            });
            setItems(res.data.data.data || []);
            setMeta(res.data.data);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [search, page, status]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    const getStatusBadge = (item) => {
        if (item.status === 'dikembalikan') return { cls: 'badge-success', label: 'Dikembalikan', icon: <HiOutlineCheckCircle /> };
        // Check overdue
        if (item.status === 'dipinjam' && item.tanggal_kembali_rencana) {
            const due = new Date(item.tanggal_kembali_rencana);
            if (new Date() > due) return { cls: 'badge-danger', label: 'Terlambat', icon: <HiOutlineExclamation /> };
        }
        return { cls: 'badge-warning', label: 'Dipinjam', icon: <HiOutlineClock /> };
    };

    const getCoverUrl = (cover) => {
        if (!cover) return null;
        if (cover.startsWith('http')) return cover;
        return `/storage/${cover}`;
    };

    const getDaysRemaining = (item) => {
        if (item.status !== 'dipinjam' || !item.tanggal_kembali_rencana) return null;
        const due = new Date(item.tanggal_kembali_rencana);
        const now = new Date();
        const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <div className="fade-in peminjaman-saya">
            {/* ─── Header Stats ─────────────────────────── */}
            <div className="ps-stats-row">
                <div className="ps-stat-card ps-stat--active">
                    <div className="ps-stat-icon"><HiOutlineClock /></div>
                    <div className="ps-stat-content">
                        <span className="ps-stat-num">{items.filter(i => i.status === 'dipinjam').length}</span>
                        <span className="ps-stat-label">Sedang Dipinjam</span>
                    </div>
                </div>
                <div className="ps-stat-card ps-stat--returned">
                    <div className="ps-stat-icon"><HiOutlineCheckCircle /></div>
                    <div className="ps-stat-content">
                        <span className="ps-stat-num">{items.filter(i => i.status === 'dikembalikan').length}</span>
                        <span className="ps-stat-label">Dikembalikan</span>
                    </div>
                </div>
                <div className="ps-stat-card ps-stat--total">
                    <div className="ps-stat-icon"><HiOutlineClipboardList /></div>
                    <div className="ps-stat-content">
                        <span className="ps-stat-num">{meta.total || items.length}</span>
                        <span className="ps-stat-label">Total Peminjaman</span>
                    </div>
                </div>
            </div>

            {/* ─── Search & Filter ────────────────────────── */}
            <div className="ps-toolbar">
                <div className="ps-search">
                    <HiOutlineSearch className="ps-search-icon" />
                    <input
                        placeholder="Cari judul buku atau kode peminjaman..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="ps-search-input"
                    />
                    {search && (
                        <button className="ps-search-clear" onClick={() => { setSearch(''); setPage(1); }}>
                            <HiOutlineX />
                        </button>
                    )}
                </div>
                <div className="ps-filters">
                    <select
                        className="ps-filter-select"
                        value={status}
                        onChange={e => { setStatus(e.target.value); setPage(1); }}
                    >
                        <option value="">Semua Status</option>
                        <option value="dipinjam">Dipinjam</option>
                        <option value="dikembalikan">Dikembalikan</option>
                    </select>
                </div>
            </div>

            {/* ─── Content ───────────────────────────────── */}
            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div> Memuat data peminjaman...</div>
            ) : items.length === 0 ? (
                <div className="ps-empty">
                    <div className="ps-empty-icon"><HiOutlineClipboardList /></div>
                    <h3>Belum ada peminjaman</h3>
                    <p>{search || status ? 'Tidak ada data yang cocok dengan filter.' : 'Kamu belum meminjam buku. Yuk pinjam buku di halaman Dashboard!'}</p>
                </div>
            ) : (
                <div className="ps-list">
                    {items.map(item => {
                        const badge = getStatusBadge(item);
                        const daysRemaining = getDaysRemaining(item);

                        return (
                            <div key={item.id} className="ps-card" onClick={() => setSelectedItem(item)}>
                                <div className="ps-card-cover">
                                    {item.book?.cover ? (
                                        <img src={getCoverUrl(item.book.cover)} alt={item.book?.judul} />
                                    ) : (
                                        <div className="siswa-cover-placeholder"><HiOutlineBookOpen /></div>
                                    )}
                                </div>
                                <div className="ps-card-body">
                                    <div className="ps-card-header">
                                        <h4 className="ps-card-title">{item.book?.judul || 'Buku tidak ditemukan'}</h4>
                                        <span className={`badge ${badge.cls}`}>
                                            {badge.icon} {badge.label}
                                        </span>
                                    </div>
                                    <p className="ps-card-author">{item.book?.penulis}</p>
                                    <div className="ps-card-meta">
                                        <span className="ps-card-code">{item.kode_peminjaman}</span>
                                        <span className="ps-card-date">
                                            <HiOutlineCalendar />
                                            {formatDate(item.tanggal_pinjam)}
                                        </span>
                                        <span className="ps-card-date">
                                            → {formatDate(item.tanggal_kembali_rencana)}
                                        </span>
                                    </div>
                                    {item.status === 'dipinjam' && daysRemaining !== null && (
                                        <div className={`ps-card-countdown ${daysRemaining < 0 ? 'overdue' : daysRemaining <= 2 ? 'warning' : 'safe'}`}>
                                            {daysRemaining < 0
                                                ? `Terlambat ${Math.abs(daysRemaining)} hari`
                                                : daysRemaining === 0
                                                    ? 'Hari ini harus dikembalikan!'
                                                    : `${daysRemaining} hari lagi`
                                            }
                                        </div>
                                    )}
                                    {item.status === 'dikembalikan' && item.tanggal_kembali_aktual && (
                                        <div className="ps-card-returned">
                                            Dikembalikan: {formatDate(item.tanggal_kembali_aktual)}
                                            {item.denda > 0 && (
                                                <span className="ps-card-denda">
                                                    Denda: Rp {Number(item.denda).toLocaleString('id-ID')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="ps-card-action">
                                    <HiOutlineEye />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── Pagination ────────────────────────────── */}
            {meta.last_page > 1 && (
                <div className="ps-pagination">
                    <span className="ps-pagination-info">
                        Halaman {meta.current_page} dari {meta.last_page} ({meta.total} data)
                    </span>
                    <div className="ps-pagination-buttons">
                        <button
                            className="btn btn-sm btn-secondary"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            ← Sebelumnya
                        </button>
                        <button
                            className="btn btn-sm btn-secondary"
                            disabled={page >= meta.last_page}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Selanjutnya →
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Detail Modal ──────────────────────────── */}
            {selectedItem && (
                <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
                    <div className="ps-detail-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedItem(null)}><HiOutlineX /></button>
                        <div className="ps-detail-header">
                            <div className="ps-detail-cover">
                                {selectedItem.book?.cover ? (
                                    <img src={getCoverUrl(selectedItem.book.cover)} alt={selectedItem.book?.judul} />
                                ) : (
                                    <div className="siswa-cover-placeholder"><HiOutlineBookOpen /></div>
                                )}
                            </div>
                            <div className="ps-detail-info">
                                <h2>{selectedItem.book?.judul}</h2>
                                <p className="ps-detail-author">{selectedItem.book?.penulis}</p>
                                <span className={`badge ${getStatusBadge(selectedItem).cls}`}>
                                    {getStatusBadge(selectedItem).icon} {getStatusBadge(selectedItem).label}
                                </span>
                            </div>
                        </div>
                        <div className="ps-detail-body">
                            <div className="ps-detail-row">
                                <span className="ps-detail-label">Kode Peminjaman</span>
                                <span className="ps-detail-value" style={{ fontFamily: 'monospace' }}>{selectedItem.kode_peminjaman}</span>
                            </div>
                            <div className="ps-detail-row">
                                <span className="ps-detail-label">ISBN</span>
                                <span className="ps-detail-value">{selectedItem.book?.isbn || '-'}</span>
                            </div>
                            <div className="ps-detail-row">
                                <span className="ps-detail-label">Tanggal Pinjam</span>
                                <span className="ps-detail-value">{formatDate(selectedItem.tanggal_pinjam)}</span>
                            </div>
                            <div className="ps-detail-row">
                                <span className="ps-detail-label">Batas Kembali</span>
                                <span className="ps-detail-value">{formatDate(selectedItem.tanggal_kembali_rencana)}</span>
                            </div>
                            {selectedItem.tanggal_kembali_aktual && (
                                <div className="ps-detail-row">
                                    <span className="ps-detail-label">Tanggal Dikembalikan</span>
                                    <span className="ps-detail-value">{formatDate(selectedItem.tanggal_kembali_aktual)}</span>
                                </div>
                            )}
                            {selectedItem.denda > 0 && (
                                <div className="ps-detail-row">
                                    <span className="ps-detail-label">Denda</span>
                                    <span className="ps-detail-value" style={{ color: 'var(--danger)', fontWeight: 600 }}>
                                        Rp {Number(selectedItem.denda).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            )}
                            {selectedItem.catatan && (
                                <div className="ps-detail-row">
                                    <span className="ps-detail-label">Catatan</span>
                                    <span className="ps-detail-value">{selectedItem.catatan}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
