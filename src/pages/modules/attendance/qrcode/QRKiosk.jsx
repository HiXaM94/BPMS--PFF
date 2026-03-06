import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QrCode, Clock, Shield, Building2, RefreshCw } from 'lucide-react';
import { getTodayQRCode, generateDailyToken } from './qrCodeService';
import LogoWhite from '../../../../logo/ICONWHITE.svg';

export default function QRKiosk() {
    const [searchParams] = useSearchParams();
    const entrepriseId = searchParams.get('entreprise');

    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [error, setError] = useState(null);
    const qrContainerRef = useRef(null);
    const qrInstanceRef = useRef(null);

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch today's QR code
    useEffect(() => {
        async function fetchQR() {
            setLoading(true);
            setError(null);
            try {
                if (!entrepriseId) {
                    setError('Enterprise ID missing from URL. Please open this from the HR Dashboard.');
                    return;
                }

                let data = await getTodayQRCode(entrepriseId);
                if (!data) {
                    data = await generateDailyToken(entrepriseId);
                }
                setQrData(data);
            } catch (err) {
                console.error('[Kiosk] Error:', err);
                setError('Failed to load QR code. Please refresh.');
            } finally {
                setLoading(false);
            }
        }
        fetchQR();

        // Auto-refresh every hour  
        const refreshInterval = setInterval(fetchQR, 60 * 60 * 1000);
        return () => clearInterval(refreshInterval);
    }, []);

    // Render QR code when data is ready
    useEffect(() => {
        if (!qrData?.token || !qrContainerRef.current) return;

        // Clear previous QR code
        qrContainerRef.current.innerHTML = '';

        // Load qrcode.min.js and render
        const script = document.createElement('script');
        script.src = new URL('./qrcode.min.js', import.meta.url).href;
        script.onload = () => {
            if (window.QRCode && qrContainerRef.current) {
                qrInstanceRef.current = new window.QRCode(qrContainerRef.current, {
                    text: qrData.token,
                    width: 320,
                    height: 320,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: window.QRCode.CorrectLevel.H
                });
            }
        };
        document.head.appendChild(script);

        return () => {
            if (script.parentNode) script.parentNode.removeChild(script);
        };
    }, [qrData?.token]);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleRefresh = async () => {
        if (!entrepriseId) return;
        setLoading(true);
        const data = await generateDailyToken(entrepriseId);
        setQrData(data);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Header */}
            <div className="text-center mb-8 relative z-10">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <img src={LogoWhite} alt="Company Logo" className="h-14 w-auto object-contain" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                    Office Attendance
                </h1>
                <p className="text-lg text-white/60 font-medium">
                    Scan the QR code below to clock in
                </p>
            </div>

            {/* Main QR Card */}
            <div className="bg-white rounded-[2rem] p-10 shadow-2xl shadow-black/30 max-w-md w-full relative z-10">
                {/* Date & Time */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock size={18} className="text-gray-400" />
                        <span className="text-3xl font-black text-gray-900 tabular-nums">
                            {formatTime(currentTime)}
                        </span>
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                        {formatDate(currentTime)}
                    </p>
                </div>

                {/* QR Code */}
                <div className="flex items-center justify-center mb-6">
                    {loading ? (
                        <div className="w-80 h-80 bg-gray-100 rounded-2xl flex items-center justify-center">
                            <div className="animate-spin">
                                <RefreshCw size={40} className="text-gray-300" />
                            </div>
                        </div>
                    ) : error ? (
                        <div className="w-80 h-80 bg-red-50 rounded-2xl flex items-center justify-center p-6 text-center">
                            <p className="text-red-500 font-semibold">{error}</p>
                        </div>
                    ) : (
                        <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-inner">
                            <div ref={qrContainerRef} className="w-80 h-80 flex items-center justify-center"></div>
                        </div>
                    )}
                </div>

                {/* Security badge */}
                <div className="flex items-center justify-center gap-2 text-gray-400">
                    <Shield size={14} />
                    <span className="text-xs font-semibold uppercase tracking-widest">
                        Secure • Auto-refreshed daily
                    </span>
                </div>
            </div>

            {/* Refresh button */}
            <button
                onClick={handleRefresh}
                className="mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 backdrop-blur-sm border border-white/10"
            >
                <RefreshCw size={16} />
                Regenerate QR Code
            </button>

            {/* Footer */}
            <div className="mt-8 text-center relative z-10">
                <p className="text-white/30 text-xs font-medium">
                    © {new Date().getFullYear()} BPMS Platform — Powered by QR Attendance
                </p>
            </div>
        </div>
    );
}
