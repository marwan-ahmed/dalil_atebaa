import { db, auth } from '@/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp, onSnapshot } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  let errorMessage = 'Unknown error';
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    try {
      errorMessage = String(error);
    } catch (e) {
      errorMessage = 'Unstringifiable error';
    }
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  
  const errString = JSON.stringify(errInfo);
  console.error('Firestore Error: ', errString);
  throw new Error(errString);
}

export interface Doctor {
  id?: string;
  name: string;
  specialty: string;
  address: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  addedBy: string;
  addedByEmail?: string;
  addedByName?: string;
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

export interface Review {
  id?: string;
  doctorId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt?: any;
}

export const addDoctor = async (doctorData: Omit<Doctor, 'id' | 'status' | 'addedBy' | 'createdAt' | 'addedByEmail' | 'addedByName'>) => {
  if (!auth.currentUser) throw new Error("يجب تسجيل الدخول لإضافة طبيب");
  
  const newDoctor: Doctor = {
    ...doctorData,
    status: 'pending',
    addedBy: auth.currentUser.uid,
    addedByEmail: auth.currentUser.email || 'غير معروف',
    addedByName: auth.currentUser.displayName || 'مستخدم',
    createdAt: serverTimestamp()
  };
  
  try {
    return await addDoc(collection(db, 'doctors'), newDoctor);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'doctors');
    throw error;
  }
};

export const updateDoctorStatus = async (doctorId: string, status: 'approved' | 'rejected') => {
  const doctorRef = doc(db, 'doctors', doctorId);
  try {
    return await updateDoc(doctorRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `doctors/${doctorId}`);
    throw error;
  }
};

export const updateDoctorDetails = async (doctorId: string, data: Partial<Omit<Doctor, 'id' | 'addedBy' | 'createdAt'>>) => {
  const doctorRef = doc(db, 'doctors', doctorId);
  try {
    return await updateDoc(doctorRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `doctors/${doctorId}`);
    throw error;
  }
};

export const deleteDoctor = async (doctorId: string) => {
  const doctorRef = doc(db, 'doctors', doctorId);
  try {
    return await deleteDoc(doctorRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `doctors/${doctorId}`);
    throw error;
  }
};

export const checkIsAdmin = async (uid: string, email: string | null) => {
  if (email === 'reddevil.abualror91@gmail.com') return true;
  
  try {
    const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', uid)));
    if (!userDoc.empty) {
      return userDoc.docs[0].data().role === 'admin';
    }
  } catch (e: any) {
    handleFirestoreError(e, OperationType.GET, `users/${uid}`);
  }
  return false;
};

export const addReview = async (reviewData: Omit<Review, 'id' | 'userId' | 'userName' | 'createdAt'>) => {
  if (!auth.currentUser) throw new Error("يجب تسجيل الدخول لإضافة تقييم");
  
  const newReview: Review = {
    ...reviewData,
    userId: auth.currentUser.uid,
    userName: auth.currentUser.displayName || 'مستخدم',
    createdAt: serverTimestamp()
  };
  
  try {
    return await addDoc(collection(db, 'reviews'), newReview);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'reviews');
    throw error;
  }
};
