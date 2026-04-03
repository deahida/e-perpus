import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext.jsx';
import {
    HiOutlineMail,
    HiOutlineLockClosed,
    HiOutlineSun,
    HiOutlineMoon,
    HiOutlineArrowLeft,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import logoImg from '../../img/logo.png';

const roleConfig = {
    admin: {
        title: 'Login Admin',
        subtitle: 'Masuk sebagai Administrator',
        className: 'role-login--admin',
        gradient: 'linear-gradient(135deg, #1e3a5f 0%, #1e1b4b 50%, #0f172a 100%)',
        lightGradient: 'linear-gradient(135deg, #dbeafe 0%, #c7d2fe 50%, #e0e7ff 100%)',
    },
    guru: {
        title: 'Login Guru',
        subtitle: 'Masuk sebagai Pengajar',
        className: 'role-login--guru',
        gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)',
        lightGradient: 'linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 50%, #ede9fe 100%)',
    },
    siswa: {
        title: 'Login Siswa',
        subtitle: 'Masuk sebagai Pelajar',
        className: 'role-login--siswa',
        gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e1b4b 100%)',
        lightGradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #f8fafc 100%)',
    },
};

export default function LoginRole({ role = 'admin' }) {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);

    const config = roleConfig[role] || roleConfig.admin;

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userData = await login(email, password);
            // Validate the user has the correct role
            if (role !== 'admin' && userData.role !== role) {
                toast.error(`Akun ini bukan akun ${role}. Silakan gunakan login yang sesuai.`);
                // logout silently
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.reload();
                return;
            }
            toast.success('Login berhasil!');
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.email?.[0] ||
                'Login gagal!';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const bgStyle = {
        background: theme === 'dark' ? config.gradient : config.lightGradient,
    };

    return (
        <div className={`login-page role-login ${config.className}`} style={bgStyle}>
            {/* Animated background orbs */}
            <div className="welcome-orb welcome-orb-1" />
            <div className="welcome-orb welcome-orb-2" />

            {/* Theme toggle */}
            <button
                className="theme-toggle login-theme-toggle"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            >
                {theme === 'dark' ? <HiOutlineSun /> : <HiOutlineMoon />}
            </button>

            <div className={`login-card role-login-card ${visible ? 'welcome-card--visible' : ''}`}>
                {/* Back button */}
                <button
                    className="role-login-back"
                    onClick={() => navigate('/auth')}
                    title="Kembali"
                >
                    <HiOutlineArrowLeft />
                    <span>Kembali</span>
                </button>

                {/* Logo */}
                <div className="welcome-logo" style={{ marginTop: 8 }}>
                    <div className="welcome-logo-inner">
                        <img src={logoImg} alt="Logo e-Perpus" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    </div>
                    <div className="welcome-logo-ring" />
                </div>

                <h1>{config.title}</h1>
                <p className="subtitle">{config.subtitle}</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>
                            <HiOutlineMail style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            Email
                        </label>
                        <input
                            id={`login-email-${role}`}
                            type="email"
                            className="form-control"
                            placeholder="Masukkan email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>
                            <HiOutlineLockClosed style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            Password
                        </label>
                        <input
                            id={`login-password-${role}`}
                            type="password"
                            className="form-control"
                            placeholder="Masukkan password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        id={`login-submit-${role}`}
                        type="submit"
                        className={`btn btn-primary btn-block btn-lg role-submit--${role}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                Memproses...
                            </>
                        ) : (
                            `Masuk sebagai ${role.charAt(0).toUpperCase() + role.slice(1)}`
                        )}
                    </button>
                </form>

                {/* Footer */}
                <footer className="welcome-footer" style={{ marginTop: 28 }}>
                    <p>© 2026 e-Perpus</p>
                    <p>Created by Deaxel</p>
                </footer>
            </div>
        </div>
    );
}
