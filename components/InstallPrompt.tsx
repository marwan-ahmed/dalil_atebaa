'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share, PlusSquare } from 'lucide-react';

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(() => {
    if (typeof window === 'undefined') return false;
    return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  });
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone || 
           document.referrer.includes('android-app://');
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (isStandalone) return;

    // Handle Android/Chrome install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Visit count logic using localStorage
    const visitCount = parseInt(localStorage.getItem('visitCount') || '0');
    const isDismissed = localStorage.getItem('installPromptDismissed') === 'true';

    localStorage.setItem('visitCount', (visitCount + 1).toString());

    // Show prompt after 3s always if not dismissed
    if (!isDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  // Do not render if already installed or if prompt shouldn't be shown
  if (!showPrompt || isStandalone) return null;

  // Only show if it's iOS OR if we have the native install prompt ready (Android/Desktop)
  if (!isIOS && !deferredPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-28 left-4 right-4 md:bottom-6 md:right-auto md:left-6 md:w-96 z-[60] bg-dark-800/95 backdrop-blur-md border border-gold-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-5"
        >
          <button 
            onClick={handleDismiss}
            className="absolute top-3 left-3 text-gray-400 hover:text-white transition-colors bg-dark-900/50 rounded-full p-1"
            title="إغلاق"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center shrink-0 shadow-lg">
              <Download size={28} className="text-black" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">تثبيت التطبيق</h3>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                أضف &quot;دليل أطباء سامراء&quot; لشاشتك الرئيسية للوصول السريع بدون إنترنت وبدون استهلاك مساحة.
              </p>
              
              {isIOS ? (
                <div className="bg-dark-900/80 rounded-xl p-3 text-sm text-gray-300 flex flex-col gap-3 border border-white/5">
                  <p className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-dark-700 text-xs font-bold">1</span>
                    اضغط على زر المشاركة <Share size={18} className="text-blue-400 mr-auto" />
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-dark-700 text-xs font-bold">2</span>
                    اختر &quot;إضافة للشاشة الرئيسية&quot; <PlusSquare size={18} className="text-gray-400 mr-auto" />
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleInstall}
                  className="w-full py-2.5 bg-gradient-gold text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all hover:scale-105 active:scale-95"
                >
                  تثبيت الآن
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
