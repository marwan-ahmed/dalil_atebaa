'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Activity, Star } from 'lucide-react';
import { db } from '@/firebase';
import { collection, getDocs, getCountFromServer, query, where } from 'firebase/firestore';

// Animated Counter Component
function Counter({ value, label, icon: Icon, delay }: { value: number, label: string, icon: any, delay: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) {
      return;
    }
    
    let start = 0;
    const end = value;
    const duration = 2000; // 2 seconds
    const increment = end / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col items-center justify-center p-6 rounded-3xl bg-dark-800/50 border border-gold-500/10 hover:border-gold-500/30 transition-colors"
    >
      <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center mb-4">
        <Icon className="text-gold-500" size={24} />
      </div>
      <div className="text-3xl md:text-4xl font-bold text-white mb-2" dir="ltr">
        +{count}
      </div>
      <div className="text-gray-400 text-sm md:text-base">{label}</div>
    </motion.div>
  );
}

export default function LiveStats() {
  const [stats, setStats] = useState({
    doctors: 0,
    pharmacies: 0,
    reviews: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch all approved entities (single where clause avoids composite index requirement)
        const approvedQuery = query(
          collection(db, 'doctors'), 
          where('status', '==', 'approved')
        );
        
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('status', '==', 'approved')
        );

        const [approvedDocsSnap, reviewsSnap] = await Promise.all([
          getDocs(approvedQuery),
          getCountFromServer(reviewsQuery)
        ]);

        let doctorsCount = 0;
        let pharmaciesCount = 0;

        approvedDocsSnap.forEach((doc) => {
          const cat = doc.data().category;
          if (cat === 'pharmacy' || cat === 'lab') {
            pharmaciesCount++;
          } else {
            doctorsCount++;
          }
        });

        setStats({
          doctors: doctorsCount,
          pharmacies: pharmaciesCount,
          reviews: reviewsSnap.data().count
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Set to 0 if there's an error, do not use fake numbers
        setStats({
          doctors: 0,
          pharmacies: 0,
          reviews: 0
        });
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12 w-full px-4">
      <Counter value={stats.doctors} label="طبيب وعيادة" icon={Users} delay={0.5} />
      <Counter value={stats.pharmacies} label="صيدلية ومختبر" icon={Activity} delay={0.6} />
      <Counter value={stats.reviews} label="تقييم من المرضى" icon={Star} delay={0.7} />
    </div>
  );
}
