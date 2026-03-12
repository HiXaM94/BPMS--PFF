import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, CheckCircle2, Star, ShieldCheck } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Check if we came from QR code
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('source') === 'qr') {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleReject = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 animate-slide-up">
        {/* Header Image/Pattern */}
        <div className="h-32 bg-gradient-to-br from-brand-500 to-indigo-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30">
              <svg viewBox="0 0 30.54 21.4" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12">
                <path fill="white" d="M26.58,1v6.31c0,1.84-1.49,3.32-3.32,3.32s-3.32-1.49-3.32-3.32v-1.81c0-1.12-.41-2.14-1.08-2.93-.82-.96-2.05-1.57-3.42-1.57-1.87,0-3.47,1.14-4.15,2.75-.2.46-.32.96-.35,1.49,0,.09,0,.17,0,.26s0,.17,0,.26v8.47c-.22,1.62-1.61,2.86-3.29,2.86-1.83,0-3.32-1.49-3.32-3.32V1H1v12.94c0,3.57,2.9,6.47,6.47,6.47s6.47-2.9,6.47-6.47c0-.22-.01-.43-.03-.64v-3.56s.02,0,.03.01v-4.66c0-.74.6-1.34,1.34-1.34s1.34.6,1.34,1.34v2.38c0,.79.14,1.55.4,2.25.92,2.46,3.29,4.22,6.07,4.22,3.44,0,6.26-2.69,6.46-6.09h.01V1h-2.96Z" />
              </svg>
            </div>
          </div>
          <button 
            onClick={handleReject}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Install Flowly App</h2>
          <p className="text-gray-500 mb-6">Experience the best of Flowly with our mobile app. Fast, secure, and always ready.</p>

          <div className="flex justify-center gap-6 mb-8 text-xs font-medium text-gray-400">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-emerald-500 mb-1">
                <CheckCircle2 size={20} />
              </div>
              Verified
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-amber-500 mb-1">
                <Star size={20} />
              </div>
              Top Rated
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-blue-500 mb-1">
                <ShieldCheck size={20} />
              </div>
              Secure
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleReject}
              className="py-4 px-6 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-all active:scale-95"
            >
              Not Now
            </button>
            <button
              onClick={handleInstall}
              className="py-4 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 active:scale-95"
            >
              <Download size={20} />
              Install
            </button>
          </div>
          
          <p className="mt-6 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            Powered by Progressive Web Technology
          </p>
        </div>
      </div>
    </div>
  );
}
