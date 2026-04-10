import React, { useState, useCallback } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { HiOutlineX, HiOutlineCamera, HiOutlineExclamation } from 'react-icons/hi';

export default function BarcodeScanner({ isOpen, onClose, onScan, mode = 'peminjaman' }) {
    const [error, setError] = useState(null);
    const [scanned, setScanned] = useState(false);

    const handleScan = useCallback((detectedCodes) => {
        if (scanned || !detectedCodes || detectedCodes.length === 0) return;
        const code = detectedCodes[0]?.rawValue;
        if (!code) return;

        setScanned(true);
        onScan(code);

        // Reset scanned state after delay to allow re-scanning
        setTimeout(() => setScanned(false), 2000);
    }, [onScan, scanned]);

    const handleError = useCallback((err) => {
        console.error('Scanner error:', err);
        if (err?.name === 'NotAllowedError') {
            setError('Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.');
        } else if (err?.name === 'NotFoundError') {
            setError('Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.');
        } else if (err?.name === 'NotReadableError') {
            setError('Kamera sedang digunakan oleh aplikasi lain.');
        } else {
            setError('Gagal mengakses kamera. Pastikan Anda menggunakan HTTPS atau localhost.');
        }
    }, []);

    const handleClose = () => {
        setError(null);
        setScanned(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="scanner-overlay" onClick={handleClose}>
            <div className="scanner-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="scanner-header">
                    <div className="scanner-header-info">
                        <HiOutlineCamera size={20} />
                        <span>{mode === 'peminjaman' ? 'Scan Peminjaman' : 'Scan Pengembalian'}</span>
                    </div>
                    <button className="scanner-close-btn" onClick={handleClose}>
                        <HiOutlineX size={20} />
                    </button>
                </div>

                {/* Scanner viewport */}
                <div className="scanner-viewport">
                    {error ? (
                        <div className="scanner-error">
                            <HiOutlineExclamation size={48} />
                            <p>{error}</p>
                            <button className="btn btn-primary" onClick={() => setError(null)}>
                                Coba Lagi
                            </button>
                        </div>
                    ) : (
                        <>
                            <Scanner
                                onScan={handleScan}
                                onError={handleError}
                                formats={['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e']}
                                constraints={{ facingMode: 'environment' }}
                                sound={true}
                                scanDelay={500}
                                styles={{
                                    container: { width: '100%', height: '100%' },
                                    video: { width: '100%', height: '100%', objectFit: 'cover' },
                                }}
                                components={{
                                    audio: true,
                                    onOff: false,
                                    torch: true,
                                    finder: false,
                                }}
                            />
                            {/* Custom scan line overlay */}
                            <div className="scanner-frame">
                                <div className="scanner-frame-corner tl" />
                                <div className="scanner-frame-corner tr" />
                                <div className="scanner-frame-corner bl" />
                                <div className="scanner-frame-corner br" />
                                <div className="scanner-line" />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer hint */}
                <div className="scanner-footer">
                    <p>Arahkan kamera ke barcode / QR code pada buku</p>
                    {scanned && <div className="scanner-scanned-badge">✅ Kode terdeteksi!</div>}
                </div>
            </div>
        </div>
    );
}
