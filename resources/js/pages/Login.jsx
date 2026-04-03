import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { HiOutlineBookOpen, HiOutlineMail, HiOutlineLockClosed, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
import toast from 'react-hot-toast';
import logoImg from '../../img/logo.png';

export default function Login() {
    const { login } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Login berhasil!');
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Login gagal!';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <button className="theme-toggle login-theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}>
                {theme === 'dark' ? <HiOutlineSun /> : <HiOutlineMoon />}
            </button>
            <div className="login-card">
                <div className="login-icon">
                    <img src={logoImg} alt="Logo SMK NU AL-HIDAYAH" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                </div>
                <h1>SMK NU AL-HIDAYAH</h1>
                <p className="subtitle">Masuk ke sistem untuk mengelola perpustakaan</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label><HiOutlineMail style={{ verticalAlign: 'middle', marginRight: 6 }} />Email</label>
                        <input
                            id="login-email"
                            type="email"
                            className="form-control"
                            placeholder="Masukkan email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label><HiOutlineLockClosed style={{ verticalAlign: 'middle', marginRight: 6 }} />Password</label>
                        <input
                            id="login-password"
                            type="password"
                            className="form-control"
                            placeholder="Masukkan password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button id="login-submit" type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                        {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> Memproses...</> : 'Masuk'}
                    </button>
                </form>
            </div>
        </div>
    );
}
