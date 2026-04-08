'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Doctor, updateDoctorStatus, deleteDoctor, checkIsAdmin } from '@/lib/firebase-utils';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '@/components/Navbar';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, Trash2, Clock, Users, Activity, ShieldAlert } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
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
    });

    return () => unsubscribe();
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

  const chartData = [
    { name: 'مقبول', value: approvedDoctors.length, color: '#10b981' },
    { name: 'قيد المراجعة', value: pendingDoctors.length, color: '#d4af37' },
    { name: 'مرفوض', value: rejectedDoctors.length, color: '#ef4444' },
  ];

  const handleApprove = async (id: string) => {
    await updateDoctorStatus(id, 'approved');
  };

  const handleReject = async (id: string) => {
    await updateDoctorStatus(id, 'rejected');
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الطبيب نهائياً؟')) {
      await deleteDoctor(id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-950">
      <Navbar />
      
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">لوحة تحكم الإدارة</h1>
          <p className="text-gray-400">إدارة الأطباء ومراجعة الطلبات الجديدة</p>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Table */}
          <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">إدارة الطلبات</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-dark-800/50 text-gray-400 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">اسم الطبيب</th>
                    <th className="px-6 py-4 font-medium">التخصص</th>
                    <th className="px-6 py-4 font-medium">الحالة</th>
                    <th className="px-6 py-4 font-medium text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {doctors.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        لا يوجد أطباء في قاعدة البيانات
                      </td>
                    </tr>
                  ) : (
                    doctors.map((doctor) => (
                      <tr key={doctor.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-200">{doctor.name}</div>
                          <div className="text-xs text-gray-500">{doctor.phone}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{doctor.specialty}</td>
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
              <ResponsiveContainer width="100%" height="100%">
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
      </main>
    </div>
  );
}
