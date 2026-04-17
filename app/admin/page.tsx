'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/firebase';
import { collection, query, onSnapshot, orderBy, writeBatch, doc } from 'firebase/firestore';
import { Doctor, updateDoctorStatus, deleteDoctor, updateDoctorDetails, checkIsAdmin, handleFirestoreError, OperationType, Review, updateReviewStatus, deleteReview } from '@/lib/firebase-utils';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Trash2, Clock, Users, Activity, ShieldAlert, Upload, FileText, Edit, X, User as UserIcon, MapPin, MonitorSmartphone, MessageSquare, Star } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { normalizeSpecialty, STANDARD_SPECIALTIES } from '@/lib/specialties';
import VideoPreviewModal from '@/components/VideoPreviewModal';

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [bulkText, setBulkText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'doctors' | 'users' | 'reviews'>('doctors');
  
  // New states for bulk delete and edit
  const [selectedDoctors, setSelectedDoctors] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editForm, setEditForm] = useState({ name: '', specialty: '', phone: '', address: '', category: 'doctor' as any, workingHours: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // Video Modal State
  const [videoDoctor, setVideoDoctor] = useState<Doctor | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const adminStatus = await checkIsAdmin(user.uid, user.email);
        setIsAdmin(adminStatus);
        if (!adminStatus) {
          router.push('/');
        }
      } else {
        setIsAdmin(false);
        router.push('/');
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (isAdmin !== true) return;

    const q = query(collection(db, 'doctors'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Doctor[];
      
      docsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setDoctors(docsData);
      setLoading(false);
    }, (error: any) => {
      handleFirestoreError(error, OperationType.LIST, 'doctors');
      setLoading(false);
    });

    // Fetch Users
    const uQuery = query(collection(db, 'users'));
    const uUnsubscribe = onSnapshot(uQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      usersData.sort((a: any, b: any) => {
        const timeA = a.lastLogin?.toMillis?.() || 0;
        const timeB = b.lastLogin?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setUsersList(usersData);
    }, (error: any) => {
      console.error("Error fetching users:", error);
    });

    // Fetch Reviews
    const rQuery = query(collection(db, 'reviews'));
    const rUnsubscribe = onSnapshot(rQuery, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      
      reviewsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setReviewsList(reviewsData);
    }, (error: any) => {
      console.error("Error fetching reviews:", error);
    });

    return () => {
      unsubscribe();
      uUnsubscribe();
      rUnsubscribe();
    };
  }, [isAdmin]);

  if (isAdmin === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="w-16 h-16 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAdmin === false) {
    return null; // Will redirect
  }

  const pendingDoctors = doctors.filter(d => d.status === 'pending');
  const approvedDoctors = doctors.filter(d => d.status === 'approved');
  const rejectedDoctors = doctors.filter(d => d.status === 'rejected');

  const pendingReviews = reviewsList.filter(r => r.status === 'pending');

  const chartData = [
    { name: 'مقبول', value: approvedDoctors.length, color: '#10b981' },
    { name: 'قيد المراجعة', value: pendingDoctors.length, color: '#d4af37' },
    { name: 'مرفوض', value: rejectedDoctors.length, color: '#ef4444' },
  ];

  const handleApprove = async (id: string) => {
    try {
      await updateDoctorStatus(id, 'approved');
    } catch (error: any) {
      console.error("Error approving doctor:", error?.message || String(error));
      alert("حدث خطأ أثناء قبول الطبيب.");
      throw error;
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateDoctorStatus(id, 'rejected');
    } catch (error: any) {
      console.error("Error rejecting doctor:", error?.message || String(error));
      alert("حدث خطأ أثناء رفض الطبيب.");
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الطبيب نهائياً؟')) {
      try {
        await deleteDoctor(id);
        setSelectedDoctors(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      } catch (error: any) {
        console.error("Error deleting doctor:", error?.message || String(error));
        alert("حدث خطأ أثناء حذف الطبيب.");
        throw error;
      }
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedDoctors(new Set(doctors.map(d => d.id!)));
    } else {
      setSelectedDoctors(new Set());
    }
  };

  const handleSelect = (id: string) => {
    setSelectedDoctors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedDoctors.size === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selectedDoctors.size} طبيب نهائياً؟`)) return;

    setIsDeletingBulk(true);
    try {
      const batch = writeBatch(db);
      selectedDoctors.forEach(id => {
        batch.delete(doc(db, 'doctors', id));
      });
      await batch.commit();
      setSelectedDoctors(new Set());
      alert('تم حذف الأطباء المحددين بنجاح.');
    } catch (error: any) {
      console.error("Error bulk deleting doctors:", error);
      alert("حدث خطأ أثناء الحذف المتعدد.");
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const openEditModal = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setEditForm({
      name: doctor.name,
      specialty: doctor.specialty,
      phone: doctor.phone,
      address: doctor.address,
      category: doctor.category || 'doctor',
      workingHours: doctor.workingHours || ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor?.id) return;
    
    setIsSavingEdit(true);
    try {
      await updateDoctorDetails(editingDoctor.id, editForm);
      setEditingDoctor(null);
      alert('تم تحديث بيانات الطبيب بنجاح.');
    } catch (error: any) {
      console.error("Error updating doctor:", error);
      alert("حدث خطأ أثناء تحديث بيانات الطبيب.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleApproveReview = async (id: string) => {
    try {
      await updateReviewStatus(id, 'approved');
    } catch (error) {
      alert("حدث خطأ أثناء قبول التقييم");
    }
  };

  const handleRejectReview = async (id: string) => {
    try {
      await updateReviewStatus(id, 'rejected');
    } catch (error) {
      alert("حدث خطأ أثناء رفض التقييم");
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التقييم؟')) {
      try {
        await deleteReview(id);
      } catch (error) {
        alert("حدث خطأ أثناء حذف التقييم");
      }
    }
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    if (!auth.currentUser) return;
    
    setIsImporting(true);
    try {
      const lines = bulkText.split('\n').filter(line => line.trim() !== '');
      const batch = writeBatch(db);
      let count = 0;

      lines.forEach(line => {
        // Find phone number (11 digits starting with 07)
        const phoneMatch = line.match(/07\d{9}/);
        if (!phoneMatch) return;
        
        const phone = phoneMatch[0];
        
        // Remove phone and garbage text
        let rest = line.replace(phone, '').trim();
        rest = rest.replace('للفائدة ارقام حجز عيادة الاطباء سامراء', '').trim();
        
        // Split by '/' or '،،' or '-'
        const parts = rest.split(/[/،-]/);
        if (parts.length === 0) return;
        
        const name = parts[0].trim() || 'غير معروف';
        const rawSpecialty = parts.length > 1 ? parts[1].trim() : 'عام';
        const specialty = normalizeSpecialty(rawSpecialty);
        
        if (name.length > 0) {
          const docRef = doc(collection(db, 'doctors'));
          batch.set(docRef, {
            name,
            specialty,
            phone,
            address: 'سامراء',
            status: 'approved',
            addedBy: auth.currentUser!.uid,
            addedByEmail: auth.currentUser!.email || 'غير معروف',
            addedByName: auth.currentUser!.displayName || 'مدير النظام',
            createdAt: new Date()
          });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        alert(`تم استيراد ${count} طبيب بنجاح!`);
        setBulkText('');
      } else {
        alert('لم يتم العثور على أطباء بصيغة صحيحة.');
      }
    } catch (error: any) {
      console.error("Error importing doctors:", error);
      alert("حدث خطأ أثناء الاستيراد.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-950">
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full pb-24 md:pb-6">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">لوحة تحكم الإدارة</h1>
            <p className="text-gray-400">إدارة الأطباء ومراجعة الطلبات الجديدة</p>
          </div>
          
          <div className="flex bg-dark-800 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'doctors' 
                  ? 'bg-dark-900 text-gold-400 shadow-md' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              الأطباء
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'users' 
                  ? 'bg-dark-900 text-gold-400 shadow-md' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              المستخدمين
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'reviews' 
                  ? 'bg-dark-900 text-gold-400 shadow-md' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              التقييمات {pendingReviews.length > 0 && (
                <span className="mr-1 bg-gold-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingReviews.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'doctors' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 font-medium">إجمالي الأطباء</h3>
              <Users className="text-blue-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-white">{doctors.length}</p>
          </div>
          
          <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-gold-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 font-medium">قيد المراجعة</h3>
              <Clock className="text-gold-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-white">{pendingDoctors.length}</p>
          </div>
          
          <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 font-medium">الأطباء المعتمدين</h3>
              <CheckCircle className="text-green-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-white">{approvedDoctors.length}</p>
          </div>
          
          <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-red-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 font-medium">الطلبات المرفوضة</h3>
              <XCircle className="text-red-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-white">{rejectedDoctors.length}</p>
          </div>
        </div>

        {/* Bulk Import Section */}
        <div className="glass-panel rounded-2xl p-6 mb-8 border border-gold-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center">
              <Upload className="text-gold-500" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">استيراد الأطباء دفعة واحدة</h2>
              <p className="text-sm text-gray-400">قم بلصق القائمة النصية هنا ليتم إضافتهم تلقائياً</p>
            </div>
          </div>
          <div className="space-y-4">
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="مثال:&#10;07705779806 عبد توفيق/عيون&#10;07735901388 ابتسام محيي /نسائية"
              className="w-full h-32 bg-dark-900 border border-white/10 rounded-xl p-4 text-gray-300 text-sm focus:outline-none focus:border-gold-500/50 custom-scrollbar"
              dir="rtl"
            />
            <button
              onClick={handleBulkImport}
              disabled={isImporting || !bulkText.trim()}
              className="px-6 py-3 bg-gradient-gold text-black font-bold rounded-xl hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isImporting ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileText size={18} />
              )}
              <span>بدء الاستيراد</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Table */}
          <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-bold text-white">إدارة الطلبات</h2>
              
              {selectedDoctors.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeletingBulk}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  {isDeletingBulk ? (
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  حذف المحدد ({selectedDoctors.size})
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-dark-800/50 text-gray-400 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium w-12">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-600 bg-dark-900 text-gold-500 focus:ring-gold-500/50"
                        checked={doctors.length > 0 && selectedDoctors.size === doctors.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-4 font-medium">اسم الطبيب</th>
                    <th className="px-6 py-4 font-medium">التخصص</th>
                    <th className="px-6 py-4 font-medium">الإضافة بواسطة</th>
                    <th className="px-6 py-4 font-medium">الحالة</th>
                    <th className="px-6 py-4 font-medium text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {doctors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        لا يوجد أطباء في قاعدة البيانات
                      </td>
                    </tr>
                  ) : (
                    doctors.map((doctor) => (
                      <tr key={doctor.id} className={`hover:bg-white/[0.02] transition-colors ${selectedDoctors.has(doctor.id!) ? 'bg-gold-500/5' : ''}`}>
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-600 bg-dark-900 text-gold-500 focus:ring-gold-500/50"
                            checked={selectedDoctors.has(doctor.id!)}
                            onChange={() => handleSelect(doctor.id!)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-200">{doctor.name}</div>
                          <div className="text-xs text-gray-500">{doctor.phone}</div>
                          {doctor.workingHours && <div className="text-xs text-gold-400 mt-1">🕒 {doctor.workingHours}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-300">{doctor.specialty}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {doctor.category === 'pharmacy' ? 'صيدلية' : 
                             doctor.category === 'lab' ? 'مختبر تحليلات' : 
                             doctor.category === 'nursing' ? 'عيادة تمريض' : 'طبيب/عيادة'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-300">{doctor.addedByName || 'غير معروف'}</div>
                          <div className="text-xs text-gray-500">{doctor.addedByEmail || '---'}</div>
                          {doctor.createdAt && (
                            <div className="text-xs text-gray-600 mt-1">
                              {new Date(doctor.createdAt?.seconds * 1000).toLocaleDateString('ar-IQ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            doctor.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            doctor.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                          }`}>
                            {doctor.status === 'approved' ? 'مقبول' : doctor.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {doctor.status === 'approved' && (
                              <>
                                <button 
                                  onClick={async () => {
                                    try {
                                      await updateDoctorDetails(doctor.id!, { isVerified: !doctor.isVerified });
                                    } catch (e) {
                                      alert('حدث خطأ أثناء التوثيق');
                                    }
                                  }}
                                  className={`p-1.5 rounded-lg transition-colors ${doctor.isVerified ? 'bg-gold-500/20 text-gold-400 hover:bg-gold-500/30' : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'}`}
                                  title={doctor.isVerified ? "إلغاء التوثيق" : "توثيق الكيان"}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                                </button>
                                <button 
                                  onClick={() => {
                                    setVideoDoctor(doctor);
                                    setIsVideoModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                                  title="توليد فيديو إعلاني"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg>
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => openEditModal(doctor)}
                              className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                              title="تعديل"
                            >
                              <Edit size={18} />
                            </button>
                            {doctor.status !== 'approved' && (
                              <button 
                                onClick={() => handleApprove(doctor.id!)}
                                className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                title="قبول"
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                            {doctor.status !== 'rejected' && (
                              <button 
                                onClick={() => handleReject(doctor.id!)}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                title="رفض"
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(doctor.id!)}
                              className="p-1.5 rounded-lg bg-gray-500/10 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Sidebar */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col">
            <h2 className="text-xl font-bold text-white mb-6">إحصائيات الحالات</h2>
            
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121826', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 p-4 bg-dark-800/50 rounded-xl border border-gold-500/20 flex items-start gap-3">
              <ShieldAlert className="text-gold-500 shrink-0" size={20} />
              <p className="text-sm text-gray-400 leading-relaxed">
                يجب مراجعة بيانات الأطباء بدقة قبل قبولها لضمان جودة وموثوقية الدليل للمستخدمين.
              </p>
            </div>
          </div>
          </div>
          </>
        ) : activeTab === 'users' ? (
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">سجل المستخدمين</h2>
              <span className="text-sm text-gray-400">إجمالي المستخدمين: {usersList.length}</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-dark-800/50 text-gray-400 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">المستخدم</th>
                    <th className="px-6 py-4 font-medium">البريد الإلكتروني</th>
                    <th className="px-6 py-4 font-medium">تاريخ الميلاد</th>
                    <th className="px-6 py-4 font-medium">عنوان IP</th>
                    <th className="px-6 py-4 font-medium">المنطقة / الموقع</th>
                    <th className="px-6 py-4 font-medium">آخر دخول</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        لا يوجد مستخدمين مسجلين
                      </td>
                    </tr>
                  ) : (
                    usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {usr.photoURL ? (
                              <img src={usr.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-gold-500/30" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-dark-800 border border-gold-500/30 flex items-center justify-center">
                                <UserIcon size={14} className="text-gold-500" />
                              </div>
                            )}
                            <span className="font-medium text-gray-200">{usr.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">{usr.email}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs italic">غير متوفر من جوجل</td>
                        <td className="px-6 py-4 text-gray-300 text-sm font-mono">
                          <div className="flex items-center gap-2">
                            <MonitorSmartphone size={14} className="text-gray-500" />
                            {usr.ip || 'غير معروف'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-500" />
                            {usr.location || 'غير معروف'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-xs">
                          {usr.lastLogin ? new Date(usr.lastLogin.toDate()).toLocaleString('ar-IQ') : 'غير معروف'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
               <div>
                <h2 className="text-xl font-bold text-white">مراجعة التقييمات</h2>
                <p className="text-sm text-gray-400">إجمالي المراجعات: {reviewsList.length}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-dark-800/50 text-gray-400 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">المستخدم</th>
                    <th className="px-6 py-4 font-medium">الطبيب</th>
                    <th className="px-6 py-4 font-medium">التقييم</th>
                    <th className="px-6 py-4 font-medium">التعليق</th>
                    <th className="px-6 py-4 font-medium text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reviewsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        لا توجد مراجعات حالياً
                      </td>
                    </tr>
                  ) : (
                    reviewsList.map((review) => {
                      const doctor = doctors.find(d => d.id === review.doctorId);
                      return (
                        <tr key={review.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-200">{review.userName}</div>
                            {review.createdAt && (
                              <div className="text-xs text-gray-600">
                                {new Date(review.createdAt?.seconds * 1000).toLocaleDateString('ar-IQ')}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gold-400">{doctor?.name || 'طبيب غير موجود'}</div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-1 text-gold-500">
                              <Star size={14} fill="currentColor" />
                              <span className="font-bold">{review.rating}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-300 max-w-xs truncate" title={review.comment}>
                              {review.comment}
                            </p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${
                              review.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                              review.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                              'bg-gold-500/10 text-gold-400'
                            }`}>
                              {review.status === 'approved' ? 'منشور' : review.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {review.status !== 'approved' && (
                                <button 
                                  onClick={() => handleApproveReview(review.id!)}
                                  className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                  title="قبول ونشر"
                                >
                                  <CheckCircle size={18} />
                                </button>
                              )}
                              {review.status !== 'rejected' && (
                                <button 
                                  onClick={() => handleRejectReview(review.id!)}
                                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                  title="رفض التقييم"
                                >
                                  <XCircle size={18} />
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteReview(review.id!)}
                                className="p-1.5 rounded-lg bg-gray-500/10 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                title="حذف نهائي"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingDoctor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingDoctor(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-dark-900 border border-gold-500/20 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">تعديل بيانات الطبيب</h2>
                <button 
                  onClick={() => setEditingDoctor(null)}
                  className="p-2 rounded-full bg-dark-800/50 text-gray-400 hover:text-white hover:bg-dark-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">نوع الكيان الطبي</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'doctor', label: 'طبيب/عيادة' },
                      { id: 'pharmacy', label: 'صيدلية' },
                      { id: 'lab', label: 'مختبر تحليلات' },
                      { id: 'nursing', label: 'عيادة تمريض' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setEditForm({...editForm, category: cat.id as any, specialty: cat.id === 'doctor' ? STANDARD_SPECIALTIES[0] : cat.label})}
                        className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                          editForm.category === cat.id 
                            ? 'bg-gold-500/20 border-gold-500 text-gold-400' 
                            : 'bg-dark-800 border-white/10 text-gray-400 hover:bg-dark-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">الاسم</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50"
                  />
                </div>
                
                {editForm.category === 'doctor' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">التخصص</label>
                    <select
                      required
                      value={editForm.specialty}
                      onChange={(e) => setEditForm(prev => ({ ...prev, specialty: e.target.value }))}
                      className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 appearance-none"
                    >
                      {STANDARD_SPECIALTIES.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 text-right"
                    dir="ltr"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">العنوان</label>
                  <input
                    type="text"
                    required
                    value={editForm.address}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">أوقات الدوام</label>
                  <input
                    type="text"
                    value={editForm.workingHours}
                    onChange={(e) => setEditForm(prev => ({ ...prev, workingHours: e.target.value }))}
                    className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50"
                    placeholder="مثال: من 4 عصراً إلى 9 مساءً"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="flex-1 bg-gradient-gold text-black font-bold py-3 rounded-xl hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {isSavingEdit ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'حفظ التعديلات'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingDoctor(null)}
                    className="px-6 py-3 bg-dark-800 text-white font-medium rounded-xl hover:bg-dark-700 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Preview Modal */}
      <VideoPreviewModal 
        isOpen={isVideoModalOpen}
        onClose={() => {
          setIsVideoModalOpen(false);
          setVideoDoctor(null);
        }}
        doctor={videoDoctor}
      />
    </div>
  );
}
