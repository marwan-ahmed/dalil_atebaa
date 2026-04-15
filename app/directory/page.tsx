'use client';

import { useState, useEffect } from 'react';
import DoctorCard from '@/components/DoctorCard';
import DoctorDetailsModal from '@/components/DoctorDetailsModal';
import MapWrapper from '@/components/MapWrapper';
import { db } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Doctor, handleFirestoreError, OperationType } from '@/lib/firebase-utils';
import { Search, LayoutGrid, Map as MapIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { STANDARD_SPECIALTIES } from '@/lib/specialties';

export default function DirectoryPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('جميع التخصصات');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  useEffect(() => {
    const q = query(
      collection(db, 'doctors'),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Doctor[];
      
      docsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setDoctors(docsData);
      setLoading(false);
    }, (error: any) => {
      handleFirestoreError(error, OperationType.LIST, 'doctors');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter out specialties that have no doctors, but keep the standard order
  const availableSpecialties = STANDARD_SPECIALTIES.filter(spec => 
    doctors.some(d => d.specialty === spec && (d.category === 'doctor' || !d.category))
  );
  
  // Add any non-standard specialties that might exist in the DB
  const otherSpecialties = Array.from(new Set(doctors.filter(d => d.category === 'doctor' || !d.category).map(d => d.specialty)))
    .filter(spec => spec && !STANDARD_SPECIALTIES.includes(spec));

  const specialties = ['جميع التخصصات', ...availableSpecialties, ...otherSpecialties];

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const docCategory = doc.category || 'doctor';
    const matchesCategory = selectedCategory === 'all' || docCategory === selectedCategory;
    
    // Only apply specialty filter if we are looking at doctors
    const matchesSpecialty = selectedCategory !== 'doctor' && selectedCategory !== 'all' 
      ? true 
      : selectedSpecialty === 'جميع التخصصات' || doc.specialty === selectedSpecialty;
      
    return matchesSearch && matchesCategory && matchesSpecialty;
  });

  const categories = [
    { id: 'all', label: 'جميع الفئات' },
    { id: 'doctor', label: 'الأطباء' },
    { id: 'pharmacy', label: 'الصيدليات' },
    { id: 'lab', label: 'المختبرات' },
    { id: 'nursing', label: 'عيادات التمريض' }
  ];

  return (
    <main className="flex-1 flex flex-col pb-24 md:pb-0">
      <section className="py-4 md:py-8 px-4 md:px-6 bg-dark-950 border-b border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="hidden md:block text-3xl md:text-4xl font-bold text-white mb-6">
            ابحث عن <span className="text-gradient-gold">رعايتك الصحية</span>
          </h1>
          <div className="relative max-w-2xl mx-auto mb-4 md:mb-6">
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <Search className="text-gold-500/50" size={24} />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، التخصص، أو المدينة..."
              className="w-full bg-dark-800/80 backdrop-blur-md border border-gold-500/30 rounded-full py-3 md:py-4 pr-12 md:pr-14 pl-6 text-white text-base md:text-lg focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)]"
            />
          </div>

          {/* Mobile Filters (Dropdowns) */}
          <div className="md:hidden flex flex-row gap-2 mb-2">
            <div className="relative flex-1">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  if (e.target.value !== 'doctor' && e.target.value !== 'all') {
                    setSelectedSpecialty('جميع التخصصات');
                  }
                }}
                className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-3 text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500/50 appearance-none"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            {(selectedCategory === 'all' || selectedCategory === 'doctor') && (
              <div className="relative flex-1">
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-3 text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500/50 appearance-none"
                >
                  {specialties.map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            )}
          </div>
          
          {/* Desktop Filters (Buttons) */}
          <div className="hidden md:block">
            {/* Category Filter */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (cat.id !== 'doctor' && cat.id !== 'all') {
                      setSelectedSpecialty('جميع التخصصات');
                    }
                  }}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                    selectedCategory === cat.id 
                      ? 'bg-gradient-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-105' 
                      : 'bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white border border-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            
            {/* Specialty Filter (Only show if 'all' or 'doctor' is selected) */}
            {(selectedCategory === 'all' || selectedCategory === 'doctor') && (
              <div className="overflow-x-auto custom-scrollbar pb-2 max-w-4xl mx-auto">
                <div className="flex items-center justify-center sm:justify-start gap-2 min-w-max px-2">
                  {specialties.map(specialty => (
                    <button
                      key={specialty}
                      onClick={() => setSelectedSpecialty(specialty)}
                      className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedSpecialty === specialty 
                          ? 'bg-gold-500/20 text-gold-400 border border-gold-500/50' 
                          : 'bg-dark-800 text-gray-300 hover:bg-dark-700 border border-white/5 hover:border-gold-500/30'
                      }`}
                    >
                      {specialty}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-8 px-6 flex-1 bg-dark-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-8 bg-gold-500 rounded-full"></span>
                النتائج
              </h2>
              <span className="text-gray-500 text-sm hidden sm:inline-block">{filteredDoctors.length} نتيجة متاحة</span>
            </div>
            
            <div className="flex items-center bg-dark-800 rounded-xl p-1 border border-white/5">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-dark-900 text-gold-400 shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <LayoutGrid size={18} />
                <span className="text-sm font-medium">شبكة</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-dark-900 text-gold-400 shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <MapIcon size={18} />
                <span className="text-sm font-medium">خريطة</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-dark-800/50 rounded-2xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : filteredDoctors.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors.map((doctor, idx) => (
                  <DoctorCard 
                    key={doctor.id} 
                    doctor={doctor} 
                    index={idx}
                    onClick={setSelectedDoctor} 
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >
                <MapWrapper doctors={filteredDoctors} onDoctorClick={setSelectedDoctor} />
              </motion.div>
            )
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto bg-dark-800 rounded-full flex items-center justify-center mb-4">
                <Search className="text-gray-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">لا توجد نتائج</h3>
              <p className="text-gray-400">لم نتمكن من العثور على أطباء يطابقون بحثك.</p>
            </div>
          )}
        </div>
      </section>

      <DoctorDetailsModal 
        doctor={selectedDoctor} 
        isOpen={!!selectedDoctor} 
        onClose={() => setSelectedDoctor(null)} 
      />
    </main>
  );
}
