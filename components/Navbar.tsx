'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth, signInWithPopup, googleProvider, signOut, isConfigValid, db } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { checkIsAdmin } from '@/lib/firebase-utils';
import { LogIn, LogOut, Shield, User as UserIcon, PlusCircle, Home, Search, Settings, BellRing, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AddDoctorModal from './AddDoctorModal';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const pathname = usePathname();

  const handleTriggerNotification = () => {
    setIsSettingsOpen(false);
    window.dispatchEvent(new Event('trigger-notification-prompt'));
  };

  const handleTriggerInstall = () => {
    setIsSettingsOpen(false);
    window.dispatchEvent(new Event('trigger-install-prompt'));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const adminStatus = await checkIsAdmin(currentUser.uid, currentUser.email);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const loggedUser = result.user;
      
      // Fetch IP and Location
      let ipDetails = { ip: 'غير معروف', city: 'غير معروف', country: 'غير معروف' };
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.ip) {
          ipDetails = { ip: data.ip, city: data.city, country: data.country_name };
        }
      } catch (e) { 
        console.error('IP fetch failed', e); 
      }

      // Save to Firestore
      const userRef = doc(db, 'users', loggedUser.uid);
      const userSnap = await getDoc(userRef);
      
      const userData = {
        name: loggedUser.displayName || 'بدون اسم',
        email: loggedUser.email || '',
        photoURL: loggedUser.photoURL || '',
        lastLogin: new Date(),
        ip: ipDetails.ip,
        location: ipDetails.city !== 'غير معروف' ? `${ipDetails.city}, ${ipDetails.country}` : 'غير معروف',
        role: userSnap.exists() ? userSnap.data().role : 'user'
      };
      
      await setDoc(userRef, userData, { merge: true });
      
    } catch (error: any) {
      console.error("Login failed", error?.message || String(error));
      alert("فشل تسجيل الدخول. تأكد من صحة إعدادات Firebase.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Logout failed", error?.message || String(error));
    }
  };

  const handleAddClick = () => {
    if (user) {
      setIsAddModalOpen(true);
    } else {
      alert("يرجى تسجيل الدخول أولاً لتتمكن من إضافة طبيب.");
      handleLogin();
    }
  };

  return (
    <>
    <nav className="sticky top-0 z-50 glass-panel border-b border-gold-500/20 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center text-black font-bold text-xl">
              د
            </div>
            <span className="text-2xl font-bold text-gradient-gold tracking-wide">دليل أطباء سامراء</span>
          </motion.div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2 rounded-full border border-gold-500/50 text-gold-400 hover:bg-gold-500/10 transition-colors"
              title="الإعدادات المتقدمة"
            >
              <Settings size={20} />
            </button>

            <AnimatePresence>
              {isSettingsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsSettingsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-dark-900 border border-gold-500/30 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col"
                  >
                    <button
                      onClick={handleTriggerNotification}
                      className="flex items-center gap-2 w-full text-right px-4 py-3 text-sm text-gray-200 hover:bg-gold-500/10 hover:text-gold-400 transition-colors border-b border-white/5"
                    >
                      <BellRing size={16} />
                      تفعيل الإشعارات
                    </button>
                    <button
                      onClick={handleTriggerInstall}
                      className="flex items-center gap-2 w-full text-right px-4 py-3 text-sm text-gray-200 hover:bg-gold-500/10 hover:text-gold-400 transition-colors"
                    >
                      <Download size={16} />
                      تثبيت التطبيق
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={handleAddClick}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-gold-500/50 text-gold-400 hover:bg-gold-500/10 transition-colors"
          >
            <PlusCircle size={18} />
            <span>إضافة طبيب</span>
          </button>
          
          {isAdmin && (
            <Link href="/admin" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-dark-800 border border-gold-500/30 text-gray-200 hover:border-gold-500 transition-colors">
              <Shield size={18} className="text-gold-500" />
              <span>لوحة الإدارة</span>
            </Link>
          )}
          
          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="flex flex-col items-end hidden md:flex">
                <span className="text-sm font-medium text-gray-200">{user.displayName}</span>
                <span className="text-xs text-gray-500">{isAdmin ? 'مدير النظام' : 'مستخدم'}</span>
              </div>
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-gold-500/50" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-dark-800 border border-gold-500/50 flex items-center justify-center">
                  <UserIcon size={20} className="text-gold-500" />
                </div>
              )}
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="تسجيل الخروج">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="hidden md:flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-gold text-black font-bold hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all"
            >
              <LogIn size={18} />
              <span>تسجيل الدخول</span>
            </button>
          )}
        </div>
      </div>
    </nav>
    
    {/* Bottom Navigation for Mobile */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-gold-500/20 pb-safe">
      <div className="flex items-center justify-around p-3">
        <Link href="/" className={`flex flex-col items-center gap-1 ${pathname === '/' ? 'text-gold-400' : 'text-gray-500'}`}>
          <Home size={24} />
          <span className="text-[10px] font-medium">الرئيسية</span>
        </Link>
        
        <Link href="/directory" className={`flex flex-col items-center gap-1 ${pathname === '/directory' ? 'text-gold-400' : 'text-gray-500'}`}>
          <Search size={24} />
          <span className="text-[10px] font-medium">الدليل</span>
        </Link>
        
        <button onClick={handleAddClick} className="flex flex-col items-center gap-1 text-gray-500 hover:text-gold-400">
          <PlusCircle size={24} />
          <span className="text-[10px] font-medium">إضافة</span>
        </button>

        {isAdmin && (
          <Link href="/admin" className={`flex flex-col items-center gap-1 ${pathname === '/admin' ? 'text-gold-400' : 'text-gray-500'}`}>
            <Shield size={24} />
            <span className="text-[10px] font-medium">الإدارة</span>
          </Link>
        )}
        
        {!user ? (
          <button onClick={handleLogin} className="flex flex-col items-center gap-1 text-gray-500 hover:text-gold-400">
            <LogIn size={24} />
            <span className="text-[10px] font-medium">دخول</span>
          </button>
        ) : (
          <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-400">
            <LogOut size={24} />
            <span className="text-[10px] font-medium">خروج</span>
          </button>
        )}
      </div>
    </div>

    <AddDoctorModal 
      isOpen={isAddModalOpen} 
      onClose={() => setIsAddModalOpen(false)} 
    />
    </>
  );
}
