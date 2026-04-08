'use client';

import { Doctor } from '@/lib/firebase-utils';
import { motion } from 'motion/react';
import { MapPin, Phone, Stethoscope, Star } from 'lucide-react';

interface DoctorCardProps {
  doctor: Doctor;
  onClick: (doctor: Doctor) => void;
  index: number;
}

export default function DoctorCard({ doctor, onClick, index }: DoctorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => onClick(doctor)}
      className="group relative bg-dark-800/80 border border-white/5 rounded-2xl p-6 cursor-pointer overflow-hidden hover:border-gold-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl group-hover:bg-gold-500/10 transition-colors" />
      
      <div className="flex items-start gap-4 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-dark-900 to-dark-800 border border-gold-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Stethoscope className="text-gold-500" size={28} />
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-100 mb-1 group-hover:text-gold-400 transition-colors">
            د. {doctor.name}
          </h3>
          <p className="text-gold-500/80 text-sm font-medium mb-4">{doctor.specialty}</p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <MapPin size={14} className="text-gold-500/50" />
              <span className="truncate">{doctor.address}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Phone size={14} className="text-gold-500/50" />
              <span>{doctor.phone}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1 text-gold-400">
          <Star size={14} fill="currentColor" />
          <Star size={14} fill="currentColor" />
          <Star size={14} fill="currentColor" />
          <Star size={14} fill="currentColor" />
          <Star size={14} fill="currentColor" />
        </div>
        <span className="text-xs font-medium text-gold-500/70 group-hover:text-gold-400 transition-colors">
          عرض التفاصيل &larr;
        </span>
      </div>
    </motion.div>
  );
}
