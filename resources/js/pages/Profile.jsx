import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    HiOutlineUser, HiOutlineMail, HiOutlinePhone,
    HiOutlineLocationMarker, HiOutlineCamera, HiOutlineLockClosed,
    HiOutlineShieldCheck, HiOutlineAcademicCap, HiOutlineIdentification,
    HiOutlineSave, HiOutlineKey,
} from 'react-icons/hi';

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
    const [passForm, setPassForm] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [saving, setSaving] = useState(false);
    const [changingPass, setChangingPass] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    const getAvatarUrl = () => {
        if (avatarPreview) return avatarPreview;
        if (user?.avatar) {
            if (user.avatar.startsWith('http')) return user.avatar;
            return `/storage/${user.avatar}`;
        }
        return null;
    };

    const handleAvatarSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
            toast.error('Format file harus JPG atau PNG');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Ukuran file maksimal 2MB');
            return;
        }

        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile) return;
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('avatar', avatarFile);
            formData.append('name', user?.name || '');
            const res = await api.post('/profile', formData, {
                headers: { 'Content-Type': undefined },
            });
            updateUser(res.data.data);
            setAvatarFile(null);
            setAvatarPreview(null);
            toast.success('Foto profil berhasil diperbarui');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal mengunggah foto');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.post('/profile', profileForm);
            updateUser(res.data.data);
            toast.success('Profil berhasil diperbarui');
        } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
        finally { setSaving(false); }
    };

    const handlePassword = async (e) => {
        e.preventDefault();
        if (passForm.password !== passForm.password_confirmation) { toast.error('Konfirmasi password tidak cocok'); return; }
        setChangingPass(true);
        try {
            await api.post('/change-password', passForm);
            toast.success('Password berhasil diubah');
            setPassForm({ current_password: '', password: '', password_confirmation: '' });
        } catch (err) { toast.error(err.response?.data?.errors?.current_password?.[0] || err.response?.data?.message || 'Gagal'); }
        finally { setChangingPass(false); }
    };

    const getRoleName = (role) => {
        const map = { admin: 'Administrator', guru: 'Guru', siswa: 'Siswa' };
        return map[role] || role;
    };

    return (
        <div className="fade-in profile-page">
            {/* ─── Hero / Avatar Section ──────────────────── */}
            <div className="profile-hero">
                <div className="profile-hero-bg" />
                <div className="profile-hero-content">
                    <div className="profile-avatar-wrapper">
                        <div className="profile-avatar-lg">
                            {getAvatarUrl() ? (
                                <img src={getAvatarUrl()} alt={user?.name} />
                            ) : (
                                <span className="profile-avatar-letter">
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <button
                            className="profile-avatar-edit"
                            onClick={() => fileInputRef.current?.click()}
                            title="Ganti Foto"
                        >
                            <HiOutlineCamera />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={handleAvatarSelect}
                            style={{ display: 'none' }}
                        />
                    </div>
                    <div className="profile-hero-info">
                        <h1 className="profile-hero-name">{user?.name}</h1>
                        <span className={`profile-role-badge role-${user?.role}`}>
                            <HiOutlineShieldCheck /> {getRoleName(user?.role)}
                        </span>
                        <p className="profile-hero-email">{user?.email}</p>
                    </div>
                </div>

                {/* Avatar save button */}
                {avatarFile && (
                    <div className="profile-avatar-actions">
                        <button
                            className="btn btn-sm profile-btn-save-avatar"
                            onClick={handleAvatarUpload}
                            disabled={uploadingAvatar}
                        >
                            {uploadingAvatar ? (
                                <><div className="spinner spinner--sm"></div> Mengunggah...</>
                            ) : (
                                <><HiOutlineSave /> Simpan Foto</>
                            )}
                        </button>
                        <button
                            className="btn btn-sm profile-btn-cancel-avatar"
                            onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                        >
                            Batal
                        </button>
                    </div>
                )}
            </div>

            {/* ─── Info Cards Row ─────────────────────────── */}
            <div className="profile-info-cards">
                {user?.nis && (
                    <div className="profile-info-chip">
                        <HiOutlineIdentification />
                        <div>
                            <span className="profile-chip-label">NIS</span>
                            <span className="profile-chip-value">{user.nis}</span>
                        </div>
                    </div>
                )}
                {user?.nip && (
                    <div className="profile-info-chip">
                        <HiOutlineIdentification />
                        <div>
                            <span className="profile-chip-label">NIP</span>
                            <span className="profile-chip-value">{user.nip}</span>
                        </div>
                    </div>
                )}
                {user?.kelas && (
                    <div className="profile-info-chip">
                        <HiOutlineAcademicCap />
                        <div>
                            <span className="profile-chip-label">Kelas</span>
                            <span className="profile-chip-value">{user.kelas.nama_kelas}</span>
                        </div>
                    </div>
                )}
                {user?.phone && (
                    <div className="profile-info-chip">
                        <HiOutlinePhone />
                        <div>
                            <span className="profile-chip-label">Telepon</span>
                            <span className="profile-chip-value">{user.phone}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Main Content ───────────────────────────── */}
            <div className="profile-grid">
                {/* ─── Edit Profile Card ─────────────────── */}
                <div className="profile-card">
                    <div className="profile-card-header">
                        <div className="profile-card-icon profile-card-icon--primary">
                            <HiOutlineUser />
                        </div>
                        <div>
                            <h2 className="profile-card-title">Informasi Pribadi</h2>
                            <p className="profile-card-subtitle">Perbarui data profil Anda</p>
                        </div>
                    </div>
                    <form onSubmit={handleProfile} className="profile-form">
                        <div className="profile-form-group">
                            <label className="profile-label">
                                <HiOutlineUser /> Nama Lengkap
                            </label>
                            <input
                                className="profile-input"
                                value={profileForm.name}
                                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                placeholder="Masukkan nama lengkap"
                                required
                            />
                        </div>
                        <div className="profile-form-group">
                            <label className="profile-label">
                                <HiOutlineMail /> Email
                            </label>
                            <input
                                className="profile-input profile-input--disabled"
                                value={user?.email || ''}
                                disabled
                            />
                            <span className="profile-input-hint">Email tidak dapat diubah</span>
                        </div>
                        <div className="profile-form-group">
                            <label className="profile-label">
                                <HiOutlinePhone /> Nomor Telepon
                            </label>
                            <input
                                className="profile-input"
                                value={profileForm.phone}
                                onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                                placeholder="Contoh: 08123456789"
                            />
                        </div>
                        <div className="profile-form-group">
                            <label className="profile-label">
                                <HiOutlineLocationMarker /> Alamat
                            </label>
                            <textarea
                                className="profile-input profile-textarea"
                                value={profileForm.address}
                                onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                                placeholder="Masukkan alamat lengkap"
                                rows={3}
                            />
                        </div>
                        <button type="submit" className="btn profile-btn-save" disabled={saving}>
                            {saving ? (
                                <><div className="spinner spinner--sm"></div> Menyimpan...</>
                            ) : (
                                <><HiOutlineSave /> Simpan Perubahan</>
                            )}
                        </button>
                    </form>
                </div>

                {/* ─── Change Password Card ───────────────── */}
                <div className="profile-card">
                    <div className="profile-card-header">
                        <div className="profile-card-icon profile-card-icon--warning">
                            <HiOutlineLockClosed />
                        </div>
                        <div>
                            <h2 className="profile-card-title">Keamanan Akun</h2>
                            <p className="profile-card-subtitle">Ubah password untuk keamanan</p>
                        </div>
                    </div>
                    <form onSubmit={handlePassword} className="profile-form">
                        <div className="profile-form-group">
                            <label className="profile-label">
                                <HiOutlineKey /> Password Saat Ini
                            </label>
                            <input
                                type="password"
                                className="profile-input"
                                value={passForm.current_password}
                                onChange={e => setPassForm({ ...passForm, current_password: e.target.value })}
                                placeholder="Masukkan password saat ini"
                                required
                            />
                        </div>
                        <div className="profile-form-group">
                            <label className="profile-label">
                                <HiOutlineLockClosed /> Password Baru
                            </label>
                            <input
                                type="password"
                                className="profile-input"
                                value={passForm.password}
                                onChange={e => setPassForm({ ...passForm, password: e.target.value })}
                                placeholder="Minimal 8 karakter"
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="profile-form-group">
                            <label className="profile-label">
                                <HiOutlineShieldCheck /> Konfirmasi Password
                            </label>
                            <input
                                type="password"
                                className="profile-input"
                                value={passForm.password_confirmation}
                                onChange={e => setPassForm({ ...passForm, password_confirmation: e.target.value })}
                                placeholder="Ulangi password baru"
                                required
                            />
                        </div>
                        <button type="submit" className="btn profile-btn-password" disabled={changingPass}>
                            {changingPass ? (
                                <><div className="spinner spinner--sm"></div> Menyimpan...</>
                            ) : (
                                <><HiOutlineLockClosed /> Ubah Password</>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
