'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import DoctorCard from '@/components/DoctorCard';
import DoctorDetailsModal from '@/components/DoctorDetailsModal';
import AddDoctorModal from '@/components/AddDoctorModal';
import MapWrapper from '@/components/MapWrapper';
import { db } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Doctor } from '@/lib/firebase-utils';
import { Search, Activity, LayoutGrid, Map as MapIcon } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  useEffect(() => {
    // Listen to approved doctors
    const q = query(
      collection(db, 'doctors'),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Doctor[];
      
      // Sort client-side if we don't have a composite index for status + createdAt
      docsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setDoctors(docsData);
      setLoading(false);
    }, (error: any) => {
      console.error("Error fetching doctors:", error?.message || String(error));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredDoctors = doctors.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Navbar onAddClick={() => setIsAddModalOpen(true)} />
      
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative py-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold-500/10 via-dark-900 to-dark-950" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dark-800/80 border border-gold-500/30 text-gold-400 text-sm mb-6"
            >
              <Activity size={16} />
              <span>نخبة الرعاية الصحية في مكان واحد</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
            >
              ابحث عن <span className="text-gradient-gold">طبيبك المختص</span> <br className="hidden md:block" />بكل سهولة
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto"
            >
              دليل شامل يضم أفضل الأطباء والاستشاريين في مختلف التخصصات الطبية، مع تفاصيل كاملة للحجز والتواصل.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative max-w-2xl mx-auto"
            >
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <Search className="text-gold-500/50" size={24} />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، التخصص، أو المدينة..."
                className="w-full bg-dark-800/80 backdrop-blur-md border border-gold-500/30 rounded-full py-4 pr-14 pl-6 text-white text-lg focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)]"
              />
            </motion.div>
          </div>
        </section>

        {/* Doctors Grid / Map */}
        <section className="py-12 px-6 flex-1 bg-dark-950">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-8 bg-gold-500 rounded-full"></span>
                  قائمة الأطباء
                </h2>
                <span className="text-gray-500 text-sm hidden sm:inline-block">{filteredDoctors.length} طبيب متاح</span>
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
      </main>

      <DoctorDetailsModal 
        doctor={selectedDoctor} 
        isOpen={!!selectedDoctor} 
        onClose={() => setSelectedDoctor(null)} 
      />
      
      <AddDoctorModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </>
  );
}
