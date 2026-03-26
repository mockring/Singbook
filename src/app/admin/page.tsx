'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Stats {
  todayBookings: number;
  pendingOrders: number;
  totalStudents: number;
  totalOrders: number;
  totalBookings: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'teacher') {
      router.push('/login');
      return;
    }

    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('teacherToken');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">載入中...</div>
      </div>
    );
  }

  const menuItems = [
    { title: '修改個人資料', href: '/admin/profile', icon: '👤', desc: '姓名、Email、密碼' },
    { title: '訂單管理', href: '/admin/orders', icon: '📋', desc: '確認收款、取消訂單' },
    { title: '時段管理', href: '/admin/schedule', icon: '🗓️', desc: '管理老師可預約時段' },
    { title: '課程管理', href: '/admin/courses', icon: '🎵', desc: '新增、編輯、刪除課程' },
    { title: '地點管理', href: '/admin/locations', icon: '📍', desc: '新增、編輯、刪除地點' },
    { title: '匯款設定', href: '/admin/payment-settings', icon: '💳', desc: '設定匯款帳號' },
    { title: '學生管理', href: '/admin/students', icon: '👥', desc: '檢視學生資料與堂數' },
    { title: '預約紀錄', href: '/admin/bookings', icon: '📅', desc: '查看所有預約紀錄' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎹 SingBook 後台管理</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors"
          >
            登出
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-gray-500 text-sm">今日預約</div>
            <div className="text-3xl font-bold text-indigo-600">{stats?.todayBookings || 0}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-gray-500 text-sm">待確認訂單</div>
            <div className="text-3xl font-bold text-orange-500">{stats?.pendingOrders || 0}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-gray-500 text-sm">總學生數</div>
            <div className="text-3xl font-bold text-green-600">{stats?.totalStudents || 0}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-gray-500 text-sm">總訂單數</div>
            <div className="text-3xl font-bold text-blue-600">{stats?.totalOrders || 0}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-gray-500 text-sm">總預約數</div>
            <div className="text-3xl font-bold text-purple-600">{stats?.totalBookings || 0}</div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menuItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</div>
              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </Link>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">快速連結</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors">
              前台首頁
            </Link>
            <Link href="/courses" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors">
              課程列表
            </Link>
            <Link href="/locations" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors">
              地點列表
            </Link>
            <Link href="/dashboard" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors">
              會員專區
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
