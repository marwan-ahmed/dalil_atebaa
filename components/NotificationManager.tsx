'use client';

import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app, auth, db } from '@/firebase';
import { doc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function NotificationManager() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          // Show our custom UI to ask for notification permission smoothly
          setShowPrompt(true);
        } else if (Notification.permission === 'granted') {
          setupMessaging(currentUser);
        }
      } else {
         setShowPrompt(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const setupMessaging = async (currentUser: User) => {
    try {
      const supported = await isSupported();
      if (!supported) return;
      
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: 'BBv7j6KrVeukJ01R9Mqb7ZofnBv6mIzhWsujKTuYxcedLHejSbuEQpBFgCeyhkL7xd2UCEnNrg6kDoZRK_egAmo'
      });
      
      if (token && currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        // Save the token array if not exists
        if (userSnap.exists()) {
          await updateDoc(userRef, { fcmTokens: arrayUnion(token) });
        } else {
          // Only if missing entirely
          await setDoc(userRef, { role: 'user', fcmTokens: [token] });
        }
      }
      
      // Handle foreground messages
      onMessage(messaging, (payload) => {
        if (payload.notification) {
          new Notification(payload.notification.title || 'إشعار جديد', {
            body: payload.notification.body,
            icon: '/favicon.ico',
            dir: 'rtl'
          });
        }
      });
    } catch (error) {
      console.error('FCM Setup failed:', error);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted' && user) {
        await setupMessaging(user);
      }
      setShowPrompt(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-4 right-4 bg-dark-800 border border-gold-500/30 p-4 rounded-xl shadow-xl shadow-black/50 z-50 max-w-sm flex flex-col gap-3"
          dir="rtl"
        >
          <div className="flex items-center gap-3">
            <div className="bg-gold-500/10 p-2 rounded-lg">
               <BellRing className="text-gold-500 shrink-0" size={24} />
            </div>
            <h4 className="text-white font-bold">تفعيل الإشعارات</h4>
          </div>
          <p className="text-sm text-gray-400">
            قم بتفعيل الإشعارات حتى نتمكن من إخبارك فور قبول الأطباء أو التقييمات التي تقترحها!
          </p>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={handleEnableNotifications}
              className="flex-1 bg-gold-500 hover:bg-gold-600 text-dark-900 font-bold py-2 rounded-lg text-sm transition-colors"
            >
              تفعيل الآن
            </button>
            <button 
              onClick={() => setShowPrompt(false)}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm transition-colors"
            >
              لاحقاً
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
