'use client';

import { useState, useEffect } from 'react';
import { Share2, MessageCircle, Facebook, Link as LinkIcon, X, Check, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FloatingShareButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareTitle = 'دليل أطباء سامراء';
  const shareText = 'اكتشف أفضل الأطباء والعيادات في سامراء بسهولة مع دليل أطباء سامراء. تصفح الدليل الآن!';

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setIsOpen(false);
      } catch (error) {
        console.log('Error sharing', error);
      }
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  return (
    <div className="fixed bottom-24 left-6 md:bottom-8 md:left-8 z-50 flex flex-col items-center">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col gap-3 mb-4"
          >
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="w-12 h-12 rounded-full bg-dark-700 border border-white/10 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                title="خيارات أخرى"
              >
                <MoreHorizontal size={24} />
              </button>
            )}
            <button
              onClick={copyLink}
              className="w-12 h-12 rounded-full bg-dark-800 border border-gold-500/30 text-gold-400 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              title="نسخ الرابط"
            >
              {copied ? <Check size={24} className="text-green-400" /> : <LinkIcon size={24} />}
            </button>
            <button
              onClick={shareFacebook}
              className="w-12 h-12 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              title="مشاركة عبر فيسبوك"
            >
              <Facebook size={24} />
            </button>
            <button
              onClick={shareWhatsApp}
              className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              title="مشاركة عبر واتساب"
            >
              <MessageCircle size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300 ${
          isOpen ? 'bg-dark-800 text-white border border-white/10 rotate-90' : 'bg-gradient-gold text-black hover:scale-110'
        }`}
        title="شارك التطبيق"
      >
        {isOpen ? <X size={24} className="-rotate-90 transition-transform duration-300" /> : <Share2 size={24} />}
      </button>
    </div>
  );
}
