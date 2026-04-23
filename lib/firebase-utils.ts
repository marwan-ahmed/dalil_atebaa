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
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String((error as any).message);
  } else {
    try {
      errorMessage = JSON.stringify(error);
    } catch (e) {
      errorMessage = String(error);
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
  category?: 'doctor' | 'pharmacy' | 'lab' | 'nursing';
  workingHours?: string;
  isVerified?: boolean;
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
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
}

export interface Specialty {
  id?: string;
  name: string;
  order: number;
  createdAt?: any;
}

export const addDoctor = async (doctorData: Omit<Doctor, 'id' | 'status' | 'addedBy' | 'createdAt' | 'addedByEmail' | 'addedByName'>) => {
  if (!auth.currentUser) throw new Error("يجب تسجيل الدخول لإضافة طبيب");
  
  // Clean up undefined values (like lat, lng if not provided)
  const cleanedData = { ...doctorData };
  if (cleanedData.lat === undefined) delete cleanedData.lat;
  if (cleanedData.lng === undefined) delete cleanedData.lng;
  
  const newDoctor: Doctor = {
    ...cleanedData,
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
  const cleanedData = { ...data };
  if (cleanedData.lat === undefined) delete cleanedData.lat;
  if (cleanedData.lng === undefined) delete cleanedData.lng;
  
  try {
    return await updateDoc(doctorRef, cleanedData);
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

export const addReview = async (reviewData: Omit<Review, 'id' | 'userId' | 'userName' | 'status' | 'createdAt'>) => {
  if (!auth.currentUser) throw new Error("يجب تسجيل الدخول لإضافة تقييم");
  
  const newReview: Review = {
    ...reviewData,
    userId: auth.currentUser.uid,
    userName: auth.currentUser.displayName || 'مستخدم',
    status: 'pending',
    createdAt: serverTimestamp()
  };
  
  try {
    return await addDoc(collection(db, 'reviews'), newReview);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'reviews');
    throw error;
  }
};

export const updateReviewStatus = async (reviewId: string, status: 'approved' | 'rejected') => {
  const reviewRef = doc(db, 'reviews', reviewId);
  try {
    return await updateDoc(reviewRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reviews/${reviewId}`);
    throw error;
  }
};

export const deleteReview = async (reviewId: string) => {
  const reviewRef = doc(db, 'reviews', reviewId);
  try {
    return await deleteDoc(reviewRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `reviews/${reviewId}`);
    throw error;
  }
};

export const addSpecialty = async (name: string, order: number) => {
  try {
    return await addDoc(collection(db, 'specialties'), {
      name,
      order,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'specialties');
    throw error;
  }
};

export const updateSpecialty = async (id: string, data: Partial<Omit<Specialty, 'id' | 'createdAt'>>) => {
  const specialtyRef = doc(db, 'specialties', id);
  try {
    return await updateDoc(specialtyRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `specialties/${id}`);
    throw error;
  }
};

export const deleteSpecialty = async (id: string) => {
  const specialtyRef = doc(db, 'specialties', id);
  try {
    return await deleteDoc(specialtyRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `specialties/${id}`);
    throw error;
  }
};
