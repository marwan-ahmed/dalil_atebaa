'use client';

import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Specialty, handleFirestoreError, OperationType } from '@/lib/firebase-utils';

export function useSpecialties() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = 'specialties';
    const q = query(collection(db, path), orderBy('order', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Specialty[];
      setSpecialties(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { specialties, loading };
}
