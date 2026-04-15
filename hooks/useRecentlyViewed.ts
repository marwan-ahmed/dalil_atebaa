'use client';

import { useState, useEffect } from 'react';

export function useRecentlyViewed() {
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('doctor_recent');
    if (stored) {
      try {
        setRecentIds(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent', e);
      }
    }
  }, []);

  const addRecent = (id: string) => {
    setRecentIds(prev => {
      const filtered = prev.filter(f => f !== id);
      const newRecent = [id, ...filtered].slice(0, 5); // Keep last 5
      localStorage.setItem('doctor_recent', JSON.stringify(newRecent));
      return newRecent;
    });
  };

  return { recentIds, addRecent };
}
