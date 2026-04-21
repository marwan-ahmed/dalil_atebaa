'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/firebase';
import { collection, query, onSnapshot, orderBy, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { Doctor, updateDoctorStatus, deleteDoctor, updateDoctorDetails, checkIsAdmin, handleFirestoreError, OperationType, Review, updateReviewStatus, deleteReview, Specialty, addSpecialty, updateSpecialty, deleteSpecialty } from '@/lib/firebase-utils';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Trash2, Clock, Users, Activity, ShieldAlert, Upload, FileText, Edit, X, User as UserIcon, MapPin, MonitorSmartphone, MessageSquare, Star, Settings, Plus, LayoutGrid, Search, Filter, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { normalizeSpecialty } from '@/lib/specialties';
import VideoPreviewModal from '@/components/VideoPreviewModal';
import { useSpecialties } from '@/hooks/useSpecialties';
import { sendNotificationToUser, sendBroadcastNotification } from '@/app/actions/notify';

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const { specialties, loading: loadingSpecialties } = useSpecialties();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [bulkText, setBulkText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'doctors' | 'users' | 'reviews' | 'specialties' | 'notifications'>('doctors');
  
  // New specialties states
  const [newSpecialtyName, setNewSpecialtyName] = useState('');
  const [isAddingSpecialty, setIsAddingSpecialty] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [editSpecialtyName, setEditSpecialtyName] = useState('');
  const [isSyncingSpecialties, setIsSyncingSpecialties] = useState(false);
  
  // New states for bulk delete and edit
  const [selectedDoctors, setSelectedDoctors] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editForm, setEditForm] = useState({ name: '', specialty: '', phone: '', address: '', category: 'doctor' as any, workingHours: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // Filtering and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'doctor' | 'pharmacy' | 'lab' | 'nursing'>('all');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Video Modal State
  const [videoDoctor, setVideoDoctor] = useState<Doctor | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Notifications State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{type: 'success' | 'error', text: string} | null>(null);

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

  // Store all data fetching in root so it's always available across tabs
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

  // Make sure we load the initial data even if loading
  const pendingDoctors = doctors.filter(d => d.status === 'pending');
  const approvedDoctors = doctors.filter(d => d.status === 'approved');
  const rejectedDoctors = doctors.filter(d => d.status === 'rejected');
  const pendingReviews = reviewsList.filter(r => r.status === 'pending');

  if (isAdmin === null || (loading && doctors.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="w-16 h-16 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAdmin === false) {
    return null; // Will redirect
  }

  const filteredDoctors = doctors.filter(doc => {
    // Search
    const query = searchQuery.toLowerCase();
    const matchesSearch = doc.name.toLowerCase().includes(query) || 
                          doc.phone.includes(query) || 
                          (doc.specialty && doc.specialty.toLowerCase().includes(query));
    
    // Status
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    
    // Category
    const docCategory = doc.category || 'doctor';
    const matchesCategory = categoryFilter === 'all' || docCategory === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifBody.trim()) return;
    
    setIsSendingNotif(true);
    setBroadcastResult(null);
    try {
      const result = await sendBroadcastNotification(notifTitle.trim(), notifBody.trim());
      if (result.success) {
        setBroadcastResult({ type: 'success', text: `تم الإرسال بنجاح لـ ${result.totalTokens} جهاز! (ناجح: ${result.successCount}، فاشل: ${result.failureCount})` });
        setNotifTitle('');
        setNotifBody('');
      } else {
        setBroadcastResult({ type: 'error', text: 'فشل الإرسال: ' + (result.message || result.error) });
      }
    } catch (error: any) {
      setBroadcastResult({ type: 'error', text: "حدث خطأ غير متوقع: " + String(error) });
    } finally {
      setIsSendingNotif(false);
    }
  };

  const exportToCSV = () => {
    // UTF-8 BOM for Excel to read Arabic characters properly
    const BOM = '\uFEFF';
    
    const headers = ['الاسم', 'التخصص', 'الفئة', 'رقم الهاتف', 'العنوان', 'ساعات العمل', 'الحالة', 'أضيف بواسطة'];
    const csvContent = filteredDoctors.map(d => {
      const category = d.category === 'pharmacy' ? 'صيدلية' : d.category === 'lab' ? 'مختبر' : d.category === 'nursing' ? 'تمريض' : 'طبيب';
      const status = d.status === 'approved' ? 'مقبول' : d.status === 'pending' ? 'مراجعة' : 'مرفوض';
      // wrap strings in quotes to handle commas
      return `"${d.name}","${d.specialty || ''}","${category}","${d.phone}","${d.address || ''}","${d.workingHours || ''}","${status}","${d.addedByName || d.addedByEmail || ''}"`;
    });
    
    const finalCSV = BOM + headers.join(',') + '\n' + csvContent.join('\n');
    const blob = new Blob([finalCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `doctors_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = [
    { name: 'مقبول', value: approvedDoctors.length, color: '#10b981' },
    { name: 'قيد المراجعة', value: pendingDoctors.length, color: '#d4af37' },
    { name: 'مرفوض', value: rejectedDoctors.length, color: '#ef4444' },
  ];

  const handleApprove = async (id: string, addedByUserId?: string, type: 'doctor' | 'review' = 'doctor') => {
    try {
      if (type === 'doctor') {
        await updateDoctorStatus(id, 'approved');
        if (addedByUserId) {
          await sendNotificationToUser(addedByUserId, 'تم الموافقة على اقتراحك!', 'تمت إضافة الطبيب أو الصيدلية التي قمت باقتراحها بنجاح إلى الدليل. شكراً لمساهمتك!');
        }
      } else {
        await updateReviewStatus(id, 'approved');
        if (addedByUserId) {
          await sendNotificationToUser(addedByUserId, 'تم نشر تقييمك!', 'تمت الموافقة على تقييمك وهو الآن ظاهر للجميع. شكراً لمشاركتك رأيك!');
        }
      }
    } catch (error: any) {
      console.error("Error approving:", error?.message || String(error));
      alert("حدث خطأ أثناء القبول.");
    }
  };

  const handleReject = async (id: string, addedByUserId?: string, type: 'doctor' | 'review' = 'doctor') => {
    try {
      if (type === 'doctor') {
        await updateDoctorStatus(id, 'rejected');
        if (addedByUserId) {
          await sendNotificationToUser(addedByUserId, 'حالة الاقتراح', 'عذراً، لم يتم قبول اقتراحك الأخير بعد المراجعة. نرجو التأكد من دقة البيانات مستقبلاً.');
        }
      } else {
        await updateReviewStatus(id, 'rejected');
        if (addedByUserId) {
          await sendNotificationToUser(addedByUserId, 'تحديث بخصوص التقييم', 'عذراً، لم يتم قبول تقييمك لمخالفته شروط النشر أو لاحتوائه على معلومات غير دقيقة.');
        }
      }
    } catch (error: any) {
      console.error("Error rejecting:", error?.message || String(error));
      alert("حدث خطأ أثناء الرفض.");
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

  const handleApproveReview = async (id: string, userId: string) => {
    // Re-use logic since we abstracted it
    await handleApprove(id, userId, 'review');
  };

  const handleRejectReview = async (id: string, userId: string) => {
    // Re-use logic since we abstracted it
    await handleReject(id, userId, 'review');
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

  const handleAddSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecialtyName.trim()) return;
    
    setIsAddingSpecialty(true);
    try {
      const order = specialties.length > 0 ? Math.max(...specialties.map(s => s.order)) + 1 : 0;
      await addSpecialty(newSpecialtyName.trim(), order);
      setNewSpecialtyName('');
    } catch (error) {
      alert("حدث خطأ أثناء إضافة التخصص");
    } finally {
      setIsAddingSpecialty(false);
    }
  };

  const handleUpdateSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpecialty?.id || !editSpecialtyName.trim()) return;
    
    try {
      await updateSpecialty(editingSpecialty.id, { name: editSpecialtyName.trim() });
      setEditingSpecialty(null);
    } catch (error) {
      alert("حدث خطأ أثناء تحديث التخصص");
    }
  };

  const handleDeleteSpecialty = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التخصص؟ قد يؤثر ذلك على عرض الأطباء المرتبطين به.')) {
      try {
        await deleteSpecialty(id);
      } catch (error) {
        alert("حدث خطأ أثناء حذف التخصص");
      }
    }
  };

  const handleSyncOldSpecialties = async () => {
    setIsSyncingSpecialties(true);
    try {
      if (doctors.length === 0) {
        alert('لم يتم تحميل بيانات الأطباء بعد، أو لا يوجد أطباء في النظام.');
        setIsSyncingSpecialties(false);
        return;
      }

      const oldSpecialties = new Set<string>();
      doctors.forEach(doctor => {
        if ((doctor.category === 'doctor' || !doctor.category) && doctor.specialty && doctor.specialty.trim() !== '') {
          // Add the string value directly to handle primitive checking correctly
          oldSpecialties.add(String(doctor.specialty).trim());
        }
      });

      const existingNames = new Set(specialties.map(s => String(s.name).trim()));
      const missing = Array.from(oldSpecialties).filter(s => !existingNames.has(s));

      if (missing.length === 0) {
        alert('جميع تخصصات الأطباء الحاليين موجودة بالفعل في القائمة.');
        setIsSyncingSpecialties(false);
        return;
      }

      if (!confirm(`تم العثور على ${missing.length} تخصص غير موجود في القائمة:\n\n${missing.join('، ')}\n\nهل تريد إضافتها الآن؟`)) {
        setIsSyncingSpecialties(false);
        return;
      }

      const batch = writeBatch(db);
      let order = specialties.length > 0 ? Math.max(...specialties.map(spec => Number(spec.order) || 0)) + 1 : 0;
      
      missing.forEach(specName => {
        const docRef = doc(collection(db, 'specialties'));
        batch.set(docRef, {
          name: specName,
          order: order++,
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();
      alert(`تمت المزامنة بنجاح! تم إضافة ${missing.length} تخصص جديد.`);
    } catch (error: any) {
      console.error("Error syncing specialties:", error);
      alert(`حدث خطأ أثناء المزامنة: ${error?.message || "خطأ غير معروف"}`);
    } finally {
      setIsSyncingSpecialties(false);
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
            <button
              onClick={() => setActiveTab('specialties')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'specialties' 
                  ? 'bg-dark-900 text-gold-400 shadow-md' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              التخصصات
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'notifications' 
                  ? 'bg-dark-900 text-gold-400 shadow-md' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              الإشعارات الجماعية
            </button>
          </div>
        </div>

        {activeTab === 'doctors' ? (
          <>
        {/* Advanced Options Toggle */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gold-400 transition-colors"
          >
            <Settings size={16} />
            <span>خيارات متقدمة</span>
            {showAdvancedOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Bulk Import Section (Hidden by default) */}
        <AnimatePresence>
          {showAdvancedOptions && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="glass-panel rounded-2xl p-6 border border-gold-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center">
                    <Upload className="text-gold-500" size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">استيراد الأطباء دفعة واحدة</h2>
                    <p className="text-sm text-gray-400">هذه الميزة ثانوية وتستخدم لإضافة نصوص مجمعة بسرعة</p>
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
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full">
          {/* Main Table */}
          <div className="glass-panel rounded-2xl overflow-hidden flex flex-col w-full">
            <div className="p-6 border-b border-white/5 flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-xl font-bold text-white">إدارة الطلبات</h2>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-dark-800 border border-white/10 text-gray-300 rounded-lg hover:bg-dark-700 hover:text-white transition-colors flex items-center gap-2 text-sm"
                    title="تصدير النتائج إلى CSV"
                  >
                    <Download size={16} />
                    <span>تصدير CSV</span>
                  </button>

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
                      حذف ({selectedDoctors.size})
                    </button>
                  )}
                </div>
              </div>

              {/* Toolbar: Search and Filters */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-dark-900 border border-white/10 rounded-lg pr-10 pl-4 py-2 text-sm text-white focus:outline-none focus:border-gold-500/50"
                    placeholder="بحث عن اسم، تخصص، أو رقم..."
                  />
                </div>
                
                <div className="flex items-center gap-2 min-w-[240px]">
                  <div className="relative flex-1">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full bg-dark-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500/50 appearance-none"
                    >
                      <option value="all">كل الحالات</option>
                      <option value="approved">مقبول</option>
                      <option value="pending">قيد المراجعة</option>
                      <option value="rejected">مرفوض</option>
                    </select>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>

                  <div className="relative flex-1">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as any)}
                      className="w-full bg-dark-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500/50 appearance-none"
                    >
                      <option value="all">الكل</option>
                      <option value="doctor">أطباء</option>
                      <option value="pharmacy">صيدليات</option>
                      <option value="lab">مختبرات</option>
                      <option value="nursing">تمريض</option>
                    </select>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-right">
                <thead className="bg-dark-800/50 text-gray-400 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium w-12">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-600 bg-dark-900 text-gold-500 focus:ring-gold-500/50"
                        checked={filteredDoctors.length > 0 && selectedDoctors.size === filteredDoctors.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedDoctors(new Set(filteredDoctors.map(d => d.id!)));
                          else setSelectedDoctors(new Set());
                        }}
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
                  {filteredDoctors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' 
                          ? 'لم يتم العثور على نتائج تطابق هذا البحث' 
                          : 'لا يوجد أطباء في قاعدة البيانات'}
                      </td>
                    </tr>
                  ) : (
                    filteredDoctors.map((doctor) => (
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
                                onClick={() => handleApprove(doctor.id!, doctor.addedBy, 'doctor')}
                                className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                title="قبول"
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                            {doctor.status !== 'rejected' && (
                              <button 
                                onClick={() => handleReject(doctor.id!, doctor.addedBy, 'doctor')}
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
        </div>

        {/* Bottom Stats Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Charts Area */}
          <div className="lg:col-span-1 glass-panel rounded-2xl p-6 flex flex-col">
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
                يجب مراجعة بيانات الأطباء بدقة قبل قبولها.
              </p>
            </div>
          </div>

          {/* Stats Cards Area */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-blue-500 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium text-lg">إجمالي الأطباء</h3>
                <Users className="text-blue-500" size={28} />
              </div>
              <p className="text-4xl font-bold text-white">{doctors.length}</p>
            </div>
            
            <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-gold-500 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium text-lg">قيد المراجعة</h3>
                <Clock className="text-gold-500" size={28} />
              </div>
              <p className="text-4xl font-bold text-white">{pendingDoctors.length}</p>
            </div>
            
            <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-green-500 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium text-lg">الأطباء المعتمدين</h3>
                <CheckCircle className="text-green-500" size={28} />
              </div>
              <p className="text-4xl font-bold text-white">{approvedDoctors.length}</p>
            </div>
            
            <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-red-500 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium text-lg">الطلبات المرفوضة</h3>
                <XCircle className="text-red-500" size={28} />
              </div>
              <p className="text-4xl font-bold text-white">{rejectedDoctors.length}</p>
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
        ) : activeTab === 'reviews' ? (
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
                                  onClick={() => handleApproveReview(review.id!, review.userId)}
                                  className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                  title="قبول ونشر"
                                >
                                  <CheckCircle size={18} />
                                </button>
                              )}
                              {review.status !== 'rejected' && (
                                <button 
                                  onClick={() => handleRejectReview(review.id!, review.userId)}
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
        ) : activeTab === 'specialties' ? (
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 border border-gold-500/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-white">إضافة تخصص جديد</h2>
                <button
                  onClick={handleSyncOldSpecialties}
                  type="button"
                  disabled={isSyncingSpecialties}
                  className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all text-sm flex items-center gap-2 justify-center disabled:opacity-50"
                >
                  {isSyncingSpecialties ? (
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Activity size={16} />
                  )}
                  <span>مزامنة التخصصات القديمة</span>
                </button>
              </div>
              <form onSubmit={handleAddSpecialty} className="flex gap-4">
                <input
                  type="text"
                  value={newSpecialtyName}
                  onChange={(e) => setNewSpecialtyName(e.target.value)}
                  placeholder="اسم التخصص (مثلاً: قلبية)"
                  className="flex-1 bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold-500/50"
                  required
                />
                <button
                  type="submit"
                  disabled={isAddingSpecialty || !newSpecialtyName.trim()}
                  className="px-6 py-2.5 bg-gradient-gold text-black font-bold rounded-xl hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isAddingSpecialty ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus size={18} />
                  )}
                  <span>إضافة</span>
                </button>
              </form>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">قائمة التخصصات</h2>
                <span className="text-sm text-gray-400">الإجمالي: {specialties.length}</span>
              </div>
              
              <div className="divide-y divide-white/5">
                {specialties.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">لا توجد تخصصات مضافة</div>
                ) : (
                  specialties.map((spec) => (
                    <div key={spec.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      {editingSpecialty?.id === spec.id ? (
                        <form onSubmit={handleUpdateSpecialty} className="flex-1 flex gap-3">
                          <input
                            type="text"
                            value={editSpecialtyName}
                            onChange={(e) => setEditSpecialtyName(e.target.value)}
                            className="flex-1 bg-dark-900 border border-gold-500/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                            autoFocus
                          />
                          <button type="submit" className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg"><CheckCircle size={18} /></button>
                          <button type="button" onClick={() => setEditingSpecialty(null)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><X size={18} /></button>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-dark-800 border border-white/5 flex items-center justify-center text-xs text-gray-400 font-mono">
                              {spec.order}
                            </div>
                            <span className="font-medium text-gray-200">{spec.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingSpecialty(spec);
                                setEditSpecialtyName(spec.name);
                              }}
                              className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteSpecialty(spec.id!)}
                              className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
        
        {activeTab === 'notifications' && (
          <div className="max-w-3xl mx-auto">
            <div className="glass-panel rounded-2xl p-8 border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-500/5 flex items-center justify-center border border-gold-500/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                  <Activity className="text-gold-500" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">لوحة الإرسال المباشر (Push)</h2>
                  <p className="text-gray-400 text-sm">
                    إرسال رسائل فورية لجميع الهواتف المتصلة بالدليل
                  </p>
                </div>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-6 relative">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">عنوان الإشعار</label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="مثال: خبر عاجل، انضمام طبيب جديد..."
                    className="w-full bg-dark-950/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all placeholder:text-gray-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">محتوى الإشعار</label>
                  <textarea
                    value={notifBody}
                    onChange={(e) => setNotifBody(e.target.value)}
                    placeholder="اكتب رسالتك وتفاصيل الإشعار هنا..."
                    rows={4}
                    className="w-full bg-dark-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all resize-none custom-scrollbar placeholder:text-gray-600"
                    required
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-sm text-blue-300">
                  <span className="text-xl shrink-0">💡</span>
                  <p className="leading-relaxed">
                    استخدم هذه الخاصية بحذر. كثرة الإشعارات قد تزعج المستخدم وتدفعه لإلغاء خاصية التنبيهات. استهدف الإعلانات الهامة فقط.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSendingNotif || !notifTitle.trim() || !notifBody.trim()}
                  className="w-full py-4 bg-gradient-gold text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center gap-2 text-lg active:scale-[0.99]"
                >
                  {isSendingNotif ? (
                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Activity size={20} />
                      إرسال الإشعار الآن
                    </>
                  )}
                </button>
                
                {broadcastResult && (
                  <div className={`p-4 rounded-xl text-center text-sm font-bold ${broadcastResult.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                    {broadcastResult.text}
                  </div>
                )}
              </form>
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
                        onClick={() => setEditForm({...editForm, category: cat.id as any, specialty: cat.id === 'doctor' ? (specialties[0]?.name || '') : cat.label})}
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
                      {specialties.map(spec => (
                        <option key={spec.id} value={spec.name}>{spec.name}</option>
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
