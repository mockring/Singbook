'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Order {
  id: number;
  studentId: number;
  courseId: number;
  locationId: number;
  quantity: number;
  totalAmount: number;
  status: string;
  paidAt: string | null;
  bankAccountLast5: string | null;
  paidAmount: number | null;
  note: string | null;
  createdAt: string;
  student: {
    name: string;
    email: string;
    phone: string | null;
  };
  course: {
    name: string;
    sessions: number;
  };
  location: {
    name: string;
  };
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'teacher') {
      router.push('/admin/login');
      return;
    }

    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const updateOrderStatus = async (orderId: number, status: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      
      if (res.ok) {
        setOrders(orders.map(o => 
          o.id === orderId ? { ...o, status } : o
        ));
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
    setUpdating(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">待付款</span>;
      case 'paid':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">已付款</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">已取消</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{status}</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return `NT$ ${price.toLocaleString()}`;
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
            <h1 className="text-2xl font-bold">📋 訂單管理</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-500">尚無訂單紀錄</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-gray-600 font-semibold text-sm">編號</th>
                  <th className="px-3 py-3 text-left text-gray-600 font-semibold text-sm">學生</th>
                  <th className="px-3 py-3 text-left text-gray-600 font-semibold text-sm">課程</th>
                  <th className="px-3 py-3 text-left text-gray-600 font-semibold text-sm">地點</th>
                  <th className="px-3 py-3 text-left text-gray-600 font-semibold text-sm">堂數</th>
                  <th className="px-3 py-3 text-left text-gray-600 font-semibold text-sm">應付</th>
                  <th className="px-3 py-3 text-left text-gray-600 font-semibold text-sm">實付</th>
                  <th className="px-3 py-3 text-left text-gray-600 font-semibold text-sm">狀態</th>
                  <th className="px-3 py-3 text-left text-gray-600 font-semibold text-sm">匯款</th>
                  <th className="px-3 py-3 text-left text-gray-600 font-semibold text-sm">備註</th>
                  <th className="px-3 py-3 text-left text-gray-600 font-semibold text-sm">時間</th>
                  <th className="px-3 py-3 text-left text-gray-600 font-semibold text-sm">操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm">#{order.id}</td>
                    <td className="px-3 py-3 text-sm">
                      <div className="font-medium">{order.student.name}</div>
                      <div className="text-gray-500">{order.student.email}</div>
                    </td>
                    <td className="px-3 py-3 text-sm">
                      <div>{order.course.name}</div>
                      <div className="text-gray-500">{order.course.sessions} 堂</div>
                    </td>
                    <td className="px-3 py-3 text-sm">{order.location.name}</td>
                    <td className="px-3 py-3 text-sm">{order.quantity}</td>
                    <td className="px-3 py-3 text-sm font-medium text-indigo-600">{formatPrice(order.totalAmount)}</td>
                    <td className="px-3 py-3 text-sm">
                      {order.paidAmount ? (
                        <span className={order.paidAmount === order.totalAmount ? 'text-green-600' : 'text-red-600'}>
                          {formatPrice(order.paidAmount)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-3">{getStatusBadge(order.status)}</td>
                    <td className="px-3 py-3 text-sm">{order.bankAccountLast5 ? `****${order.bankAccountLast5}` : '-'}</td>
                    <td className="px-3 py-3 text-sm max-w-[150px] truncate">{order.note || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                    <td className="px-3 py-3">
                      {order.status === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateOrderStatus(order.id, 'paid')}
                            disabled={updating === order.id}
                            className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs disabled:opacity-50"
                          >
                            確認
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            disabled={updating === order.id}
                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs disabled:opacity-50"
                          >
                            取消
                          </button>
                        </div>
                      )}
                      {order.status === 'paid' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          disabled={updating === order.id}
                          className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs disabled:opacity-50"
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
