'use client';

import { Doctor } from '@/lib/firebase-utils';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Phone, Stethoscope, Calendar, Clock, Award, Star } from 'lucide-react';

interface DoctorDetailsModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DoctorDetailsModal({ doctor, isOpen, onClose }: DoctorDetailsModalProps) {
  if (!isOpen || !doctor) return null;

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
          className="relative w-full max-w-2xl bg-dark-900 border border-gold-500/20 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header Pattern */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-gold-500/10 to-transparent opacity-50" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-dark-800/50 text-gray-400 hover:text-white hover:bg-dark-800 transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="p-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-dark-800 to-dark-950 border border-gold-500/30 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                <Stethoscope className="text-gold-400" size={40} />
              </div>
              
              <div className="text-center sm:text-right flex-1">
                <h2 className="text-3xl font-bold text-white mb-2">د. {doctor.name}</h2>
                <p className="text-gold-400 text-lg font-medium mb-4">{doctor.specialty}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <span className="px-3 py-1 rounded-full bg-dark-800 border border-white/5 text-xs text-gray-300 flex items-center gap-1">
                    <Award size={12} className="text-gold-500" /> استشاري
                  </span>
                  <span className="px-3 py-1 rounded-full bg-dark-800 border border-white/5 text-xs text-gray-300 flex items-center gap-1">
                    <Star size={12} className="text-gold-500" /> تقييم ممتاز
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-dark-800/50 rounded-2xl p-5 border border-white/5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-dark-900 flex items-center justify-center shrink-0">
                  <MapPin className="text-gold-500" size={18} />
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 mb-1">العنوان</h4>
                  <p className="text-gray-200 text-sm leading-relaxed">{doctor.address}</p>
                </div>
              </div>
              
              <div className="bg-dark-800/50 rounded-2xl p-5 border border-white/5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-dark-900 flex items-center justify-center shrink-0">
                  <Phone className="text-gold-500" size={18} />
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 mb-1">رقم الحجز</h4>
                  <p className="text-gray-200 text-lg font-mono" dir="ltr">{doctor.phone}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gold-500/10 via-gold-500/5 to-transparent rounded-2xl p-6 border border-gold-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-gold-400 font-bold mb-1 flex items-center gap-2">
                  <Calendar size={18} />
                  احجز موعدك الآن
                </h4>
                <p className="text-sm text-gray-400">تواصل مع العيادة مباشرة لتأكيد الحجز</p>
              </div>
              <a 
                href={`tel:${doctor.phone}`}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-gold text-black font-bold text-center hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <Phone size={18} />
                اتصال
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
