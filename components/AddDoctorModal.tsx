'use client';

import { useState, useEffect } from 'react';
import { addDoctor } from '@/lib/firebase-utils';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import LocationPickerWrapper from './LocationPickerWrapper';
import { useSpecialties } from '@/hooks/useSpecialties';

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddDoctorModal({ isOpen, onClose }: AddDoctorModalProps) {
  const { specialties } = useSpecialties();
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    address: '',
    phone: '',
    category: 'doctor' as 'doctor' | 'pharmacy' | 'lab' | 'nursing',
    workingHours: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (specialties.length > 0 && !formData.specialty) {
      setFormData(prev => ({ ...prev, specialty: specialties[0].name }));
    }
  }, [specialties, formData.specialty]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await addDoctor(formData);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({ name: '', specialty: specialties[0]?.name || '', address: '', phone: '', category: 'doctor', workingHours: '', lat: undefined, lng: undefined });
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الإضافة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
          className="relative w-full max-w-2xl bg-dark-900 border border-gold-500/20 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-dark-800/50 text-gray-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <X size={20} />
          </button>

          <h2 className="text-2xl font-bold text-white mb-2">إضافة طبيب جديد</h2>
          <p className="text-gray-400 text-sm mb-6">سيتم مراجعة البيانات من قبل الإدارة قبل نشرها في الدليل.</p>

          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <CheckCircle2 size={64} className="text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">تمت الإضافة بنجاح!</h3>
              <p className="text-gray-400">شكراً لك، سيتم مراجعة طلبك قريباً.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">نوع الكيان الطبي</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'doctor', label: 'طبيب/عيادة' },
                      { id: 'pharmacy', label: 'صيدلية' },
                      { id: 'lab', label: 'مختبر تحليلات' },
                      { id: 'nursing', label: 'عيادة تمريض' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({...formData, category: cat.id as any, specialty: cat.id === 'doctor' ? (specialties[0]?.name || '') : cat.label})}
                        className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                          formData.category === cat.id 
                            ? 'bg-gold-500/20 border-gold-500 text-gold-400' 
                            : 'bg-dark-800 border-white/10 text-gray-400 hover:bg-dark-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">الاسم</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all"
                    placeholder={formData.category === 'doctor' ? "د. أحمد محمد" : "اسم الكيان (مثال: صيدلية الشفاء)"}
                  />
                </div>
                
                {formData.category === 'doctor' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">التخصص</label>
                    <select 
                      required
                      value={formData.specialty}
                      onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                      className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all appearance-none"
                    >
                      {specialties.map(spec => (
                        <option key={spec.id} value={spec.name}>{spec.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">العنوان</label>
                  <input 
                    type="text" 
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all"
                    placeholder="سامراء، شارع الأطباء"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">رقم هاتف الحجز</label>
                  <input 
                    type="tel" 
                    required
                    pattern="^(077|078|079|075)\d{8}$"
                    title="يجب أن يبدأ الرقم بـ 077 أو 078 أو 079 أو 075 ويتكون من 11 رقماً"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all text-right"
                    placeholder="07700000000"
                    dir="ltr"
                  />
                </div>

                <div className={formData.category === 'doctor' ? "md:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">أوقات الدوام</label>
                  <input 
                    type="text" 
                    value={formData.workingHours}
                    onChange={(e) => setFormData({...formData, workingHours: e.target.value})}
                    className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all"
                    placeholder="مثال: من 4 عصراً إلى 9 مساءً"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">موقع العيادة على الخريطة (اختياري)</label>
                <LocationPickerWrapper 
                  onLocationSelect={(lat, lng) => setFormData({...formData, lat, lng})} 
                />
                {formData.lat && formData.lng && (
                  <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                    <CheckCircle2 size={12} /> تم تحديد الموقع بنجاح
                  </p>
                )}
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-gold text-black font-bold hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-6"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'إرسال للمراجعة'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
