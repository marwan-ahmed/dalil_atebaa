'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { MapPin, Search, Heart } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="flex-1 flex flex-col pb-24 md:pb-0 items-center justify-center min-h-[calc(100vh-80px)]">
      <section className="relative w-full py-20 px-6 overflow-hidden flex-1 flex flex-col justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold-500/10 via-dark-900 to-dark-950" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dark-800/80 border border-gold-500/30 text-gold-400 text-sm mb-6"
          >
            <MapPin size={16} />
            <span>العراق - سامراء</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
          >
            دليل أطباء <span className="text-gradient-gold">سامراء</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-gray-300 mb-6 max-w-2xl mx-auto leading-relaxed"
          >
            خدمة مجتمعية تهدف إلى تسهيل عملية البحث عن الأطباء والعيادات الطبية في مدينة سامراء. 
            نجمع لك نخبة الرعاية الصحية في مكان واحد لتوفير وقتك وجهدك.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 text-gray-400 text-sm md:text-base mb-12"
          >
            <Heart size={18} className="text-red-500" />
            <span>مطور بواسطة: <strong className="text-gold-400">مروان أحمد</strong></span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link 
              href="/directory"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-gold text-black font-bold text-lg hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all hover:scale-105"
            >
              <Search size={24} />
              <span>تصفح الدليل الآن</span>
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
