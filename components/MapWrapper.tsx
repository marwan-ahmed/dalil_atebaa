'use client';

import dynamic from 'next/dynamic';
import { Doctor } from '@/lib/firebase-utils';

const DoctorsMap = dynamic(() => import('./DoctorsMap'), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-[600px] bg-dark-800/50 rounded-3xl border border-white/5 animate-pulse flex items-center justify-center">
      <div className="text-gold-500 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin"></div>
        <span className="font-medium">جاري تحميل الخريطة...</span>
      </div>
    </div>
  ) 
});

export default function MapWrapper({ doctors, onDoctorClick }: { doctors: Doctor[], onDoctorClick: (d: Doctor) => void }) {
  return <DoctorsMap doctors={doctors} onDoctorClick={onDoctorClick} />;
}
