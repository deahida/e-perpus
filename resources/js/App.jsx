import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext.jsx';
import WelcomePage from './pages/WelcomePage';
import LoginRole from './pages/LoginRole';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import BookForm from './pages/BookForm';
import Categories from './pages/Categories';
import RakBuku from './pages/RakBuku';
import Penerbit from './pages/Penerbit';
import Peminjaman from './pages/Peminjaman';
import Checkpoints from './pages/Checkpoints';
import Users from './pages/Users';
import Kelas from './pages/Kelas';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import PeminjamanSaya from './pages/PeminjamanSaya';
import BukuPopuler from './pages/BukuPopuler';

function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-spinner"><div className="spinner"></div> Memuat...</div>;
    if (!user) return <Navigate to="/auth" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
    return children;
}

function AppRoutes() {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-spinner"><div className="spinner"></div> Memuat aplikasi...</div>;

    return (
        <Routes>
            {/* Welcome / role-select page */}
            <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <WelcomePage />} />

            {/* Role-specific login pages */}
            <Route path="/login/admin" element={user ? <Navigate to="/dashboard" /> : <LoginRole role="admin" />} />
            <Route path="/login/guru" element={user ? <Navigate to="/dashboard" /> : <LoginRole role="guru" />} />
            <Route path="/login/siswa" element={user ? <Navigate to="/dashboard" /> : <LoginRole role="siswa" />} />

            {/* Legacy /login route — redirect to welcome */}
            <Route path="/login" element={<Navigate to="/auth" replace />} />

            {/* Protected dashboard routes */}
            <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="books" element={<ProtectedRoute roles={['admin']}><Books /></ProtectedRoute>} />
                <Route path="books/create" element={<ProtectedRoute roles={['admin']}><BookForm /></ProtectedRoute>} />
                <Route path="books/:id/edit" element={<ProtectedRoute roles={['admin']}><BookForm /></ProtectedRoute>} />
                <Route path="categories" element={<ProtectedRoute roles={['admin']}><Categories /></ProtectedRoute>} />
                <Route path="rak-buku" element={<ProtectedRoute roles={['admin']}><RakBuku /></ProtectedRoute>} />
                <Route path="penerbit" element={<ProtectedRoute roles={['admin']}><Penerbit /></ProtectedRoute>} />
                <Route path="peminjaman" element={<ProtectedRoute roles={['admin', 'guru']}><Peminjaman /></ProtectedRoute>} />
                <Route path="checkpoints" element={<ProtectedRoute roles={['admin', 'guru']}><Checkpoints /></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
                <Route path="kelas" element={<ProtectedRoute roles={['admin']}><Kelas /></ProtectedRoute>} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
                <Route path="peminjaman-saya" element={<PeminjamanSaya />} />
                <Route path="buku-populer" element={<BukuPopuler />} />
            </Route>
            <Route path="*" element={<Navigate to="/auth" />} />
        </Routes>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <AuthProvider>
                    <ThemedToaster />
                    <AppRoutes />
                </AuthProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
}

function ThemedToaster() {
    const { theme } = useTheme();
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                style: theme === 'dark'
                    ? { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' }
                    : { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
                success: { iconTheme: { primary: '#10b981', secondary: theme === 'dark' ? '#f1f5f9' : '#ffffff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: theme === 'dark' ? '#f1f5f9' : '#ffffff' } },
            }}
        />
    );
}
