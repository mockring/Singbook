'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Teacher {
  id: number
  name: string
  bio: string | null
  image: string | null
}

interface Booking {
  id: number
  startTime: string
  endTime: string
  duration: number
  status: string
  teacherId?: number
}

interface TimeSlot {
  id: number
  teacherId: number
  date: string
  startTime: string
  endTime: string
  isBooked: boolean
  bookings: Booking[]
}

interface Location {
  id: number
  name: string
  address: string
}

interface Order {
  id: number
  course: {
    name: string
    sessions: number
  }
  location: {
    id: number
    name: string
  }
  quantity: number
  status: string
}

export default function SchedulePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [remainingSessions, setRemainingSessions] = useState(0)
  const [canBook, setCanBook] = useState(false)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ time: string; duration: number } | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 取得當月日期
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userRole = localStorage.getItem('userRole')

    if (!userId || userRole !== 'student') {
      router.push('/login')
      return
    }

    async function checkStatus() {
      const [teachersRes, slotsRes, locationsRes, ordersRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/teachers'),
        fetch('/api/admin/schedule'),
        fetch('/api/locations'),
        fetch(`/api/student/orders?studentId=${userId}`),
        fetch(`/api/student/bookings?studentId=${userId}`)
      ])

      const teachersData = await teachersRes.json()
      const slotsData = await slotsRes.json()
      const locationsData = await locationsRes.json()
      const ordersData = await ordersRes.json()
      const bookingsData = await bookingsRes.json()

      setTeachers(teachersData)
      setTimeSlots(slotsData)
      setLocations(locationsData)

      const paidOrders = (ordersData.orders || []).filter((o: any) => o.status === 'paid')
      setOrders(paidOrders)

      const existingBookings = bookingsData.bookings || []
      setAllBookings(existingBookings)

      const purchasedSessions = paidOrders.reduce((sum: number, o: any) => sum + (o.course?.sessions || 0) * o.quantity, 0)
      // 剩餘堂數 = 已購買 - (已完成 + 已預約) 的 duration 總和
      // 取消的堂數不退還（不算在已使用裡）
      const usedSessions = existingBookings
        .filter((b: any) => b.status !== 'cancelled')
        .reduce((sum: number, b: any) => sum + (b.duration || 1), 0)
      
      const remaining = purchasedSessions - usedSessions
      setRemainingSessions(remaining)
      setCanBook(remaining > 0)
      setLoading(false)
    }
    checkStatus()
  }, [router])

  // 取得當月第一天和最後一天
  const getMonthDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const days: Date[] = []
    // 補齊星期日開始（倒序填入）
    for (let i = firstDay.getDay(); i > 0; i--) {
      days.push(new Date(year, month, -i + 1))
    }
    // 當月天數
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    // 補齊星期六結束
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i))
    }
    
    return days
  }, [currentDate])

  // 取得日期的 YYYY-MM-DD 字串（使用當地時區）
  const getLocalDateStr = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 檢查某天是否有可用時段
  const getDayStatus = (date: Date, teacherId: number | null) => {
    if (!teacherId) return { hasAvailable: false, isCurrentMonth: date.getMonth() === currentDate.getMonth() }
    
    const dateStr = getLocalDateStr(date)
    const teacherSlots = timeSlots.filter(s => {
      const slotDate = getLocalDateStr(new Date(s.date))
      return s.teacherId === teacherId && slotDate === dateStr
    })
    
    if (teacherSlots.length === 0) {
      return { hasAvailable: false, isCurrentMonth: date.getMonth() === currentDate.getMonth() }
    }
    
    // 找出該老師在該日期的所有預約（已預約 + 已完成）
    const teacherBookingsOnDate = allBookings.filter(b => {
      if (b.status === 'cancelled') return false
      const bookingDate = getLocalDateStr(new Date(b.startTime))
      return b.teacherId === teacherId && bookingDate === dateStr
    })
    
    // 檢查是否有可用時段
    const hasAvailable = teacherSlots.some(slot => {
      const slotStartHour = parseInt(slot.startTime.split(':')[0])
      const slotEndHour = parseInt(slot.endTime.split(':')[0])
      
      for (let h = slotStartHour; h < slotEndHour; h++) {
        // 檢查這個小時是否已被預約
        const isBooked = teacherBookingsOnDate.some(b => {
          const bStart = new Date(b.startTime).getHours()
          const bEnd = new Date(b.endTime).getHours()
          return h >= bStart && h < bEnd
        })
        if (!isBooked) return true
      }
      return false
    })
    
    return { hasAvailable, isCurrentMonth: date.getMonth() === currentDate.getMonth() }
  }

  // 取得某天的可用時段
  const getAvailableSlots = (date: Date, teacherId: number) => {
    const dateStr = getLocalDateStr(date)
    const teacherSlots = timeSlots.filter(s => {
      const slotDate = getLocalDateStr(new Date(s.date))
      return s.teacherId === teacherId && slotDate === dateStr
    })
    
    if (teacherSlots.length === 0) return []
    
    // 找出該老師在該日期的所有預約（已預約 + 已完成）
    const teacherBookingsOnDate = allBookings.filter(b => {
      if (b.status === 'cancelled') return false
      const bookingDate = getLocalDateStr(new Date(b.startTime))
      return b.teacherId === teacherId && bookingDate === dateStr
    })
    
    const availableHours: number[] = []
    
    teacherSlots.forEach(slot => {
      const startHour = parseInt(slot.startTime.split(':')[0])
      const endHour = parseInt(slot.endTime.split(':')[0])
      
      for (let h = startHour; h < endHour; h++) {
        // 檢查是否已被預約
        const isBooked = teacherBookingsOnDate.some(b => {
          const bStart = new Date(b.startTime).getHours()
          const bEnd = new Date(b.endTime).getHours()
          return h >= bStart && h < bEnd
        })
        
        if (!isBooked && !availableHours.includes(h)) {
          availableHours.push(h)
        }
      }
    })
    
    return availableHours.sort((a, b) => a - b)
  }

  // 檢查某時段是否可預約 2 小時
  const canBook2Hours = (hour: number, date: Date, teacherId: number): boolean => {
    const dateStr = getLocalDateStr(date)
    const teacherSlots = timeSlots.filter(s => {
      const slotDate = getLocalDateStr(new Date(s.date))
      return s.teacherId === teacherId && slotDate === dateStr
    })
    
    // 需要連續兩個小時都有空
    const available = getAvailableSlots(date, teacherId)
    return available.includes(hour) && available.includes(hour + 1)
  }

  const handleBook = async () => {
    if (!selectedSlot || !selectedOrder || !selectedDate || !selectedTeacher) {
      alert('請選擇時段和課程')
      return
    }

    // 找出對應的 timeSlot
    const dateStr = getLocalDateStr(new Date(selectedDate))
    const teacherSlots = timeSlots.filter(s => {
      const slotDate = getLocalDateStr(new Date(s.date))
      return s.teacherId === selectedTeacher && slotDate === dateStr
    })

    if (teacherSlots.length === 0) {
      alert('找不到可用時段')
      return
    }

    const startTime = `${selectedSlot.time}:00`
    const endHour = parseInt(selectedSlot.time) + selectedSlot.duration
    const endTime = `${endHour.toString().padStart(2, '0')}:00`

    // 找到包含此時段的 slot
    const slot = teacherSlots.find(s => {
      const slotStart = parseInt(s.startTime.split(':')[0])
      const slotEnd = parseInt(s.endTime.split(':')[0])
      const bookHour = parseInt(selectedSlot.time)
      return bookHour >= slotStart && bookHour < slotEnd
    })

    if (!slot) {
      alert('找不到時段')
      return
    }

    setSubmitting(true)
    try {
      // 正確格式化日期為 ISO 字串（使用當地時區）
      const dateStr = getLocalDateStr(new Date(selectedDate))
      const startTimeISO = `${dateStr}T${startTime}:00`
      const endTimeISO = `${dateStr}T${endTime}:00`

      const res = await fetch('/api/student/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder,
          timeSlotId: slot.id,
          startTime: startTimeISO,
          endTime: endTimeISO,
          duration: selectedSlot.duration
        })
      })

      const data = await res.json()

      if (data.success) {
        alert('預約成功！')
        router.push('/dashboard')
      } else {
        alert(data.error || '預約失敗')
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('預約失敗')
    }
    setSubmitting(false)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">載入中...</div>

  if (!canBook) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-amber-900 mb-4">無法預約</h1>
          <p className="text-amber-600 mb-6">您需要先購買課程並完成付款才能預約上課時間</p>
          <Link href="/book" className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700">
            購買課程
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <header className="py-6 px-4 border-b border-amber-100">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-amber-800">🎤 STAGELESS沐光</Link>
          <Link href="/dashboard" className="text-amber-600 hover:text-amber-800">會員專區</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-8">預約時段</h1>

        {/* 選擇老師 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-amber-900 mb-3">選擇老師</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {teachers.map(teacher => (
              <button
                key={teacher.id}
                onClick={() => { setSelectedTeacher(teacher.id); setSelectedDate(null); setSelectedSlot(null); }}
                className={`p-3 rounded-xl border-2 text-center transition-colors ${
                  selectedTeacher === teacher.id
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-amber-100 bg-white hover:border-amber-200'
                }`}
              >
                <div className="font-semibold text-amber-900">{teacher.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 月曆（縮小版） */}
        {selectedTeacher && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-amber-900 mb-3">選擇日期</h2>
            
            {/* 月份切換 */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={prevMonth}
                className="px-3 py-1.5 text-sm hover:bg-amber-100 rounded-lg transition-colors"
              >
                ← 上個月份
              </button>
              <span className="text-base font-bold text-amber-900">
                {currentDate.getFullYear()} 年 {currentDate.getMonth() + 1} 月
              </span>
              <button
                onClick={nextMonth}
                className="px-3 py-1.5 text-sm hover:bg-amber-100 rounded-lg transition-colors"
              >
                下個月份 →
              </button>
            </div>

            {/* 星期標題 */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-amber-600 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* 日曆網格（縮小） */}
            <div className="grid grid-cols-7 gap-0.5">
              {getMonthDays.map((day, idx) => {
                const { hasAvailable, isCurrentMonth } = getDayStatus(day, selectedTeacher)
                const isToday = day.toDateString() === new Date().toDateString()
                const isSelected = selectedDate && day.toDateString() === new Date(selectedDate).toDateString()
                
                return (
                  <button
                    key={idx}
                    onClick={() => hasAvailable && setSelectedDate(getLocalDateStr(day))}
                    disabled={!hasAvailable}
                    className={`
                      h-12 flex flex-col items-center justify-center rounded-md text-center transition-all text-xs
                      ${!isCurrentMonth ? 'text-amber-200' : ''}
                      ${isCurrentMonth && hasAvailable ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}
                      ${isToday && isCurrentMonth ? 'ring-1 ring-amber-500' : ''}
                      ${isSelected ? 'bg-amber-500 text-white hover:bg-amber-600' : ''}
                    `}
                  >
                    <span className="font-medium">{day.getDate()}</span>
                    {hasAvailable && isCurrentMonth && (
                      <span className="text-[9px] text-amber-600 leading-none mt-0.5">可預約</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 選擇時段 */}
        {selectedTeacher && selectedDate && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-amber-900 mb-3">
              選擇時間 - {formatDate(new Date(selectedDate))}
            </h2>
            
            {(() => {
              const available = getAvailableSlots(new Date(selectedDate), selectedTeacher)
              if (available.length === 0) {
                return <p className="text-amber-600">當日無可用時段</p>
              }

              // 取得該天的所有時段（小時）
              const dateStr = getLocalDateStr(new Date(selectedDate))
              const teacherSlots = timeSlots.filter(s => {
                const slotDate = getLocalDateStr(new Date(s.date))
                return s.teacherId === selectedTeacher && slotDate === dateStr
              })

              // 取得所有可能的開始小時
              const allHours: number[] = []
              teacherSlots.forEach(slot => {
                const startHour = parseInt(slot.startTime.split(':')[0])
                const endHour = parseInt(slot.endTime.split(':')[0])
                for (let h = startHour; h < endHour; h++) {
                  if (!allHours.includes(h)) allHours.push(h)
                }
              })
              allHours.sort((a, b) => a - b)

              return (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {allHours.map(hour => {
                    const isAvailable = available.includes(hour)
                    const can2h = canBook2Hours(hour, new Date(selectedDate), selectedTeacher)
                    const isSelected1h = selectedSlot?.time === hour.toString().padStart(2, '0') && selectedSlot?.duration === 1
                    const isSelected2h = selectedSlot?.time === hour.toString().padStart(2, '0') && selectedSlot?.duration === 2
                    
                    return (
                      <div key={hour} className="space-y-1">
                        {/* 1 小時選項 */}
                        <button
                          onClick={() => isAvailable && setSelectedSlot({ time: hour.toString().padStart(2, '0'), duration: 1 })}
                          disabled={!isAvailable}
                          className={`w-full p-2 rounded-lg text-sm transition-colors ${
                            isSelected1h
                              ? 'bg-amber-500 text-white'
                              : isAvailable
                              ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 cursor-pointer'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                          }`}
                        >
                          {hour}:00
                          <span className="text-xs ml-1 opacity-70">1堂</span>
                        </button>
                        
                        {/* 2 小時選項 */}
                        {can2h && remainingSessions >= 2 ? (
                          <button
                            onClick={() => isAvailable && setSelectedSlot({ time: hour.toString().padStart(2, '0'), duration: 2 })}
                            disabled={!isAvailable}
                            className={`w-full p-2 rounded-lg text-sm transition-colors ${
                              isSelected2h
                                ? 'bg-amber-600 text-white'
                                : isAvailable
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 cursor-pointer'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                          >
                            {hour}:00
                            <span className="text-xs ml-1 opacity-70">2堂</span>
                          </button>
                        ) : (
                          <div className={`w-full p-2 rounded-lg text-sm text-center ${
                            isAvailable 
                              ? 'bg-amber-100 text-amber-300 border border-amber-200' 
                              : 'bg-gray-100 text-gray-300 opacity-50'
                          }`}>
                            {hour}:00
                            <span className="text-xs ml-1 opacity-70">2堂</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}

        {/* 選擇課程 */}
        {selectedSlot && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-amber-900 mb-3">選擇課程</h2>
            <div className="grid grid-cols-1 gap-3">
              {orders.map(order => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    selectedOrder === order.id
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-amber-100 bg-white hover:border-amber-200'
                  }`}
                >
                  <div className="font-medium text-amber-900">{order.course.name}</div>
                  <div className="text-sm text-amber-600">地點：{order.location.name}</div>
                  <div className="text-sm text-amber-600">堂數：{order.course.sessions} 堂</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 預覽 + 確認 */}
        {selectedSlot && selectedOrder && (
          <div className="bg-amber-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-amber-900 mb-3">預約確認</h3>
            <div className="space-y-2 text-amber-700">
              <p>📅 日期：{selectedDate && formatDate(new Date(selectedDate))}</p>
              <p>🕐 時間：{selectedSlot.time}:00 - {parseInt(selectedSlot.time) + selectedSlot.duration}:00</p>
              <p>📚 扣除堂數：{selectedSlot.duration} 堂</p>
              <p>👩‍🏫 老師：{teachers.find(t => t.id === selectedTeacher)?.name}</p>
            </div>
          </div>
        )}

        {/* 預約按鈕 */}
        {selectedSlot && selectedOrder && (
          <button
            onClick={handleBook}
            disabled={submitting}
            className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 disabled:bg-amber-300 text-lg font-semibold"
          >
            {submitting ? '預約中...' : `確認預約（扣 ${selectedSlot.duration} 堂）`}
          </button>
        )}
      </main>
    </div>
  )
}