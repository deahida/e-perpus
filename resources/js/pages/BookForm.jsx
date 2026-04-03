import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    HiOutlineArrowLeft, HiOutlinePhotograph, HiOutlineUpload,
    HiOutlineTrash, HiOutlineBookOpen, HiOutlineSave, HiOutlineX
} from 'react-icons/hi';

export default function BookForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const isEditing = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [penerbitList, setPenerbitList] = useState([]);
    const [rakList, setRakList] = useState([]);
    const [coverPreview, setCoverPreview] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [form, setForm] = useState({
        judul: '',
        isbn: '',
        penulis: '',
        penerbit_id: '',
        category_id: '',
        rak_id: '',
        tahun_terbit: '',
        stok: '',
        deskripsi: '',
        bahasa: 'Indonesia',
        jumlah_halaman: '',
        is_active: true,
    });

    // Fetch dropdown data
    useEffect(() => {
        Promise.all([
            api.get('/categories', { params: { per_page: 100 } }),
            api.get('/penerbit', { params: { per_page: 100 } }),
            api.get('/rak-buku', { params: { per_page: 100 } }),
        ]).then(([c, p, r]) => {
            setCategories(c.data.data.data || []);
            setPenerbitList(p.data.data.data || []);
            setRakList(r.data.data.data || []);
        });
    }, []);

    // Fetch book data if editing
    useEffect(() => {
        if (isEditing) {
            setLoading(true);
            api.get(`/books/${id}`)
                .then(res => {
                    const book = res.data.data;
                    setForm({
                        judul: book.judul || '',
                        isbn: book.isbn || '',
                        penulis: book.penulis || '',
                        penerbit_id: book.penerbit_id || '',
                        category_id: book.category_id || '',
                        rak_id: book.rak_id || '',
                        tahun_terbit: book.tahun_terbit || '',
                        stok: book.stok || '',
                        deskripsi: book.deskripsi || '',
                        bahasa: book.bahasa || 'Indonesia',
                        jumlah_halaman: book.jumlah_halaman || '',
                        is_active: book.is_active !== undefined ? book.is_active : true,
                    });
                    if (book.cover) {
                        setCoverPreview(`/storage/${book.cover}`);
                    }
                })
                .catch(() => {
                    toast.error('Gagal memuat data buku');
                    navigate('/books');
                })
                .finally(() => setLoading(false));
        }
    }, [id, isEditing, navigate]);

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Ukuran file maksimal 2MB');
                return;
            }
            setCoverFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setCoverPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const removeCover = () => {
        setCoverFile(null);
        setCoverPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const formData = new FormData();
            Object.keys(form).forEach(key => {
                if (form[key] !== '' && form[key] !== null && form[key] !== undefined) {
                    // FormData converts booleans to "true"/"false" strings,
                    // but MySQL expects 1/0 for tinyint columns
                    const value = key === 'is_active' ? (form[key] ? 1 : 0) : form[key];
                    formData.append(key, value);
                }
            });
            if (coverFile) {
                formData.append('cover', coverFile);
            }

            if (isEditing) {
                formData.append('_method', 'PUT');
                await api.post(`/books/${id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Buku berhasil diperbarui');
            } else {
                await api.post('/books', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Buku berhasil ditambahkan');
            }
            navigate('/books');
        } catch (err) {
            const msg = err.response?.data?.message || 'Gagal menyimpan buku';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fade-in">
                <div className="loading-spinner"><div className="spinner"></div> Memuat data buku...</div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            {/* Breadcrumb */}
            <div className="book-form-breadcrumb">
                <Link to="/dashboard" className="breadcrumb-link">
                    <HiOutlineBookOpen />
                    Dashboard
                </Link>
                <span className="breadcrumb-sep">›</span>
                <Link to="/books" className="breadcrumb-link">Data Buku</Link>
                <span className="breadcrumb-sep">›</span>
                <span className="breadcrumb-current">{isEditing ? 'Edit' : 'Baru'}</span>
            </div>

            {/* Header */}
            <div className="book-form-header">
                <div className="book-form-header-left">
                    <div className="book-form-subtitle">BOOK STUDIO</div>
                    <h1 className="book-form-title">
                        {isEditing ? 'Edit Buku' : 'Tambah Buku Baru'}
                    </h1>
                    <p className="book-form-desc">
                        Form ini sudah mendukung quick-create kategori, penerbit, dan rak langsung dari field pilihan.
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/books')}>
                    <HiOutlineArrowLeft /> Kembali
                </button>
            </div>

            {/* Main Form Card */}
            <form onSubmit={handleSubmit}>
                <div className="book-form-layout">
                    {/* Left Column - Cover */}
                    <div className="book-form-left">
                        <div className="book-form-card">
                            <div className="book-cover-section">
                                <h3 className="book-section-label">Cover Buku</h3>
                                <p className="book-section-desc">
                                    Upload gambar cover agar katalog lebih menarik.
                                </p>

                                <div className="cover-preview-label">Preview Cover</div>

                                <div
                                    className="cover-upload-area"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {coverPreview ? (
                                        <div className="cover-preview-wrapper">
                                            <img
                                                src={coverPreview}
                                                alt="Preview cover"
                                                className="cover-preview-image"
                                            />
                                            <div className="cover-preview-overlay">
                                                <HiOutlinePhotograph />
                                                <span>Ganti Cover</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="cover-placeholder">
                                            <div className="cover-placeholder-icon">
                                                <HiOutlineUpload />
                                            </div>
                                            <p className="cover-placeholder-text">
                                                Klik untuk upload cover
                                            </p>
                                            <p className="cover-placeholder-hint">
                                                JPG, JPEG, PNG · Maks 2MB
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={handleCoverChange}
                                    hidden
                                />

                                {coverPreview && (
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm cover-remove-btn"
                                        onClick={removeCover}
                                    >
                                        <HiOutlineTrash /> Hapus Cover
                                    </button>
                                )}

                                {/* Status */}
                                <div className="book-status-section">
                                    <div className="book-status-label">Status</div>
                                    <div className="book-status-toggle">
                                        <label className="status-switch">
                                            <input
                                                type="checkbox"
                                                checked={form.is_active}
                                                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                            />
                                            <span className="status-slider"></span>
                                        </label>
                                        <span className={`status-text ${form.is_active ? 'active' : 'inactive'}`}>
                                            {form.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Form Fields */}
                    <div className="book-form-right">
                        <div className="book-form-card">
                            <div className="book-fields-section">
                                {/* Judul */}
                                <div className="form-group">
                                    <label>
                                        Judul Buku <span className="required">*</span>
                                    </label>
                                    <input
                                        className="form-control"
                                        placeholder="Masukkan judul buku"
                                        value={form.judul}
                                        onChange={e => setForm({ ...form, judul: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* Kategori */}
                                <div className="form-group">
                                    <label>Kategori</label>
                                    <select
                                        className="form-control"
                                        value={form.category_id}
                                        onChange={e => setForm({ ...form, category_id: e.target.value })}
                                    >
                                        <option value="">-- Pilih Kategori --</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.nama_kategori}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Penulis */}
                                <div className="form-group">
                                    <label>
                                        Penulis <span className="required">*</span>
                                    </label>
                                    <input
                                        className="form-control"
                                        placeholder="Nama Penulis"
                                        value={form.penulis}
                                        onChange={e => setForm({ ...form, penulis: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* Penerbit */}
                                <div className="form-group">
                                    <label>Penerbit</label>
                                    <select
                                        className="form-control"
                                        value={form.penerbit_id}
                                        onChange={e => setForm({ ...form, penerbit_id: e.target.value })}
                                    >
                                        <option value="">-- Pilih Penerbit --</option>
                                        {penerbitList.map(p => (
                                            <option key={p.id} value={p.id}>{p.nama_penerbit}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Row 2 cols: ISBN & Tahun Terbit */}
                                <div className="form-row-2">
                                    <div className="form-group">
                                        <label>ISBN</label>
                                        <input
                                            className="form-control"
                                            placeholder="Nomor ISBN"
                                            value={form.isbn}
                                            onChange={e => setForm({ ...form, isbn: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Tahun Terbit</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder={`Contoh: ${new Date().getFullYear()}`}
                                            value={form.tahun_terbit}
                                            onChange={e => setForm({ ...form, tahun_terbit: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Row 2 cols: Rak & Stok */}
                                <div className="form-row-2">
                                    <div className="form-group">
                                        <label>Rak Buku</label>
                                        <select
                                            className="form-control"
                                            value={form.rak_id}
                                            onChange={e => setForm({ ...form, rak_id: e.target.value })}
                                        >
                                            <option value="">-- Pilih Rak --</option>
                                            {rakList.map(r => (
                                                <option key={r.id} value={r.id}>{r.kode_rak} - {r.nama_rak}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            Stok {!isEditing && <span className="required">*</span>}
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="0"
                                            value={form.stok}
                                            onChange={e => setForm({ ...form, stok: e.target.value })}
                                            required={!isEditing}
                                            min="0"
                                        />
                                    </div>
                                </div>

                                {/* Row 2 cols: Bahasa & Halaman */}
                                <div className="form-row-2">
                                    <div className="form-group">
                                        <label>Bahasa</label>
                                        <select
                                            className="form-control"
                                            value={form.bahasa}
                                            onChange={e => setForm({ ...form, bahasa: e.target.value })}
                                        >
                                            <option value="Indonesia">Indonesia</option>
                                            <option value="Inggris">Inggris</option>
                                            <option value="Arab">Arab</option>
                                            <option value="Jawa">Jawa</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Jumlah Halaman</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="0"
                                            value={form.jumlah_halaman}
                                            onChange={e => setForm({ ...form, jumlah_halaman: e.target.value })}
                                            min="1"
                                        />
                                    </div>
                                </div>

                                {/* Sinopsis / Deskripsi */}
                                <div className="form-group">
                                    <label>Deskripsi</label>
                                    <div className="sinopsis-toolbar">
                                        <button type="button" className="sinopsis-btn" title="Sans Serif">Sans Serif</button>
                                        <button type="button" className="sinopsis-btn" title="Normal">Normal</button>
                                        <button type="button" className="sinopsis-btn" title="Bold"><strong>B</strong></button>
                                        <button type="button" className="sinopsis-btn" title="Italic"><em>I</em></button>
                                    </div>
                                    <textarea
                                        className="form-control sinopsis-textarea"
                                        value={form.deskripsi}
                                        onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                                        rows={5}
                                        placeholder="Tulis sinopsis buku..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="book-form-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate('/books')}
                    >
                        <HiOutlineX /> Batal
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={saving}
                    >
                        <HiOutlineSave />
                        {saving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Tambah Buku')}
                    </button>
                </div>
            </form>
        </div>
    );
}
