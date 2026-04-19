'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { MapPin, Search, Heart, Target, Shield, CheckCircle, MessageCircle, Facebook, Instagram, Github } from 'lucide-react';
import LiveStats from '@/components/LiveStats';

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    'name': 'دليل أطباء سامراء',
    'description': 'الدليل الطبي الأول والوحيد لمدينة سامراء يجمع النخبة من الأطباء والعيادات والمختبرات الخاصة.',
    'url': 'https://samarra-doctors.com',
    'logo': 'https://samarra-doctors.com/icons/icon-512x512.png',
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': 'سامراء',
      'addressRegion': 'صلاح الدين',
      'addressCountry': 'IQ'
    },
    'keywords': 'أطباء سامراء, حجز اطباء سامراء, عيادات سامراء, دكتور سامراء'
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="flex-1 flex flex-col pb-24 md:pb-0 min-h-[calc(100vh-80px)]">
      {/* Hero Section */}
      <section className="relative w-full py-20 px-6 overflow-hidden flex flex-col justify-center min-h-[80vh]">
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
            className="mb-8"
          >
            <Link 
              href="/directory"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-gold text-black font-bold text-lg hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all hover:scale-105"
            >
              <Search size={24} />
              <span>تصفح الدليل الآن</span>
            </Link>
          </motion.div>

          <LiveStats />
        </div>
      </section>

      {/* About Us Section */}
      <section className="relative w-full py-20 px-6 bg-dark-900 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">نبذة <span className="text-gradient-gold">عنا</span></h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              نحن نؤمن بأن الوصول إلى الرعاية الصحية يجب أن يكون سهلاً، سريعاً، ومتاحاً للجميع في مدينتنا.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-dark-800/50 p-8 rounded-3xl border border-gold-500/10 hover:border-gold-500/30 transition-colors"
            >
              <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center mb-6">
                <Target className="text-gold-500" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">مهمتنا</h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                توفير منصة رقمية متكاملة وموثوقة تجمع كافة الكيانات الطبية في مدينة سامراء، لتسهيل عملية البحث والتواصل بين المريض ومقدمي الرعاية الصحية، مع ضمان دقة وتحديث المعلومات باستمرار.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-dark-800/50 p-8 rounded-3xl border border-gold-500/10 hover:border-gold-500/30 transition-colors"
            >
              <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center mb-6">
                <Shield className="text-gold-500" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">قيمنا</h3>
              <ul className="space-y-4 text-gray-300 text-lg">
                <li className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-gold-500 shrink-0" /> 
                  <span>الموثوقية والدقة العالية في عرض المعلومات</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-gold-500 shrink-0" /> 
                  <span>سهولة الاستخدام لتناسب جميع الفئات العمرية</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-gold-500 shrink-0" /> 
                  <span>خدمة المجتمع المحلي وتطوير واقعه التقني</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Developer Portfolio Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-dark-800 to-dark-950 p-8 md:p-12 rounded-3xl border border-gold-500/20 text-center relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-2">تطوير وبرمجة</h3>
              <p className="text-gold-400 text-xl font-bold mb-6">مروان أحمد</p>
              <p className="text-gray-400 mb-10 max-w-2xl mx-auto text-lg leading-relaxed">
                مطور برمجيات مهتم ببناء حلول رقمية تخدم المجتمع وتسهل الحياة اليومية. يسعدني تواصلكم لتقديم المقترحات، الملاحظات، أو لطلبات التطوير البرمجي.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                <a 
                  href="https://wa.me/9647815262001" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all border border-[#25D366]/20 hover:scale-105"
                  title="تواصل عبر واتساب"
                >
                  <MessageCircle size={20} />
                  <span className="font-bold tracking-wider" dir="ltr">0781 526 2001</span>
                </a>
                <a 
                  href="http://facebook.com/abualror" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-3 rounded-xl bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 transition-all border border-[#1877F2]/20 hover:scale-105"
                  title="فيسبوك"
                >
                  <Facebook size={24} />
                </a>
                <a 
                  href="https://www.instagram.com/marwan.ahmed.it" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-3 rounded-xl bg-[#E4405F]/10 text-[#E4405F] hover:bg-[#E4405F]/20 transition-all border border-[#E4405F]/20 hover:scale-105"
                  title="إنستغرام"
                >
                  <Instagram size={24} />
                </a>
                <a 
                  href="https://github.com/marwan-ahmed" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-3 rounded-xl bg-gray-500/10 text-gray-300 hover:bg-gray-500/20 transition-all border border-gray-500/20 hover:scale-105"
                  title="جيت هاب (GitHub)"
                >
                  <Github size={24} />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
    </>
  );
}
