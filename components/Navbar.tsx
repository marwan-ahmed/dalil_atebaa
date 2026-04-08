'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth, signInWithPopup, googleProvider, signOut, isConfigValid } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { checkIsAdmin } from '@/lib/firebase-utils';
import { LogIn, LogOut, Shield, User as UserIcon, PlusCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Navbar({ onAddClick }: { onAddClick?: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
    if (!isConfigValid) {
      alert("إعدادات Firebase غير مكتملة. يرجى إضافة الإعدادات الصحيحة لتتمكن من تسجيل الدخول.");
      return;
    }
    
    try {
      await signInWithPopup(auth, googleProvider);
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

  return (
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
            <span className="text-2xl font-bold text-gradient-gold tracking-wide">دليل الأطباء</span>
          </motion.div>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {onAddClick && (
                <button 
                  onClick={onAddClick}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-gold-500/50 text-gold-400 hover:bg-gold-500/10 transition-colors"
                >
                  <PlusCircle size={18} />
                  <span>إضافة طبيب</span>
                </button>
              )}
              
              {isAdmin && (
                <Link href="/admin" className="flex items-center gap-2 px-4 py-2 rounded-full bg-dark-800 border border-gold-500/30 text-gray-200 hover:border-gold-500 transition-colors">
                  <Shield size={18} className="text-gold-500" />
                  <span className="hidden md:inline">لوحة الإدارة</span>
                </Link>
              )}
              
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
            </>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-gold text-black font-bold hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all"
            >
              <LogIn size={18} />
              <span>تسجيل الدخول</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
