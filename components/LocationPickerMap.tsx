'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect } from 'react';

const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function LocationMarker({ position, setPosition }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={customIcon}></Marker>
  );
}

export default function LocationPickerMap({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  
  const handleSetPosition = (latlng: L.LatLng) => {
    setPosition(latlng);
    onLocationSelect(latlng.lat, latlng.lng);
  };

  // Default center (e.g., Riyadh)
  const center: [number, number] = [24.7136, 46.6753];

  return (
    <div className="w-full h-[250px] rounded-xl overflow-hidden border border-white/10 relative z-0">
      <MapContainer center={center} zoom={5} className="w-full h-full">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <LocationMarker position={position} setPosition={handleSetPosition} />
      </MapContainer>
      <div className="absolute bottom-2 right-2 z-[1000] bg-dark-900/80 backdrop-blur-sm text-xs text-gold-400 px-3 py-1.5 rounded-lg border border-gold-500/20 pointer-events-none">
        انقر على الخريطة لتحديد الموقع
      </div>
    </div>
  );
}
