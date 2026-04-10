import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext.jsx';
import {
    HiOutlineSun,
    HiOutlineMoon,
    HiOutlineArrowRight,
} from 'react-icons/hi';
import logoImg from '../../img/logo.png';
import logoadmin from '../../img/iconadmin.png';
import logoguru from '../../img/iconguru.png';
import logosiswa from '../../img/iconsiswa.png';

export default function WelcomePage() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const loginOptions = [
        {
            role: 'admin',
            label: 'Login Admin',
            icon: <img src={logoadmin} alt="Icon Admin" className="welcome-btn-icon-img" />,
            path: '/login/admin',
            className: 'welcome-btn-admin',
        },
        {
            role: 'guru',
            label: 'Login Guru',
            icon: <img src={logoguru} alt="Icon Guru" className="welcome-btn-icon-img" />,
            path: '/login/guru',
            className: 'welcome-btn-guru',
        },
        {
            role: 'siswa',
            label: 'Login Siswa',
            icon: <img src={logosiswa} alt="Icon Siswa" className="welcome-btn-icon-img" />,
            path: '/login/siswa',
            className: 'welcome-btn-siswa',
        },
    ];

    return (
        <div className="welcome-page">
            {/* Animated background orbs */}
            <div className="welcome-orb welcome-orb-1" />
            <div className="welcome-orb welcome-orb-2" />
            <div className="welcome-orb welcome-orb-3" />

            {/* Theme toggle */}
            <button
                className="theme-toggle login-theme-toggle"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            >
                {theme === 'dark' ? <HiOutlineSun /> : <HiOutlineMoon />}
            </button>

            <div className={`welcome-card ${visible ? 'welcome-card--visible' : ''}`}>
                {/* Logo */}
                <div className="welcome-logo">
                    <div className="welcome-logo-inner">
                        <img src={logoImg} alt="Logo e-Perpus" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    </div>
                    <div className="welcome-logo-ring" />
                </div>

                {/* Title */}
                <h1 className="welcome-title">Selamat Datang di e-Perpus</h1>
                <p className="welcome-school">SMK NU Al-Hidayah</p>
                <p className="welcome-subtitle">Silakan pilih jenis login Anda</p>

                {/* Divider */}
                <div className="welcome-divider">
                    <span />
                    <div className="welcome-divider-dot" />
                    <span />
                </div>

                {/* Login buttons */}
                <div className="welcome-buttons">
                    {loginOptions.map((opt, idx) => (
                        <button
                            key={opt.role}
                            id={`welcome-btn-${opt.role}`}
                            className={`welcome-btn ${opt.className}`}
                            onClick={() => navigate(opt.path)}
                            style={{ animationDelay: `${0.3 + idx * 0.12}s` }}
                        >
                            <span className="welcome-btn-icon">{opt.icon}</span>
                            <span className="welcome-btn-text">
                                <span className="welcome-btn-label">{opt.label}</span>
                            </span>
                            <HiOutlineArrowRight className="welcome-btn-arrow" />
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <footer className="welcome-footer">
                    <p>© 2026 e-Perpus</p>
                    <p>Created by Deaxel</p>
                </footer>
            </div>
        </div>
    );
}
