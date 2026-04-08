import { db, auth } from '@/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp, onSnapshot } from 'firebase/firestore';

export interface Doctor {
  id?: string;
  name: string;
  specialty: string;
  address: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  addedBy: string;
  lat?: number;
  lng?: number;
  createdAt?: any;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt?: any;
}

export const addDoctor = async (doctorData: Omit<Doctor, 'id' | 'status' | 'addedBy' | 'createdAt'>) => {
  if (!auth.currentUser) throw new Error("يجب تسجيل الدخول لإضافة طبيب");
  
  const newDoctor: Doctor = {
    ...doctorData,
    status: 'pending',
    addedBy: auth.currentUser.uid,
    createdAt: serverTimestamp()
  };
  
  return await addDoc(collection(db, 'doctors'), newDoctor);
};

export const updateDoctorStatus = async (doctorId: string, status: 'approved' | 'rejected') => {
  const doctorRef = doc(db, 'doctors', doctorId);
  return await updateDoc(doctorRef, { status });
};

export const deleteDoctor = async (doctorId: string) => {
  const doctorRef = doc(db, 'doctors', doctorId);
  return await deleteDoc(doctorRef);
};

export const checkIsAdmin = async (uid: string, email: string | null) => {
  if (email === 'reddevil.abualror91@gmail.com') return true;
  
  try {
    const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', uid)));
    if (!userDoc.empty) {
      return userDoc.docs[0].data().role === 'admin';
    }
    } catch (e: any) {
    console.error("Error checking admin status", e?.message || String(e));
  }
  return false;
};
