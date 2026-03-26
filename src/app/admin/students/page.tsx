'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface StudentData {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  totalOrders: number;
  totalBookings: number;
  purchasedSessions: number;
  usedSessions: number;
  remainingSessions: number;
}

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'teacher') {
      router.push('/admin/login');
      return;
    }

    fetch('/api/admin/students')
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-white hover:text-indigo-200">← 返回</Link>
            <h1 className="text-2xl font-bold">👥 學生管理</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {students.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-500">尚無學生註冊</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">學生</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">聯絡方式</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">註冊時間</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">訂單數</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">已購堂數</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">已用堂數</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">剩餘堂數</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-gray-500">#{student.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{student.email}</div>
                      {student.phone && <div className="text-sm text-gray-500">{student.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(student.createdAt)}</td>
                    <td className="px-4 py-3">{student.totalOrders}</td>
                    <td className="px-4 py-3">{student.purchasedSessions}</td>
                    <td className="px-4 py-3">{student.usedSessions}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${student.remainingSessions > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {student.remainingSessions}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
