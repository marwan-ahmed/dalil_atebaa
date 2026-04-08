'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Doctor } from '@/lib/firebase-utils';

// Fix Leaflet icon issue
const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function DoctorsMap({ doctors, onDoctorClick }: { doctors: Doctor[], onDoctorClick: (d: Doctor) => void }) {
  // Default center (e.g., Riyadh)
  const center: [number, number] = [24.7136, 46.6753];

  return (
    <div className="w-full h-[600px] rounded-3xl overflow-hidden border border-gold-500/20 shadow-[0_0_30px_rgba(212,175,55,0.05)] relative z-0">
      <MapContainer center={center} zoom={6} className="w-full h-full">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {doctors.filter(d => d.lat && d.lng).map(doctor => (
          <Marker 
            key={doctor.id} 
            position={[doctor.lat!, doctor.lng!]} 
            icon={customIcon}
            eventHandlers={{
              click: () => onDoctorClick(doctor),
            }}
          >
            <Popup className="custom-popup">
              <div className="text-right font-sans" dir="rtl">
                <strong className="block text-lg text-gold-400 mb-1">د. {doctor.name}</strong>
                <span className="block text-gray-300 text-sm mb-2">{doctor.specialty}</span>
                <span className="text-xs text-gold-500/80 cursor-pointer hover:text-gold-400 transition-colors">
                  اضغط لعرض التفاصيل &larr;
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
