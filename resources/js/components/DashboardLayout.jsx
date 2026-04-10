import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
    HiOutlineViewGrid, HiOutlineBookOpen, HiOutlineCollection,
    HiOutlineArchive, HiOutlineOfficeBuilding, HiOutlineClipboardList,
    HiOutlineShieldCheck, HiOutlineUsers, HiOutlineUserGroup,
    HiOutlineAcademicCap, HiOutlineCog, HiOutlineUser,
    HiOutlineLogout, HiOutlineMenu, HiOutlineX,
    HiOutlineBell, HiOutlineChartBar, HiOutlineStar,
} from 'react-icons/hi';
import logoImg from '../../img/logo.png';

const menuItems = {
    admin: [
        {
            section: 'Menu Utama', items: [
                { path: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
            ]
        },
        {
            section: 'Manajemen Buku', items: [
                { path: '/books', icon: HiOutlineBookOpen, label: 'Data Buku' },
                { path: '/categories', icon: HiOutlineCollection, label: 'Kategori' },
                { path: '/rak-buku', icon: HiOutlineArchive, label: 'Rak Buku' },
                { path: '/penerbit', icon: HiOutlineOfficeBuilding, label: 'Penerbit' },
            ]
        },
        {
            section: 'Sirkulasi', items: [
                { path: '/peminjaman', icon: HiOutlineClipboardList, label: 'Peminjaman' },
                { path: '/checkpoints', icon: HiOutlineShieldCheck, label: 'Checkpoint' },
            ]
        },
        {
            section: 'Pengguna', items: [
                { path: '/users', icon: HiOutlineUsers, label: 'Data Pengguna' },
                { path: '/kelas', icon: HiOutlineAcademicCap, label: 'Data Kelas' },
            ]
        },
        {
            section: 'Pengaturan', items: [
                { path: '/profile', icon: HiOutlineUser, label: 'Profil' },
                { path: '/settings', icon: HiOutlineCog, label: 'Pengaturan' },
            ]
        },
    ],
    guru: [
        {
            section: 'Menu Utama', items: [
                { path: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
            ]
        },
        {
            section: 'Sirkulasi', items: [
                { path: '/peminjaman', icon: HiOutlineClipboardList, label: 'Data Peminjam' },
                { path: '/checkpoints', icon: HiOutlineShieldCheck, label: 'Checkpoint' },
            ]
        },
        {
            section: 'Perpustakaan', items: [
                { path: '/buku-populer', icon: HiOutlineStar, label: 'Buku' },
                { path: '/peminjaman-saya', icon: HiOutlineBookOpen, label: 'Peminjaman Saya' },
            ]
        },
        {
            section: 'Pengaturan', items: [
                { path: '/profile', icon: HiOutlineUser, label: 'Profil' },
            ]
        },
    ],
    siswa: [
        {
            section: 'Menu Utama', items: [
                { path: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
            ]
        },
        {
            section: 'Perpustakaan', items: [
                { path: '/buku-populer', icon: HiOutlineStar, label: 'Buku Populer' },
                { path: '/peminjaman-saya', icon: HiOutlineClipboardList, label: 'Peminjaman Saya' },
            ]
        },
        {
            section: 'Pengaturan', items: [
                { path: '/profile', icon: HiOutlineUser, label: 'Profil' },
            ]
        },
    ],
};

const pageTitles = {
    '/dashboard': 'Dashboard',
    '/books': 'Data Buku',
    '/books/create': 'Tambah Buku',
    '/categories': 'Kategori Buku',
    '/rak-buku': 'Rak Buku',
    '/penerbit': 'Penerbit',
    '/peminjaman': 'Peminjaman',

    '/checkpoints': 'Checkpoint',
    '/users': 'Data Pengguna',
    '/kelas': 'Data Kelas',
    '/profile': 'Profil',
    '/settings': 'Pengaturan Sistem',
    '/peminjaman-saya': 'Peminjaman Saya',
    '/buku-populer': 'Buku Populer',
};

const getPageTitle = (pathname) => {
    if (pageTitles[pathname]) return pageTitles[pathname];
    if (pathname.match(/^\/books\/\d+\/edit$/)) return 'Edit Buku';
    return 'Dashboard';
};

const roleBadgeConfig = {
    admin: { label: 'ADMIN', className: 'role-admin' },
    guru: { label: 'GURU', className: 'role-guru' },
    siswa: { label: 'SISWA', className: 'role-siswa' },
};

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifCount, setNotifCount] = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const menu = menuItems[user?.role] || menuItems.siswa;
    const pageTitle = getPageTitle(location.pathname);
    const badgeConfig = roleBadgeConfig[user?.role] || roleBadgeConfig.siswa;

    // Fetch notification count
    useEffect(() => {
        if (!user) return;
        api.get('/dashboard')
            .then(res => {
                const data = res.data.data;
                if (user.role === 'siswa') {
                    const notifs = data.notifications || [];
                    setNotifCount(notifs.length);
                    setNotifications(notifs);
                } else if (user.role === 'guru') {
                    const terlambat = data.notifikasi_terlambat || [];
                    const jatuhTempo = data.jatuh_tempo_hari_ini || [];
                    const allNotifs = [
                        ...terlambat.map(n => ({
                            type: 'overdue',
                            message: `${n.user?.name} terlambat mengembalikan "${n.book?.judul}"`,
                            severity: 'danger',
                        })),
                        ...jatuhTempo.map(n => ({
                            type: 'due_today',
                            message: `${n.user?.name} harus kembalikan "${n.book?.judul}" hari ini`,
                            severity: 'warning',
                        })),
                    ];
                    setNotifCount(allNotifs.length);
                    setNotifications(allNotifs);
                } else {
                    const terlambat = data.notifikasi_terlambat || [];
                    setNotifCount(terlambat.length);
                    setNotifications(terlambat.map(n => ({
                        type: 'overdue',
                        message: `${n.user?.name} terlambat: "${n.book?.judul}"`,
                        severity: 'danger',
                    })));
                }
            })
            .catch(() => { });
    }, [user, location.pathname]);

    // Close notif dropdown on click outside
    useEffect(() => {
        const handleClick = () => setShowNotifDropdown(false);
        if (showNotifDropdown) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [showNotifDropdown]);

    return (
        <div className={`app-layout ${user?.role ? `app-layout--${user.role}` : ''}`}>
            {/* Mobile overlay */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon" style={{ overflow: 'hidden', padding: 0 }}>
                        <img src={logoImg} alt="Logo SMK NU AL-HIDAYAH" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                        <h2>Smk Nu Al-Hidayah</h2>
                        <small>Perpustakaan Digital</small>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {menu.map((section, idx) => (
                        <div key={idx} className="sidebar-section">
                            <div className="sidebar-section-title">{section.section}</div>
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <span className="icon"><item.icon /></span>
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">
                        {user?.avatar ? (
                            <img
                                src={user.avatar.startsWith('http') ? user.avatar : `/storage/${user.avatar}`}
                                alt={user?.name}
                                className="sidebar-user-avatar-img"
                            />
                        ) : (
                            user?.name?.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="sidebar-user-info">
                        <div className="name">{user?.name}</div>
                        <span className={`role-badge ${badgeConfig.className}`}>
                            {badgeConfig.label}
                        </span>
                    </div>
                    <button onClick={logout} className="btn btn-icon" title="Logout" style={{ color: 'var(--danger)' }}>
                        <HiOutlineLogout />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                <header className="navbar">
                    <div className="navbar-left">
                        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            {sidebarOpen ? <HiOutlineX /> : <HiOutlineMenu />}
                        </button>
                        <h1>{pageTitle}</h1>
                    </div>
                    <div className="navbar-right">
                        {/* Notification Bell */}
                        <div className="notif-bell-wrapper" onClick={e => { e.stopPropagation(); setShowNotifDropdown(!showNotifDropdown); }}>
                            <button className="notif-bell-btn" title="Notifikasi">
                                <HiOutlineBell />
                                {notifCount > 0 && (
                                    <span className="notif-bell-badge">{notifCount > 9 ? '9+' : notifCount}</span>
                                )}
                            </button>
                            {showNotifDropdown && (
                                <div className="notif-dropdown" onClick={e => e.stopPropagation()}>
                                    <div className="notif-dropdown-header">
                                        <h4>Notifikasi</h4>
                                        {notifCount > 0 && <span className="notif-dropdown-count">{notifCount}</span>}
                                    </div>
                                    <div className="notif-dropdown-list">
                                        {notifications.length === 0 ? (
                                            <div className="notif-dropdown-empty">
                                                <HiOutlineBell />
                                                <p>Tidak ada notifikasi</p>
                                            </div>
                                        ) : (
                                            notifications.slice(0, 8).map((n, i) => (
                                                <div key={i} className={`notif-dropdown-item notif-dropdown-item--${n.severity}`}>
                                                    <div className={`notif-dropdown-dot notif-dropdown-dot--${n.severity}`} />
                                                    <span>{n.message}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Selamat datang, <strong>{user?.name}</strong>
                        </span>
                    </div>
                </header>

                <main className="content-area fade-in">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
