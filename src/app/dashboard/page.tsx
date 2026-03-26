'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Order {
  id: number
  course: { name: string; sessions: number }
  location: { name: string }
  quantity: number
  totalAmount: number
  status: string
  createdAt: string
}

interface Booking {
  id: number
  startTime: string
  endTime: string
  duration: number
  status: string
  location: { name: string }
  course: { name: string }
}

interface StudentInfo {
  name: string
  email: string
  remainingSessions: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userRole = localStorage.getItem('userRole')

    if (!userId || userRole !== 'student') {
      router.push('/login')
      return
    }

    async function fetchData() {
      try {
        const [ordersRes, bookingsRes] = await Promise.all([
          fetch(`/api/student/orders?studentId=${userId}`),
          fetch(`/api/student/bookings?studentId=${userId}`)
        ])

        const ordersData = ordersRes.ok ? await ordersRes.json() : { orders: [], student: null }
        const bookingsData = bookingsRes.ok ? await bookingsRes.json() : { bookings: [] }

        setOrders(ordersData.orders || [])
        setBookings(bookingsData.bookings || [])
        setStudentInfo(ordersData.student || null)
      } catch (error) {
        console.error('Fetch error:', error)
      }
      setLoading(false)
    }
    fetchData()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userName')
    router.push('/login')
  }

  const handleCancelBooking = async (bookingId: number) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (!booking) return

    const bookingDate = new Date(booking.startTime)
    const now = new Date()
    const hoursUntilClass = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    let confirmMessage = '確定要取消這個預約嗎？取消後堂數將不會退還。'
    if (hoursUntilClass < 24) {
      confirmMessage = '⚠️ 提醒：上課時間在 24 小時內取消，堂數將不會退還。\n\n' + confirmMessage
    }

    if (!window.confirm(confirmMessage)) return

    const userId = localStorage.getItem('userId')
    if (!userId) return

    try {
      const res = await fetch(`/api/student/bookings?bookingId=${bookingId}&studentId=${userId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        alert('已取消預約（堂數不退還）')
        // 重新取得資料
        const [ordersRes, bookingsRes] = await Promise.all([
          fetch(`/api/student/orders?studentId=${userId}`),
          fetch(`/api/student/bookings?studentId=${userId}`)
        ])
        const ordersData = await ordersRes.json()
        const bookingsData = await bookingsRes.json()
        setOrders(ordersData.orders || [])
        setBookings(bookingsData.bookings || [])
      } else {
        const data = await res.json()
        alert(data.error || '取消失敗')
      }
    } catch (error) {
      console.error('Cancel error:', error)
      alert('取消失敗')
    }
  }

  const isWithin24Hours = (booking: Booking) => {
    const bookingDate = new Date(booking.startTime)
    const now = new Date()
    const hoursUntilClass = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursUntilClass < 24
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">載入中...</div>

  const paidOrders = orders.filter(o => o.status === 'paid')
  // 剩餘堂數 = 已購買 - (已完成 + 已預約) 的 duration
  // 取消的堂數不退還
  const purchasedSessions = paidOrders.reduce((sum, order) => sum + (order.course?.sessions || 0) * order.quantity, 0)
  const nonCancelledDuration = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.duration, 0)
  const remainingSessions = purchasedSessions - nonCancelledDuration

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <header className="py-6 px-4 border-b border-amber-100">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-amber-800">🎤 STAGELESS沐光</Link>
          <div className="flex gap-4 items-center">
            <Link href="/dashboard/profile" className="text-amber-700 hover:text-amber-900 text-sm font-medium">修改個人資料</Link>
            <button onClick={handleLogout} className="text-amber-700 hover:text-amber-900">登出</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8">
        <div className="flex gap-8">
          {/* 左側連結 */}
          <div className="w-48 shrink-0">
            <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-wide mb-3">快速連結</h3>
            <div className="space-y-2">
              <Link href="/courses" className="flex items-center gap-2 text-amber-700 hover:text-amber-900 text-sm">
                <span>🎵</span> 課程總覽
              </Link>
              <Link href="/locations" className="flex items-center gap-2 text-amber-700 hover:text-amber-900 text-sm">
                <span>📍</span> 地點總覽
              </Link>
              <Link href="/dashboard/profile" className="flex items-center gap-2 text-amber-700 hover:text-amber-900 text-sm">
                <span>👤</span> 修改個人資料
              </Link>
              <Link href="/book" className="flex items-center gap-2 text-amber-700 hover:text-amber-900 text-sm">
                <span>🎤</span> 購買課程
              </Link>
              <Link href="/schedule" className="flex items-center gap-2 text-amber-700 hover:text-amber-900 text-sm">
                <span>📅</span> 預約時段
              </Link>
            </div>
          </div>

          {/* 右側內容 */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-amber-900 mb-2">會員專區</h1>
            <p className="text-amber-600 mb-8">歡迎回來，{studentInfo?.name || '同學'}</p>

            {/* 剩餘堂數 */}
        <div className="bg-amber-600 text-white p-6 rounded-xl mb-8">
          <h2 className="text-lg opacity-90">剩餘堂數</h2>
          <p className="text-5xl font-bold">{remainingSessions} 堂</p>
          {remainingSessions > 0 && (
            <Link href="/schedule" className="inline-block mt-4 bg-white text-amber-600 px-4 py-2 rounded-lg font-semibold hover:bg-amber-50">
              預約上課
            </Link>
          )}
        </div>

        {/* 預約紀錄 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-amber-900 mb-4">預約紀錄</h2>
          {bookings.length === 0 ? (
            <p className="text-amber-600">尚無預約紀錄</p>
          ) : (
            <div className="space-y-3">
              {bookings.map(booking => (
                <div key={booking.id} className="bg-white p-4 rounded-xl border border-amber-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-amber-900">{booking.course?.name}</h3>
                      <p className="text-sm text-amber-600">
                        📍 {booking.location?.name}
                      </p>
                      <p className="text-sm text-amber-600">
                        {new Date(booking.startTime).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(booking.endTime).toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-amber-500">扣 {booking.duration} 堂</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded ${booking.status === 'completed' ? 'bg-green-100 text-green-700' : booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {booking.status === 'completed' ? '已完成' : booking.status === 'cancelled' ? '已取消' : '已預約'}
                      </span>
                      {booking.status === 'scheduled' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="block mt-2 text-xs text-red-500 hover:text-red-700"
                        >
                          取消預約
                        </button>
                      )}
                    </div>
                  </div>
                  {booking.status === 'scheduled' && isWithin24Hours(booking) && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                      ⚠️ 上課時間在 24 小時內，取消將不退還堂數
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 訂單紀錄 */}
        <div>
          <h2 className="text-xl font-semibold text-amber-900 mb-4">訂單紀錄</h2>
          {orders.length === 0 ? (
            <p className="text-amber-600">尚無訂單紀錄</p>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div 
                  key={order.id} 
                  className={`bg-white p-4 rounded-xl border border-amber-100 ${order.status === 'pending' ? 'cursor-pointer hover:border-amber-400' : ''}`}
                  onClick={() => order.status === 'pending' && (window.location.href = `/payment?orderId=${order.id}`)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-amber-900">{order.course?.name}</h3>
                      <p className="text-sm text-amber-600">{order.location?.name} × {order.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-900">NT$ {order.totalAmount.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-1 rounded ${order.status === 'paid' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {order.status === 'paid' ? '已付款' : order.status === 'cancelled' ? '已取消' : '待付款'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link href="/book" className="text-amber-700 font-semibold hover:underline">
            購買新課程 →
          </Link>
        </div>
        </div>
      </div>
      </main>
    </div>
  )
}