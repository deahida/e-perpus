import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
    HiOutlineBookOpen, HiOutlineUsers, HiOutlineAcademicCap,
    HiOutlineClipboardList, HiOutlineExclamation, HiOutlineShieldCheck
} from 'react-icons/hi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import DashboardSiswa from './DashboardSiswa';
import DashboardGuru from './DashboardGuru';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Dashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only fetch admin dashboard data if user is admin
        if (user?.role === 'admin') {
            api.get('/dashboard')
                .then(res => setData(res.data.data))
                .catch(console.error)
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user?.role]);

    // Route siswa to their own dashboard
    if (user?.role === 'siswa') {
        return <DashboardSiswa />;
    }

    // Route guru to their own dashboard
    if (user?.role === 'guru') {
        return <DashboardGuru />;
    }

    if (loading) return <div className="loading-spinner"><div className="spinner"></div> Memuat dashboard...</div>;
    if (!data) return <div className="empty-state"><h3>Gagal memuat data</h3></div>;

    const { statistik, grafik_peminjaman, kategori_populer, peminjaman_terbaru, notifikasi_terlambat } = data;

    const statCards = [
        { label: 'Total Buku', value: statistik.total_buku, icon: HiOutlineBookOpen, color: 'purple' },
        { label: 'Buku Dipinjam', value: statistik.buku_dipinjam, icon: HiOutlineClipboardList, color: 'cyan' },
        { label: 'Buku Tersedia', value: statistik.buku_tersedia, icon: HiOutlineShieldCheck, color: 'green' },
        { label: 'Total Siswa', value: statistik.total_siswa, icon: HiOutlineAcademicCap, color: 'amber' },
        { label: 'Total Guru', value: statistik.total_guru, icon: HiOutlineUsers, color: 'purple' },
        { label: 'Terlambat', value: notifikasi_terlambat?.length || 0, icon: HiOutlineExclamation, color: 'red' },
    ];

    const chartData = grafik_peminjaman?.map(item => ({
        bulan: item.bulan,
        total: item.total,
    })) || [];

    const pieData = kategori_populer?.map(item => ({
        name: item.nama_kategori,
        value: item.books_count,
    })) || [];

    return (
        <div className="fade-in">
            {/* Stat Cards */}
            <div className="stats-grid">
                {statCards.map((stat, i) => (
                    <div key={i} className={`stat-card ${stat.color}`}>
                        <div className={`stat-icon ${stat.color}`}>
                            <stat.icon />
                        </div>
                        <div className="stat-info">
                            <h3>{stat.value?.toLocaleString('id-ID')}</h3>
                            <p>{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header">
                        <h2>📊 Grafik Peminjaman per Bulan</h2>
                    </div>
                    <div className="card-body">
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="bulan" stroke="#64748b" fontSize={12} />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            color: '#f1f5f9',
                                        }}
                                    />
                                    <Bar dataKey="total" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#818cf8" />
                                            <stop offset="100%" stopColor="#6366f1" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2>📚 Kategori Populer</h2>
                    </div>
                    <div className="card-body">
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            color: '#f1f5f9',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="dashboard-grid">
                {/* Peminjaman Terbaru */}
                <div className="card">
                    <div className="card-header">
                        <h2>📋 Peminjaman Terbaru</h2>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Peminjam</th>
                                    <th>Buku</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {peminjaman_terbaru?.slice(0, 8).map((p, i) => (
                                    <tr key={i}>
                                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                            {p.user?.name}
                                        </td>
                                        <td>{p.book?.judul}</td>
                                        <td>
                                            <span className={`badge ${p.status === 'dipinjam' ? 'badge-warning' :
                                                p.status === 'dikembalikan' ? 'badge-success' : 'badge-danger'
                                                }`}>
                                                {p.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Notifikasi Keterlambatan */}
                <div className="card">
                    <div className="card-header">
                        <h2>🔔 Keterlambatan</h2>
                        {notifikasi_terlambat?.length > 0 && (
                            <span className="badge badge-danger">{notifikasi_terlambat.length}</span>
                        )}
                    </div>
                    <div className="notification-list">
                        {notifikasi_terlambat?.length === 0 ? (
                            <div className="empty-state" style={{ padding: 32 }}>
                                <p style={{ color: 'var(--success)' }}>✅ Tidak ada keterlambatan</p>
                            </div>
                        ) : (
                            notifikasi_terlambat?.map((item, i) => (
                                <div key={i} className="notification-item">
                                    <div className="notification-icon">
                                        <HiOutlineExclamation />
                                    </div>
                                    <div className="notification-content">
                                        <div className="title">{item.user?.name}</div>
                                        <div className="desc">{item.book?.judul}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
