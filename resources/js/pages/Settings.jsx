import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Settings() {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/settings')
            .then(res => {
                const flat = {};
                const groups = res.data.data;
                Object.values(groups).forEach(arr => {
                    arr.forEach(s => { flat[s.key] = s.value || ''; });
                });
                setSettings(flat);
            })
            .catch(() => toast.error('Gagal memuat pengaturan'))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const payload = Object.entries(settings).map(([key, value]) => ({ key, value }));
        try {
            await api.put('/settings', { settings: payload });
            toast.success('Pengaturan disimpan');
        } catch { toast.error('Gagal menyimpan'); }
        finally { setSaving(false); }
    };

    const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    return (
        <div className="fade-in">
            <div className="grid-2">
                <div className="card">
                    <div className="card-header"><h2>🏫 Informasi Sekolah</h2></div>
                    <div className="card-body">
                        <div className="form-group">
                            <label>Nama Sekolah</label>
                            <input className="form-control" value={settings.nama_sekolah || ''} onChange={e => updateSetting('nama_sekolah', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Alamat Sekolah</label>
                            <textarea className="form-control" value={settings.alamat_sekolah || ''} onChange={e => updateSetting('alamat_sekolah', e.target.value)} rows={2} />
                        </div>
                        <div className="form-group">
                            <label>Telepon Sekolah</label>
                            <input className="form-control" value={settings.telepon_sekolah || ''} onChange={e => updateSetting('telepon_sekolah', e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h2>📖 Aturan Peminjaman</h2></div>
                    <div className="card-body">
                        <div className="form-group">
                            <label>Maks. Peminjaman per Siswa</label>
                            <input type="number" className="form-control" value={settings.max_peminjaman || ''} onChange={e => updateSetting('max_peminjaman', e.target.value)} min="1" />
                        </div>
                        <div className="form-group">
                            <label>Lama Peminjaman (hari)</label>
                            <input type="number" className="form-control" value={settings.lama_peminjaman || ''} onChange={e => updateSetting('lama_peminjaman', e.target.value)} min="1" />
                        </div>
                        <div className="form-group">
                            <label>Denda per Hari (Rp)</label>
                            <input type="number" className="form-control" value={settings.denda_per_hari || ''} onChange={e => updateSetting('denda_per_hari', e.target.value)} min="0" />
                        </div>
                        <div className="form-group">
                            <label>Maks. Perpanjangan</label>
                            <input type="number" className="form-control" value={settings.max_perpanjangan || ''} onChange={e => updateSetting('max_perpanjangan', e.target.value)} min="0" />
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
                    {saving ? 'Menyimpan...' : '💾 Simpan Pengaturan'}
                </button>
            </div>
        </div>
    );
}
