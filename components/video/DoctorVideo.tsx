import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const DoctorVideo: React.FC<{ doctor: any }> = ({ doctor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const logoY = spring({ frame, fps, config: { damping: 12 } });
  const nameScale = spring({ frame: frame - 15, fps, config: { damping: 14 } });
  const detailsOpacity = interpolate(frame, [30, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ctaY = spring({ frame: frame - 60, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ backgroundColor: '#020617', color: 'white', fontFamily: 'system-ui, sans-serif', direction: 'rtl' }}>
      {/* Background Elements */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 100%)' }} />
      
      {/* Animated Particles/Shapes (Static for simplicity, but adds texture) */}
      <div style={{ position: 'absolute', top: '10%', right: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '20%', left: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '60px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        
        {/* Header */}
        <div style={{ transform: `translateY(${(1 - logoY) * -100}px)`, opacity: logoY, marginBottom: '100px' }}>
          <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', fontWeight: 'bold', color: '#000', margin: '0 auto 30px', boxShadow: '0 10px 30px rgba(212,175,55,0.3)' }}>
            د
          </div>
          <h2 style={{ fontSize: '50px', color: '#D4AF37', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>دليل أطباء سامراء</h2>
        </div>

        {/* Doctor Info */}
        <div style={{ transform: `scale(${nameScale})`, opacity: nameScale, marginBottom: '80px', width: '100%' }}>
          <h1 style={{ fontSize: '90px', fontWeight: '900', margin: '0 0 30px 0', color: '#ffffff', textShadow: '0 4px 20px rgba(0,0,0,0.5)', lineHeight: '1.2' }}>
            {doctor?.name || 'اسم الطبيب'}
          </h1>
          <div style={{ display: 'inline-block', background: 'rgba(212, 175, 55, 0.15)', border: '3px solid #D4AF37', padding: '20px 50px', borderRadius: '60px', fontSize: '50px', color: '#D4AF37', fontWeight: 'bold', backdropFilter: 'blur(10px)' }}>
            {doctor?.specialty || 'التخصص'}
          </div>
        </div>

        {/* Details */}
        <div style={{ opacity: detailsOpacity, display: 'flex', flexDirection: 'column', gap: '30px', marginBottom: '100px', width: '100%', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px', fontSize: '45px', color: '#e2e8f0', background: 'rgba(255,255,255,0.05)', padding: '30px 50px', borderRadius: '30px', width: '90%', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '50px' }}>📍</span>
            <span>{doctor?.address || 'العنوان'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px', fontSize: '55px', color: '#ffffff', background: 'rgba(212,175,55,0.1)', padding: '30px 50px', borderRadius: '30px', width: '90%', justifyContent: 'center', border: '1px solid rgba(212,175,55,0.2)', direction: 'ltr' }}>
            <span style={{ fontSize: '50px' }}>📞</span>
            <span style={{ fontWeight: 'bold', letterSpacing: '2px' }}>{doctor?.phone || 'رقم الهاتف'}</span>
          </div>
        </div>

        {/* CTA */}
        <div style={{ transform: `translateY(${(1 - ctaY) * 100}px)`, opacity: ctaY, marginTop: 'auto' }}>
          <div style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)', color: '#000', padding: '40px 100px', borderRadius: '80px', fontSize: '60px', fontWeight: '900', boxShadow: '0 15px 40px rgba(212, 175, 55, 0.4)' }}>
            احجز موعدك الآن
          </div>
        </div>

      </div>
    </AbsoluteFill>
  );
};
