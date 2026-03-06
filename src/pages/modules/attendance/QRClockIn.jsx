import React, { useState, useEffect, useRef } from 'react';
import { LogIn, ScanLine, X, Camera, CheckCircle2, AlertTriangle } from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { validateScanToken } from './qrcode/qrCodeService';

export default function QRClockIn({ isClockedIn, isOnTime, checkInTime, status, companyId, onClockIn, onStartLunch }) {
    const [showScanner, setShowScanner] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [validationError, setValidationError] = useState(null);
    const videoRef = useRef(null);
    const controlsRef = useRef(null);

    useEffect(() => {
        if (!showScanner) return;

        const codeReader = new BrowserQRCodeReader();
        let mounted = true;

        async function startCamera() {
            try {
                // start decoding from default video device
                const controls = await codeReader.decodeFromVideoDevice(undefined, videoRef.current, async (result, err) => {
                    if (mounted && result) {
                        const scannedText = result.getText();
                        console.log("QR Code Scanned:", scannedText);

                        // Validate the scanned token against today's daily token
                        const validation = await validateScanToken(scannedText, companyId);

                        if (validation.valid) {
                            setScanning(false);
                            setScanComplete(true);
                            setValidationError(null);

                            // Close and clock in after showing success
                            setTimeout(() => {
                                if (mounted) {
                                    setShowScanner(false);
                                    if (onClockIn) onClockIn(scannedText);
                                }
                            }, 1500);

                            if (controlsRef.current) controlsRef.current.stop();
                        } else {
                            // Invalid token — keep scanning but show error
                            setValidationError(validation.message);
                            // Clear error after 3 seconds
                            setTimeout(() => {
                                if (mounted) setValidationError(null);
                            }, 3000);
                        }
                    }
                });

                if (mounted) {
                    controlsRef.current = controls;
                } else {
                    controls.stop();
                }
            } catch (err) {
                console.error("Camera start error:", err);
                if (mounted) setCameraError("Could not access camera. Please allow permissions.");
            }
        }

        startCamera();

        return () => {
            mounted = false;
            // Clean up camera on unmount or close
            if (controlsRef.current) {
                controlsRef.current.stop();
            }
        };
    }, [showScanner]);

    const handleStartScan = () => {
        setShowScanner(true);
        setScanning(true);
        setScanComplete(false);
        setCameraError(null);
        setValidationError(null);
    };



    const fmtTime = (t) => {
        if (!t) return '-';
        const [h, m] = t.split(':');
        const hr = parseInt(h, 10);
        return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
    };

    return (
        <>
            <div className={`rounded-3xl p-6 text-text-primary shadow-sm relative overflow-hidden backdrop-blur-xl
          ${isClockedIn
                    ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-brand-500/20'
                    : 'bg-surface-primary border border-border-secondary'
                }`}>

                {isClockedIn && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none"></div>
                )}

                {isClockedIn ? (
                    <>
                        <h3 className="text-lg font-bold mb-1 flex items-center gap-2 text-white">
                            <span className="bg-white/20 p-1.5 rounded-full"><CheckCircle2 size={16} /></span>
                            Clocked In
                        </h3>
                        <p className="text-white/80 text-sm mb-6">
                            {isOnTime ? 'You are on time today. Have a great shift!' : 'You clocked in late today.'}
                        </p>
                        <div className="space-y-3 mb-6 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                            <div className="flex justify-between items-center">
                                <span className="text-white/70 text-xs uppercase tracking-wider font-semibold">Time</span>
                                <span className="font-bold text-sm bg-white/20 px-2 py-1 rounded-md">{fmtTime(checkInTime)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white/70 text-xs uppercase tracking-wider font-semibold">Status</span>
                                <span className="font-bold text-sm capitalize">{status}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white/70 text-xs uppercase tracking-wider font-semibold">Shift</span>
                                <span className="font-bold text-sm">9:00 - 17:00</span>
                            </div>
                        </div>
                        <button
                            onClick={handleStartScan}
                            className="w-full py-3 bg-white text-brand-600 font-extrabold rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
                        >
                            Clock Out
                        </button>
                    </>
                ) : (
                    <>
                        <h3 className="text-xl font-extrabold flex items-center gap-2 mb-1.5 text-text-primary tracking-tight">
                            <LogIn size={24} className="text-text-primary" /> Not Clocked In
                        </h3>
                        <p className="text-text-secondary text-sm mb-6 font-medium">Use the kiosk or QR code to clock in.</p>

                        <div
                            onClick={handleStartScan}
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border-secondary hover:border-brand-500/50 hover:bg-brand-50/50 dark:hover:bg-brand-500/5 rounded-2xl mb-5 transition-all cursor-pointer group"
                        >
                            <div className="bg-surface-secondary group-hover:bg-surface-primary p-3 rounded-2xl shadow-sm mb-2 transition-colors">
                                <ScanLine size={32} className="text-text-tertiary group-hover:text-brand-500 transition-colors" />
                            </div>
                            <span className="text-xs font-semibold text-text-tertiary group-hover:text-brand-500">Tap to scan</span>
                        </div>

                        <button
                            onClick={handleStartScan}
                            className="w-full py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-extrabold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                        >
                            <Camera size={20} /> Clock In Now
                        </button>
                    </>
                )}
            </div>

            {/* QR Scanner Modal Overlay */}
            {showScanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-surface-primary rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-up border border-border-secondary">
                        <div className="p-4 border-b border-border-secondary flex items-center justify-between bg-surface-secondary/50">
                            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                                <Camera size={20} className="text-brand-500" />
                                Scan Office QR Code
                            </h3>
                            <button
                                onClick={() => setShowScanner(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-tertiary text-text-secondary transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 flex flex-col items-center justify-center min-h-[350px] relative bg-black">
                            {/* Simulated Camera Viewfinder */}
                            <div className="absolute inset-0 opacity-40 mix-blend-screen bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center"></div>

                            <div className="relative z-10 w-64 h-64 border-[3px] border-white/40 rounded-3xl flex items-center justify-center overflow-hidden bg-black">
                                {/* Live Camera Feed */}
                                {scanning && !cameraError && (
                                    <video
                                        ref={videoRef}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                )}

                                {cameraError && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center">
                                        <span className="text-red-400 text-sm font-semibold">{cameraError}</span>
                                    </div>
                                )}
                                {/* Scanner Laser */}
                                {scanning && (
                                    <div className="absolute top-0 w-full h-1 bg-brand-400 shadow-[0_0_20px_5px_rgba(56,189,248,0.6)] animate-scan"></div>
                                )}

                                {/* Corner Accents */}
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-[4px] border-l-[4px] border-white rounded-tl-2xl"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-[4px] border-r-[4px] border-white rounded-tr-2xl"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[4px] border-l-[4px] border-white rounded-bl-2xl"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[4px] border-r-[4px] border-white rounded-br-2xl"></div>

                                {!scanning && scanComplete && (
                                    <div className="absolute inset-0 bg-brand-500/20 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-xl">
                                            <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-white font-bold text-lg drop-shadow-md">QR Recognized!</span>
                                        <span className="text-white/80 font-medium text-sm drop-shadow-md mt-1">
                                            {isClockedIn ? 'Clocking you out...' : 'Clocking you in...'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <p className="relative z-10 mt-8 text-white/90 text-sm font-medium text-center max-w-[250px] drop-shadow-md">
                                {validationError ? '' : scanning && !cameraError ? 'Align the QR code within the frame to clock in.' : scanComplete ? 'Success!' : ''}
                            </p>

                            {/* Validation Error Toast */}
                            {validationError && (
                                <div className="relative z-10 mt-4 bg-red-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in max-w-[300px]">
                                    <AlertTriangle size={18} className="shrink-0" />
                                    <span className="text-sm font-semibold">{validationError}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
