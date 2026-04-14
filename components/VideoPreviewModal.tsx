'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Play, Film } from 'lucide-react';
import { Player } from '@remotion/player';
import { DoctorVideo } from './video/DoctorVideo';
import { Doctor } from '@/lib/firebase-utils';

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
}

export default function VideoPreviewModal({ isOpen, onClose, doctor }: VideoPreviewModalProps) {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !doctor) return null;

  const handleExport = () => {
    setIsExporting(true);
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      alert('في بيئة الإنتاج، سيتم ربط هذا الزر بخادم (Remotion Lambda) لتوليد ملف MP4 وتحميله مباشرة. حالياً يمكنك استخدام المعاينة الحية لتسجيل الشاشة أو استخدام أداة CLI الخاصة بـ Remotion للتصدير!');
    }, 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-dark-900 border border-gold-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 z-10 p-2 bg-black/50 text-gray-400 hover:text-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          {/* Video Player Section (Left/Top) */}
          <div className="w-full md:w-1/2 bg-black p-4 flex items-center justify-center border-b md:border-b-0 md:border-l border-white/10 min-h-[400px]">
            <div className="w-full max-w-[280px] aspect-[9/16] rounded-xl overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.15)] bg-dark-950">
              <Player
                component={DoctorVideo}
                inputProps={{ doctor }}
                durationInFrames={150}
                compositionWidth={1080}
                compositionHeight={1920}
                fps={30}
                controls
                autoPlay
                loop
                acknowledgeRemotionLicense
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* Details & Actions Section (Right/Bottom) */}
          <div className="w-full md:w-1/2 p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center">
                <Film className="text-gold-500" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">فيديو ترويجي</h2>
                <p className="text-gray-400">توليد تلقائي لـ {doctor.name}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8 flex-1">
              <div className="p-4 bg-dark-800 rounded-xl border border-white/5">
                <h3 className="text-sm font-medium text-gray-400 mb-1">المنصة المستهدفة</h3>
                <p className="text-white font-medium">Instagram Reels / TikTok / YouTube Shorts</p>
              </div>
              <div className="p-4 bg-dark-800 rounded-xl border border-white/5">
                <h3 className="text-sm font-medium text-gray-400 mb-1">الأبعاد</h3>
                <p className="text-white font-medium">1080 × 1920 (عمودي)</p>
              </div>
              <div className="p-4 bg-dark-800 rounded-xl border border-white/5">
                <h3 className="text-sm font-medium text-gray-400 mb-1">المدة</h3>
                <p className="text-white font-medium">5 ثوانٍ (150 إطار)</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-4 bg-gradient-gold text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isExporting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>جاري التصدير...</span>
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    <span>تصدير الفيديو (MP4)</span>
                  </>
                )}
              </button>
              <p className="text-xs text-center text-gray-500">
                يتم توليد الفيديو برمجياً باستخدام Remotion
              </p>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
