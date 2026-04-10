import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import BarcodeScanner from '../components/BarcodeScanner';
import {
    HiOutlineQrcode, HiOutlineRefresh, HiOutlineBookOpen,
    HiOutlineUser, HiOutlineCalendar, HiOutlineCash,
    HiOutlineCheck, HiOutlineX, HiOutlineClock,
    HiOutlineExclamationCircle, HiOutlineSearch, HiOutlineTag
} from 'react-icons/hi';

export default function ScanBuku() {
    // Scanner state
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scanMode, setScanMode] = useState('peminjaman'); // 'peminjaman' | 'pengembalian'

    // Data states
    const [bookData, setBookData] = useState(null);
    const [peminjamanData, setPeminjamanData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Peminjaman form state
    const [users, setUsers] = useState([]);
    const [searchUser, setSearchUser] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [tanggalPinjam, setTanggalPinjam] = useState('');
    const [tanggalKembali, setTanggalKembali] = useState('');

    // Scan history
    const [scanHistory, setScanHistory] = useState([]);

    // Load users
    useEffect(() => {
        api.get('/users', { params: { per_page: 200 } })
            .then(res => setUsers((res.data.data.data || []).filter(u => u.role !== 'admin')))
            .catch(() => { });
    }, []);

    // Set default dates
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        setTanggalPinjam(today);
        setTanggalKembali(nextWeek);
    }, []);

    // Filter users based on search
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
        (u.nis && u.nis.includes(searchUser)) ||
        (u.nip && u.nip.includes(searchUser))
    );

    // Open scanner
    const openScanner = (mode) => {
        setScanMode(mode);
        setScannerOpen(true);
    };

    // Handle scan result
    const handleScan = useCallback(async (code) => {
        setScannerOpen(false);
        setLoading(true);
        setBookData(null);
        setPeminjamanData(null);
        setSelectedUser(null);
        setSearchUser('');

        try {
            if (scanMode === 'peminjaman') {
                const res = await api.post('/scan-buku', { kode: code });
                setBookData(res.data.data);
                toast.success(`Buku ditemukan: ${res.data.data.judul}`);
            } else {
                const res = await api.post('/scan-peminjaman', { kode: code });
                setPeminjamanData(res.data.data);
                toast.success('Peminjaman aktif ditemukan');
            }

            // Add to history
            setScanHistory(prev => [{
                kode: code,
                mode: scanMode,
                timestamp: new Date().toLocaleTimeString('id-ID'),
                success: true,
            }, ...prev].slice(0, 5));

        } catch (err) {
            const msg = err.response?.data?.message || 'Gagal memproses scan';
            toast.error(msg);

            // If pengembalian scan returned book data but no active borrow
            if (err.response?.data?.data?.book) {
                setBookData(err.response.data.data.book);
            }

            setScanHistory(prev => [{
                kode: code,
                mode: scanMode,
                timestamp: new Date().toLocaleTimeString('id-ID'),
                success: false,
                error: msg,
            }, ...prev].slice(0, 5));
        } finally {
            setLoading(false);
        }
    }, [scanMode]);

    // Handle peminjaman submit
    const handlePeminjaman = async () => {
        if (!bookData || !selectedUser) return;

        setSubmitting(true);
        try {
            const res = await api.post('/peminjaman', {
                user_id: selectedUser.id,
                book_id: bookData.id,
                tanggal_pinjam: tanggalPinjam,
                tanggal_kembali_rencana: tanggalKembali,
                catatan: `Peminjaman via scan barcode`,
            });
            toast.success(res.data.message || 'Peminjaman berhasil dicatat!');
            setBookData(null);
            setSelectedUser(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan peminjaman');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle pengembalian submit
    const handlePengembalian = async (peminjamanId) => {
        setSubmitting(true);
        try {
            const res = await api.post(`/peminjaman/${peminjamanId}/return`);
            toast.success(res.data.message || 'Buku berhasil dikembalikan!');
            setPeminjamanData(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal mengembalikan buku');
        } finally {
            setSubmitting(false);
        }
    };

    // Manual code input
    const [manualCode, setManualCode] = useState('');
    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualCode.trim()) {
            handleScan(manualCode.trim());
            setManualCode('');
        }
    };

    return (
        <div className="fade-in scan-page">
            {/* ─── Action Buttons ─── */}
            <div className="scan-actions-grid">
                <button className="scan-action-card scan-action-peminjaman" onClick={() => openScanner('peminjaman')}>
                    <div className="scan-action-icon">
                        <HiOutlineQrcode size={32} />
                    </div>
                    <div className="scan-action-info">
                        <h3>Scan Peminjaman</h3>
                        <p>Scan barcode buku → Pilih siswa → Simpan</p>
                    </div>
                    <div className="scan-action-arrow">→</div>
                </button>

                <button className="scan-action-card scan-action-pengembalian" onClick={() => openScanner('pengembalian')}>
                    <div className="scan-action-icon">
                        <HiOutlineRefresh size={32} />
                    </div>
                    <div className="scan-action-info">
                        <h3>Scan Pengembalian</h3>
                        <p>Scan barcode buku → Cek denda → Selesai</p>
                    </div>
                    <div className="scan-action-arrow">→</div>
                </button>
            </div>

            {/* ─── Manual Input ─── */}
            <div className="card scan-manual-card">
                <form onSubmit={handleManualSubmit} className="scan-manual-form">
                    <div className="scan-manual-input-wrap">
                        <HiOutlineSearch className="scan-manual-icon" />
                        <input
                            type="text"
                            placeholder="Ketik kode buku manual (BK-XXXXXX atau ISBN)..."
                            value={manualCode}
                            onChange={e => setManualCode(e.target.value)}
                            className="form-control"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={!manualCode.trim()}>
                        <HiOutlineSearch /> Cari
                    </button>
                </form>
            </div>

            {/* ─── Loading State ─── */}
            {loading && (
                <div className="card scan-loading-card">
                    <div className="scan-loading-content">
                        <div className="spinner" />
                        <p>Mencari data buku...</p>
                    </div>
                </div>
            )}

            {/* ─── Book Result (Peminjaman mode) ─── */}
            {bookData && scanMode === 'peminjaman' && !loading && (
                <div className="scan-result-section fade-in">
                    {/* Book info card */}
                    <div className="card scan-book-card">
                        <div className="scan-book-header">
                            <h3><HiOutlineBookOpen /> Data Buku</h3>
                            <span className={`scan-status-badge ${bookData.is_available ? 'scan-status-available' : 'scan-status-borrowed'}`}>
                                {bookData.is_available ? '🟢 Tersedia' : '🔴 Dipinjam'}
                            </span>
                        </div>
                        <div className="scan-book-body">
                            {bookData.cover_url && (
                                <div className="scan-book-cover">
                                    <img src={bookData.cover_url} alt={bookData.judul} />
                                </div>
                            )}
                            <div className="scan-book-details">
                                <h2 className="scan-book-title">{bookData.judul}</h2>
                                <div className="scan-book-meta">
                                    <div className="scan-meta-item">
                                        <HiOutlineTag size={14} />
                                        <span>Kode: <strong>{bookData.kode_buku || '-'}</strong></span>
                                    </div>
                                    <div className="scan-meta-item">
                                        <HiOutlineTag size={14} />
                                        <span>ISBN: <strong>{bookData.isbn || '-'}</strong></span>
                                    </div>
                                    <div className="scan-meta-item">
                                        <HiOutlineUser size={14} />
                                        <span>Penulis: <strong>{bookData.penulis}</strong></span>
                                    </div>
                                    {bookData.penerbit && (
                                        <div className="scan-meta-item">
                                            <HiOutlineBookOpen size={14} />
                                            <span>Penerbit: <strong>{bookData.penerbit.nama}</strong></span>
                                        </div>
                                    )}
                                    {bookData.category && (
                                        <div className="scan-meta-item">
                                            <HiOutlineTag size={14} />
                                            <span>Kategori: <strong>{bookData.category.nama}</strong></span>
                                        </div>
                                    )}
                                </div>
                                <div className="scan-book-stock">
                                    <div className="scan-stock-item">
                                        <span className="scan-stock-label">Total Stok</span>
                                        <span className="scan-stock-value">{bookData.stok}</span>
                                    </div>
                                    <div className="scan-stock-item">
                                        <span className="scan-stock-label">Tersedia</span>
                                        <span className={`scan-stock-value ${bookData.stok_tersedia > 0 ? 'text-success' : 'text-danger'}`}>
                                            {bookData.stok_tersedia}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Peminjaman form */}
                    {bookData.is_available ? (
                        <div className="card scan-form-card">
                            <h3><HiOutlineUser /> Pilih Peminjam</h3>
                            <div className="scan-form-grid">
                                {/* User search */}
                                <div className="form-group scan-user-search">
                                    <label>Siswa / Guru *</label>
                                    <div className="scan-user-search-wrap">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Cari nama, NIS, atau NIP..."
                                            value={searchUser}
                                            onChange={e => { setSearchUser(e.target.value); setShowUserDropdown(true); }}
                                            onFocus={() => setShowUserDropdown(true)}
                                        />
                                        {showUserDropdown && searchUser && (
                                            <div className="scan-user-dropdown">
                                                {filteredUsers.length === 0 ? (
                                                    <div className="scan-user-dropdown-empty">Tidak ditemukan</div>
                                                ) : (
                                                    filteredUsers.slice(0, 8).map(u => (
                                                        <div
                                                            key={u.id}
                                                            className="scan-user-dropdown-item"
                                                            onClick={() => {
                                                                setSelectedUser(u);
                                                                setSearchUser(u.name);
                                                                setShowUserDropdown(false);
                                                            }}
                                                        >
                                                            <div className="scan-user-dropdown-name">{u.name}</div>
                                                            <div className="scan-user-dropdown-meta">
                                                                <span className={`role-badge role-${u.role}`}>{u.role}</span>
                                                                {u.nis && <span>NIS: {u.nis}</span>}
                                                                {u.nip && <span>NIP: {u.nip}</span>}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {selectedUser && (
                                        <div className="scan-selected-user">
                                            <HiOutlineCheck size={16} />
                                            <span>
                                                <strong>{selectedUser.name}</strong> ({selectedUser.role}
                                                {selectedUser.nis ? ` - ${selectedUser.nis}` : ''}
                                                {selectedUser.nip ? ` - ${selectedUser.nip}` : ''})
                                            </span>
                                            <button onClick={() => { setSelectedUser(null); setSearchUser(''); }}>
                                                <HiOutlineX size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Dates */}
                                <div className="scan-dates-row">
                                    <div className="form-group">
                                        <label><HiOutlineCalendar size={14} /> Tanggal Pinjam</label>
                                        <input type="date" className="form-control" value={tanggalPinjam} onChange={e => setTanggalPinjam(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label><HiOutlineCalendar size={14} /> Tanggal Kembali</label>
                                        <input type="date" className="form-control" value={tanggalKembali} onChange={e => setTanggalKembali(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="scan-form-actions">
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={handlePeminjaman}
                                    disabled={!selectedUser || submitting}
                                >
                                    {submitting ? (
                                        <><div className="spinner spinner-sm" /> Menyimpan...</>
                                    ) : (
                                        <><HiOutlineCheck /> Konfirmasi Peminjaman</>
                                    )}
                                </button>
                                <button className="btn btn-secondary" onClick={() => setBookData(null)}>Batal</button>
                            </div>
                        </div>
                    ) : (
                        <div className="card scan-unavailable-card">
                            <HiOutlineExclamationCircle size={32} />
                            <h3>Buku Tidak Tersedia</h3>
                            <p>Stok buku habis atau sedang dipinjam semua.</p>
                            {bookData.active_borrow && (
                                <div className="scan-active-borrow-info">
                                    <p>Sedang dipinjam oleh: <strong>{bookData.active_borrow.user?.name}</strong></p>
                                    <p>Tanggal pinjam: {new Date(bookData.active_borrow.tanggal_pinjam).toLocaleDateString('id-ID')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ─── Pengembalian Result ─── */}
            {peminjamanData && scanMode === 'pengembalian' && !loading && (
                <div className="scan-result-section fade-in">
                    {peminjamanData.map((item, idx) => (
                        <div key={idx} className="card scan-return-card">
                            <div className="scan-return-header">
                                <h3><HiOutlineRefresh /> Pengembalian Buku</h3>
                                <span className={`scan-status-badge ${item.keterlambatan.terlambat ? 'scan-status-late' : 'scan-status-ontime'}`}>
                                    {item.keterlambatan.terlambat ? `⚠️ Terlambat ${item.keterlambatan.hari} hari` : '✅ Tepat Waktu'}
                                </span>
                            </div>

                            <div className="scan-return-body">
                                {/* Book info */}
                                <div className="scan-return-book">
                                    <h4>{item.peminjaman.book?.judul}</h4>
                                    <span className="badge badge-info" style={{ fontFamily: 'monospace' }}>
                                        {item.peminjaman.kode_peminjaman}
                                    </span>
                                </div>

                                {/* Borrower info */}
                                <div className="scan-return-borrower">
                                    <HiOutlineUser size={16} />
                                    <div>
                                        <strong>{item.peminjaman.user?.name}</strong>
                                        <span className={`role-badge role-${item.peminjaman.user?.role}`} style={{ marginLeft: 8 }}>
                                            {item.peminjaman.user?.role}
                                        </span>
                                        {item.peminjaman.user?.nis && <small> • NIS: {item.peminjaman.user.nis}</small>}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="scan-return-dates">
                                    <div className="scan-return-date-item">
                                        <HiOutlineCalendar size={14} />
                                        <span>Tanggal Pinjam</span>
                                        <strong>{new Date(item.peminjaman.tanggal_pinjam).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                                    </div>
                                    <div className="scan-return-date-item">
                                        <HiOutlineClock size={14} />
                                        <span>Batas Kembali</span>
                                        <strong>{new Date(item.peminjaman.tanggal_kembali_rencana).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                                    </div>
                                </div>

                                {/* Fine calculator */}
                                {item.keterlambatan.terlambat && (
                                    <div className="scan-fine-card">
                                        <div className="scan-fine-header">
                                            <HiOutlineCash size={20} />
                                            <h4>Kalkulasi Denda</h4>
                                        </div>
                                        <div className="scan-fine-details">
                                            <div className="scan-fine-row">
                                                <span>Keterlambatan</span>
                                                <strong>{item.keterlambatan.hari} hari</strong>
                                            </div>
                                            <div className="scan-fine-row">
                                                <span>Denda per hari</span>
                                                <strong>{item.keterlambatan.denda_per_hari_formatted}</strong>
                                            </div>
                                            <div className="scan-fine-total">
                                                <span>Total Denda</span>
                                                <strong>{item.keterlambatan.denda_formatted}</strong>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action */}
                            <div className="scan-return-actions">
                                <button
                                    className="btn btn-success btn-lg"
                                    onClick={() => handlePengembalian(item.peminjaman.id)}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <><div className="spinner spinner-sm" /> Memproses...</>
                                    ) : (
                                        <><HiOutlineCheck /> Konfirmasi Pengembalian</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── Scan History ─── */}
            {scanHistory.length > 0 && (
                <div className="card scan-history-card">
                    <h3><HiOutlineClock /> Riwayat Scan</h3>
                    <div className="scan-history-list">
                        {scanHistory.map((item, idx) => (
                            <div key={idx} className={`scan-history-item ${item.success ? 'success' : 'error'}`}>
                                <div className="scan-history-icon">
                                    {item.success ? '✅' : '❌'}
                                </div>
                                <div className="scan-history-info">
                                    <span className="scan-history-code">{item.kode}</span>
                                    <span className="scan-history-mode">{item.mode === 'peminjaman' ? 'Peminjaman' : 'Pengembalian'}</span>
                                </div>
                                <span className="scan-history-time">{item.timestamp}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Empty state ─── */}
            {!loading && !bookData && !peminjamanData && scanHistory.length === 0 && (
                <div className="card scan-empty-state">
                    <div className="scan-empty-icon">📷</div>
                    <h3>Siap Memindai</h3>
                    <p>Pilih mode scan di atas untuk memulai peminjaman atau pengembalian buku.</p>
                    <div className="scan-empty-steps">
                        <div className="scan-empty-step">
                            <span className="scan-step-number">1</span>
                            <span>Klik tombol scan</span>
                        </div>
                        <div className="scan-empty-step">
                            <span className="scan-step-number">2</span>
                            <span>Arahkan ke barcode</span>
                        </div>
                        <div className="scan-empty-step">
                            <span className="scan-step-number">3</span>
                            <span>Konfirmasi & simpan</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Barcode Scanner Modal ─── */}
            <BarcodeScanner
                isOpen={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScan={handleScan}
                mode={scanMode}
            />
        </div>
    );
}
