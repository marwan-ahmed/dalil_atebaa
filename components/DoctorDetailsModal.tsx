'use client';

import { useState, useEffect } from 'react';
import { Doctor, Review, addReview, handleFirestoreError, OperationType } from '@/lib/firebase-utils';
import { auth, db } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Phone, Stethoscope, Calendar, Clock, Award, Star, MessageSquare, Send, Pill, FlaskConical, HeartPulse, MessageCircle, Share2, Heart, BadgeCheck } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

interface DoctorDetailsModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DoctorDetailsModal({ doctor, isOpen, onClose }: DoctorDetailsModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    if (!isOpen || !doctor?.id) return;

    setLoadingReviews(true);
    const q = query(
      collection(db, 'reviews'),
      where('doctorId', '==', doctor.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      
      reviewsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setReviews(reviewsData);
      setLoadingReviews(false);
    }, (error: any) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
      setLoadingReviews(false);
    });

    return () => unsubscribe();
  }, [isOpen, doctor?.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor?.id || !auth.currentUser) return;
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addReview({
        doctorId: doctor.id,
        rating: newRating,
        comment: newComment.trim()
      });
      setNewComment('');
      setNewRating(5);
    } catch (error) {
      console.error("Error adding review", error);
      alert("حدث خطأ أثناء إضافة التقييم.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !doctor) return null;

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
    : 'جديد';

  const getCategoryIcon = () => {
    switch (doctor.category) {
      case 'pharmacy': return <Pill className="text-gold-400" size={40} />;
      case 'lab': return <FlaskConical className="text-gold-400" size={40} />;
      case 'nursing': return <HeartPulse className="text-gold-400" size={40} />;
      default: return <Stethoscope className="text-gold-400" size={40} />;
    }
  };

  const getDisplayName = () => {
    if (doctor.category === 'doctor' || !doctor.category) {
      return doctor.name.startsWith('د.') ? doctor.name : `د. ${doctor.name}`;
    }
    return doctor.name;
  };

  const handleShare = async () => {
    const text = `${getDisplayName()}\nالتخصص: ${doctor.specialty}\nالعنوان: ${doctor.address}\nللحجز: ${doctor.phone}\n\nعبر دليل أطباء سامراء`;
    if (navigator.share) {
      try { await navigator.share({ title: getDisplayName(), text }); } catch(e) {}
    } else {
      navigator.clipboard.writeText(text);
      alert('تم نسخ معلومات الكيان الطبي بنجاح!');
    }
  };

  const getWhatsAppLink = (phone: string) => {
    let formatted = phone.replace(/\D/g, '');
    if (formatted.startsWith('0')) {
      formatted = '964' + formatted.substring(1);
    }
    const message = encodeURIComponent(`مرحباً، أود الاستفسار عن الحجز في ${doctor.category === 'pharmacy' ? 'صيدليتكم' : doctor.category === 'lab' ? 'مختبركم' : 'عيادتكم'}...`);
    return `https://wa.me/${formatted}?text=${message}`;
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
          className="relative w-full max-w-2xl bg-dark-900 border border-gold-500/20 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header Pattern */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-gold-500/10 to-transparent opacity-50 pointer-events-none" />
          
          <div className="absolute top-4 left-4 flex items-center gap-2 z-50">
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-dark-800/80 text-gray-400 hover:text-white hover:bg-dark-700 transition-colors backdrop-blur-sm"
            >
              <X size={20} />
            </button>
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
            <button 
              onClick={handleShare}
              className="p-2 rounded-full bg-dark-800/80 text-gray-400 hover:text-white hover:bg-dark-700 transition-colors backdrop-blur-sm"
              title="مشاركة"
            >
              <Share2 size={20} />
            </button>
            <button 
              onClick={() => toggleFavorite(doctor.id!)}
              className="p-2 rounded-full bg-dark-800/80 text-gray-400 hover:text-white hover:bg-dark-700 transition-colors backdrop-blur-sm"
              title={isFavorite(doctor.id!) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            >
              <Heart size={20} fill={isFavorite(doctor.id!) ? "#ef4444" : "none"} className={isFavorite(doctor.id!) ? "text-red-500" : ""} />
            </button>
          </div>

          <div className="p-8 relative z-10 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 mt-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-dark-800 to-dark-950 border border-gold-500/30 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                {getCategoryIcon()}
              </div>
              
              <div className="text-center sm:text-right flex-1">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center sm:justify-start gap-2">
                  {getDisplayName()}
                  {doctor.isVerified && (
                    <span title="حساب موثق">
                      <BadgeCheck className="text-blue-400" size={24} />
                    </span>
                  )}
                </h2>
                <p className="text-gold-400 text-lg font-medium mb-4">{doctor.specialty}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  {(doctor.category === 'doctor' || !doctor.category) && (
                    <span className="px-3 py-1 rounded-full bg-dark-800 border border-white/5 text-xs text-gray-300 flex items-center gap-1">
                      <Award size={12} className="text-gold-500" /> استشاري
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full bg-dark-800 border border-white/5 text-xs text-gray-300 flex items-center gap-1">
                    <Star size={12} className="text-gold-500" /> {averageRating} {reviews.length > 0 && `(${reviews.length} تقييم)`}
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

              {doctor.workingHours && (
                <div className="bg-dark-800/50 rounded-2xl p-5 border border-white/5 flex items-start gap-4 sm:col-span-2">
                  <div className="w-10 h-10 rounded-full bg-dark-900 flex items-center justify-center shrink-0">
                    <Clock className="text-gold-500" size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-500 mb-1">أوقات الدوام</h4>
                    <p className="text-gray-200 text-sm leading-relaxed">{doctor.workingHours}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-gold-500/10 via-gold-500/5 to-transparent rounded-2xl p-6 border border-gold-500/20 flex flex-col items-center justify-center gap-4 mb-8 text-center">
              <div>
                <h4 className="text-gold-400 font-bold mb-1 flex items-center justify-center gap-2">
                  <Calendar size={18} />
                  احجز موعدك الآن
                </h4>
                <p className="text-sm text-gray-400">تواصل مع العيادة مباشرة لتأكيد الحجز</p>
              </div>
              <div className="flex w-full gap-3 mt-2">
                <a 
                  href={getWhatsAppLink(doctor.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-6 py-3 rounded-xl bg-[#0f1f15] text-[#25D366] border border-[#25D366]/30 font-bold text-center hover:bg-[#152e1f] transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  واتساب
                </a>
                <a 
                  href={`tel:${doctor.phone}`}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-gold text-black font-bold text-center hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  <Phone size={18} />
                  اتصال
                </a>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="border-t border-white/10 pt-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageSquare size={20} className="text-gold-500" />
                آراء المراجعين
              </h3>

              {auth.currentUser ? (
                <form onSubmit={handleSubmitReview} className="mb-8 bg-dark-800/30 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-400">تقييمك:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className={`p-1 transition-colors ${star <= newRating ? 'text-gold-500' : 'text-gray-600'}`}
                        >
                          <Star size={20} fill={star <= newRating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="اكتب تجربتك مع الطبيب..."
                      className="flex-1 bg-dark-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gold-500/50"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !newComment.trim()}
                      className="bg-gold-500/20 text-gold-400 px-4 py-2 rounded-lg hover:bg-gold-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mb-8 p-4 bg-dark-800/30 rounded-xl border border-white/5 text-center">
                  <p className="text-sm text-gray-400">يرجى تسجيل الدخول لإضافة تقييم</p>
                </div>
              )}

              <div className="space-y-4">
                {loadingReviews ? (
                  <div className="text-center py-4 text-gray-500">جاري تحميل التقييمات...</div>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-dark-800/50 p-4 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-200">{review.userName}</span>
                        <div className="flex items-center gap-1 text-gold-500">
                          <Star size={14} fill="currentColor" />
                          <span className="text-xs font-bold">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد تقييمات بعد. كن أول من يقيم هذا الطبيب!
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
