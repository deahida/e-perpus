import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    HiOutlineViewGrid, HiOutlineBookOpen, HiOutlineCollection,
    HiOutlineArchive, HiOutlineOfficeBuilding, HiOutlineClipboardList,
    HiOutlineShieldCheck, HiOutlineUsers, HiOutlineUserGroup,
    HiOutlineAcademicCap, HiOutlineCog, HiOutlineUser,
    HiOutlineLogout, HiOutlineMenu, HiOutlineX
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
            section: 'Perpustakaan', items: [
                { path: '/buku-populer', icon: HiOutlineBookOpen, label: 'Buku Populer' },
                { path: '/peminjaman-saya', icon: HiOutlineClipboardList, label: 'Peminjaman Saya' },
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
                { path: '/buku-populer', icon: HiOutlineBookOpen, label: 'Buku Populer' },
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

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const menu = menuItems[user?.role] || menuItems.siswa;
    const pageTitle = getPageTitle(location.pathname);

    return (
        <div className="app-layout">
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
                        <span className={`role-badge role-${user?.role}`}>
                            {user?.role?.toUpperCase()}
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
