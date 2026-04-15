'use client';

import { useState, useEffect } from 'react';
import { Doctor, Review, handleFirestoreError, OperationType } from '@/lib/firebase-utils';
import { db } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';
import { MapPin, Phone, Stethoscope, Star, Pill, FlaskConical, HeartPulse, Clock, Heart, BadgeCheck } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

interface DoctorCardProps {
  doctor: Doctor;
  onClick: (doctor: Doctor) => void;
  index: number;
}

export default function DoctorCard({ doctor, onClick, index }: DoctorCardProps) {
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    if (!doctor.id) return;

    const q = query(
      collection(db, 'reviews'),
      where('doctorId', '==', doctor.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => doc.data() as Review);
      setReviewCount(reviewsData.length);
      
      if (reviewsData.length > 0) {
        const sum = reviewsData.reduce((acc, rev) => acc + rev.rating, 0);
        setAverageRating(sum / reviewsData.length);
      } else {
        setAverageRating(null);
      }
    }, (error: any) => {
      // Silently handle error for individual cards to avoid spamming console
      console.error("Error fetching reviews for card", error);
    });

    return () => unsubscribe();
  }, [doctor.id]);

  const getCategoryIcon = () => {
    switch (doctor.category) {
      case 'pharmacy': return <Pill className="text-gold-500" size={28} />;
      case 'lab': return <FlaskConical className="text-gold-500" size={28} />;
      case 'nursing': return <HeartPulse className="text-gold-500" size={28} />;
      default: return <Stethoscope className="text-gold-500" size={28} />;
    }
  };

  const getDisplayName = () => {
    if (doctor.category === 'doctor' || !doctor.category) {
      return doctor.name.startsWith('د.') ? doctor.name : `د. ${doctor.name}`;
    }
    return doctor.name;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => onClick(doctor)}
      className="group relative bg-dark-800/80 border border-white/5 rounded-2xl p-6 cursor-pointer overflow-hidden hover:border-gold-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl group-hover:bg-gold-500/10 transition-colors" />
      
      <button 
        onClick={(e) => { e.stopPropagation(); toggleFavorite(doctor.id!); }}
        className="absolute top-4 left-4 z-20 p-2 rounded-full bg-dark-900/50 hover:bg-dark-800 transition-colors border border-white/5"
        title={isFavorite(doctor.id!) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
      >
        <Heart size={18} fill={isFavorite(doctor.id!) ? "#ef4444" : "none"} className={isFavorite(doctor.id!) ? "text-red-500" : "text-gray-400"} />
      </button>

      <div className="flex items-start gap-4 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-dark-900 to-dark-800 border border-gold-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          {getCategoryIcon()}
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-100 mb-1 group-hover:text-gold-400 transition-colors flex items-center gap-2">
            {getDisplayName()}
            {doctor.isVerified && (
              <BadgeCheck className="text-blue-400 shrink-0" size={18} title="حساب موثق" />
            )}
          </h3>
          <p className="text-gold-500/80 text-sm font-medium mb-4">{doctor.specialty}</p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <MapPin size={14} className="text-gold-500/50" />
              <span className="truncate">{doctor.address}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Phone size={14} className="text-gold-500/50" />
              <span dir="ltr">{doctor.phone}</span>
            </div>
            {doctor.workingHours && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Clock size={14} className="text-gold-500/50" />
                <span className="truncate">{doctor.workingHours}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1 text-gold-400">
          <Star size={14} fill="currentColor" />
          <span className="text-sm font-bold ml-1">{averageRating ? averageRating.toFixed(1) : 'جديد'}</span>
          {reviewCount > 0 && <span className="text-xs text-gray-500 mr-1">({reviewCount})</span>}
        </div>
        <span className="text-xs font-medium text-gold-500/70 group-hover:text-gold-400 transition-colors">
          عرض التفاصيل &larr;
        </span>
      </div>
    </motion.div>
  );
}
