'use client';

import dynamic from 'next/dynamic';

const LocationPickerMap = dynamic(() => import('./LocationPickerMap'), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-[250px] bg-dark-800/50 rounded-xl border border-white/5 animate-pulse flex items-center justify-center">
      <span className="text-gray-500 text-sm">جاري تحميل الخريطة...</span>
    </div>
  ) 
});

export default function LocationPickerWrapper({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  return <LocationPickerMap onLocationSelect={onLocationSelect} />;
}
