'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Booking {
  id: number;
  studentId: number;
  orderId: number;
  teacherId: number;
  locationId: number;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  note: string | null;
  createdAt: string;
  student: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  };
  teacher: {
    id: number;
    name: string;
    email: string;
  };
  location: {
    id: number;
    name: string;
  };
  order: {
    id: number;
    course: {
      name: string;
      sessions: number;
    };
  };
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'teacher') {
      router.push('/admin/login');
      return;
    }

    fetch('/api/admin/bookings')
      .then(res => res.json())
      .then(data => {
        setBookings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const updateBookingStatus = async (bookingId: number, status: string) => {
    setUpdating(bookingId);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      });

      if (res.ok) {
        setBookings(bookings.map(b =>
          b.id === bookingId ? { ...b, status } : b
        ));
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
    setUpdating(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">已預約</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">已完成</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">已取消</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{status}</span>;
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
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
            <h1 className="text-2xl font-bold">📅 預約紀錄</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-500">尚無預約紀錄</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">預約編號</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">學生</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">老師</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">課程</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">地點</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">預約時間</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">時數</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">狀態</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">#{booking.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{booking.student.name}</div>
                      <div className="text-sm text-gray-500">{booking.student.email}</div>
                    </td>
                    <td className="px-4 py-3">{booking.teacher.name}</td>
                    <td className="px-4 py-3">
                      <div>{booking.order.course.name}</div>
                      <div className="text-sm text-gray-500">{booking.order.course.sessions} 堂</div>
                    </td>
                    <td className="px-4 py-3">{booking.location.name}</td>
                    <td className="px-4 py-3 text-sm">{formatDateTime(booking.startTime)}</td>
                    <td className="px-4 py-3">{booking.duration} 小時</td>
                    <td className="px-4 py-3">{getStatusBadge(booking.status)}</td>
                    <td className="px-4 py-3">
                      {booking.status === 'scheduled' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                            disabled={updating === booking.id}
                            className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm disabled:opacity-50"
                          >
                            完成
                          </button>
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                            disabled={updating === booking.id}
                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm disabled:opacity-50"
                          >
                            取消
                          </button>
                        </div>
                      )}
                      {booking.status === 'completed' && (
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                          disabled={updating === booking.id}
                          className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm disabled:opacity-50"
                        >
                          取消
                        </button>
                      )}
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
