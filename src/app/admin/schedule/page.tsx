'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TimeSlot {
  id: number
  teacherId: number
  date: string
  startTime: string
  endTime: string
}

interface Booking {
  id: number
  startTime: string
  endTime: string
  duration: number
  status: string
  teacherId: number
  studentName?: string
}

const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']

export default function AdminSchedulePage() {
  const router = useRouter()
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('22:00')
  const [submitting, setSubmitting] = useState(false)
  const [teacherId, setTeacherId] = useState<number | null>(null)

  // 快速排班狀態
  const [quickStartTime, setQuickStartTime] = useState('19:00')
  const [quickEndTime, setQuickEndTime] = useState('22:00')
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([])
  const [quickSubmitting, setQuickSubmitting] = useState(false)

  const weekdays = [
    { value: 0, label: '日' },
    { value: 1, label: '一' },
    { value: 2, label: '二' },
    { value: 3, label: '三' },
    { value: 4, label: '四' },
    { value: 5, label: '五' },
    { value: 6, label: '六' },
  ]

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  // 取得日期的 YYYY-MM-DD 字串（使用當地時區）
  const getLocalDateStr = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 取得當月所有符合選中星期幾的日期（不包括過去）
  const getDatesForSelectedWeekdays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const today = getLocalDateStr(new Date())
    const dates: string[] = []

    for (let d = 1; d <= 31; d++) {
      const date = new Date(year, month, d)
      if (date.getMonth() !== month) break
      const dateStr = getLocalDateStr(date)
      if (dateStr < today) continue
      if (selectedWeekdays.includes(date.getDay())) {
        dates.push(dateStr)
      }
    }
    return dates
  }, [currentDate, selectedWeekdays])

  // 快速新增時段
  const handleQuickAdd = async () => {
    if (!selectedWeekdays.length) {
      alert('請選擇至少一個星期')
      return
    }
    if (quickStartTime >= quickEndTime) {
      alert('結束時間必須晚於開始時間')
      return
    }

    const dates = getDatesForSelectedWeekdays
    if (!dates.length) {
      alert('沒有可新增的日期')
      return
    }

    const confirmMsg = `確定要為 ${currentDate.getFullYear()} 年 ${currentDate.getMonth() + 1} 月的 ${selectedWeekdays.map(d => weekdays.find(w => w.value === d)?.label).join('、')} 新增 ${dates.length} 個時段嗎？\n時間：${quickStartTime} - ${quickEndTime}`

    if (!confirm(confirmMsg)) return

    setQuickSubmitting(true)
    let successCount = 0
    let failCount = 0

    for (const date of dates) {
      try {
        const res = await fetch('/api/admin/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacherId,
            date,
            startTime: quickStartTime,
            endTime: quickEndTime,
          }),
        })
        if (res.ok) {
          const newSlot = await res.json()
          setTimeSlots(prev => [...prev, newSlot])
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }

    setQuickSubmitting(false)
    alert(`完成！成功 ${successCount} 個，失敗 ${failCount} 個`)
  }

  // 快速批次刪除
  const handleQuickDelete = async () => {
    if (!selectedWeekdays.length) {
      alert('請選擇至少一個星期')
      return
    }

    const dates = getDatesForSelectedWeekdays
    // 找出這些日期的時段（需要把 Date 物件轉成 ISO 字串比對）
    const slotsToDelete = timeSlots.filter(s => {
      const slotDate = new Date(s.date).toISOString().split('T')[0]
      return dates.includes(slotDate)
    })

    if (!slotsToDelete.length) {
      alert('沒有可刪除的時段')
      return
    }

    const confirmMsg = `確定要刪除 ${currentDate.getFullYear()} 年 ${currentDate.getMonth() + 1} 月的 ${selectedWeekdays.map(d => weekdays.find(w => w.value === d)?.label).join('、')} 共 ${slotsToDelete.length} 個時段嗎？`

    if (!confirm(confirmMsg)) return

    setQuickSubmitting(true)
    let successCount = 0
    let failCount = 0

    for (const slot of slotsToDelete) {
      try {
        const res = await fetch(`/api/admin/schedule?id=${slot.id}`, { method: 'DELETE' })
        if (res.ok) {
          setTimeSlots(prev => prev.filter(s => s.id !== slot.id))
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }

    setQuickSubmitting(false)
    alert(`完成！成功刪除 ${successCount} 個，失敗 ${failCount} 個`)
  }

  // 檢查某天是否有預約（排除已取消的）
  const getDayHasBooking = (date: Date) => {
    const dateStr = getLocalDateStr(date)
    return bookings.some(b => {
      if (b.status === 'cancelled') return false
      const bookingDate = getLocalDateStr(new Date(b.startTime))
      return bookingDate === dateStr
    })
  }

  useEffect(() => {
    const token = localStorage.getItem('userId')
    const role = localStorage.getItem('userRole')
    if (!token || role !== 'teacher') {
      router.push('/admin/login')
      return
    }

    setTeacherId(parseInt(token))
  }, [router])

  // 當 teacherId 設定後才抓資料
  useEffect(() => {
    if (!teacherId) return
    fetchData()
  }, [teacherId])

  async function fetchData() {
    try {
      const [slotsRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/schedule'),
        fetch('/api/admin/bookings')
      ])

      const slotsData = await slotsRes.json()
      const bookingsData = await bookingsRes.json()

      // 只顯示自己的時段
      const mySlots = (Array.isArray(slotsData) ? slotsData : [])
        .filter((s: TimeSlot) => s.teacherId === teacherId)
      // 只顯示自己的預約
      const myBookings = (Array.isArray(bookingsData) ? bookingsData : [])
        .filter((b: Booking) => b.teacherId === teacherId)

      setTimeSlots(mySlots)
      setBookings(myBookings)
    } catch (error) {
      console.error('Fetch error:', error)
    }
    setLoading(false)
  }

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

  // 檢查某天是否有已開放的時段
  const getDayHasSlot = (date: Date) => {
    const dateStr = getLocalDateStr(date)
    return timeSlots.some(s => {
      const slotDate = getLocalDateStr(new Date(s.date))
      return slotDate === dateStr
    })
  }

  // 取得某天的時段
  const getSlotForDate = (date: Date) => {
    const dateStr = getLocalDateStr(date)
    return timeSlots.find(s => {
      const slotDate = getLocalDateStr(new Date(s.date))
      return slotDate === dateStr
    })
  }

  // 取得某天的預約（排除已取消的）
  const getBookingsForDate = (date: Date) => {
    const dateStr = getLocalDateStr(date)
    return bookings.filter(b => {
      if (b.status === 'cancelled') return false
      const bookingDate = getLocalDateStr(new Date(b.startTime))
      return bookingDate === dateStr
    })
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleDateClick = (date: Date) => {
    const dateStr = getLocalDateStr(date)
    const today = getLocalDateStr(new Date())

    // 不能選擇過去的日期
    if (dateStr < today) return

    const existingSlot = getSlotForDate(date)

    if (existingSlot) {
      // 已有時段 → 顯示詳情
      setSelectedSlot(existingSlot)
    } else {
      // 沒有時段 → 新增
      setSelectedDate(dateStr)
      setStartTime('10:00')
      setEndTime('22:00')
      setShowAddModal(true)
    }
  }

  const handleCreateSlot = async () => {
    if (!selectedDate || !startTime || !endTime) {
      alert('請填寫所有欄位')
      return
    }

    if (startTime >= endTime) {
      alert('結束時間必須晚於開始時間')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          date: selectedDate,
          startTime,
          endTime,
        }),
      })

      if (res.ok) {
        const newSlot = await res.json()
        setTimeSlots([...timeSlots, newSlot])
        setShowAddModal(false)
        alert('新增成功！')
      } else {
        const data = await res.json()
        alert(data.error || '新增失敗')
      }
    } catch (error) {
      console.error('Create failed:', error)
      alert('新增失敗')
    }
    setSubmitting(false)
  }

  const handleDeleteSlot = async (id: number) => {
    if (!confirm('確定要刪除此時段嗎？')) return

    try {
      const res = await fetch(`/api/admin/schedule?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setTimeSlots(timeSlots.filter(s => s.id !== id))
        setSelectedSlot(null)
        alert('刪除成功！')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      alert('刪除失敗')
    }
  }

  const formatDate = (date: Date | string) => {
    let d: Date
    if (typeof date === 'string') {
      // 如果已經是 ISO 格式（包含 T），直接轉換
      d = date.includes('T') ? new Date(date) : new Date(date + 'T00:00:00')
    } else {
      d = new Date(date)
    }
    return d.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' })
  }

  const isPast = (date: Date) => {
    const dateStr = getLocalDateStr(date)
    const today = getLocalDateStr(new Date())
    return dateStr < today
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-white hover:text-indigo-200">← 返回</Link>
            <h1 className="text-2xl font-bold">🗓️ 時段管理</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 月曆 */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          {/* 月份切換 */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              ← 上一月
            </button>
            <span className="text-lg font-bold text-gray-800">
              {currentDate.getFullYear()} 年 {currentDate.getMonth() + 1} 月
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              下一月 →
            </button>
          </div>

          {/* 星期標題 */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* 日曆網格 */}
          <div className="grid grid-cols-7 gap-1">
            {getMonthDays.map((day, idx) => {
              const hasSlot = getDayHasSlot(day)
              const hasBooking = getDayHasBooking(day)
              const isPastDay = isPast(day)
              const isToday = day.toDateString() === new Date().toDateString()

              return (
                <button
                  key={idx}
                  onClick={() => !isPastDay && handleDateClick(day)}
                  disabled={isPastDay}
                  className={`
                    h-12 rounded-lg text-center transition-all text-xs
                    ${isPastDay ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : ''}
                    ${!isPastDay && !hasSlot ? 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 cursor-pointer' : ''}
                    ${!isPastDay && hasSlot ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer' : ''}
                    ${isToday ? 'ring-2 ring-indigo-400' : ''}
                  `}
                >
                  <div className="text-sm font-medium">{day.getDate()}</div>
                  {!isPastDay && hasSlot && (
                    <div className="text-xs opacity-80">{hasBooking ? '有預約' : '無預約'}</div>
                  )}
                </button>
              )
            })}
          </div>

          {/* 圖例 */}
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-50 rounded"></div>
              <span className="text-gray-600">可新增</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-600 rounded"></div>
              <span className="text-gray-600">已開放</span>
            </div>
          </div>
        </div>

        {/* 說明 */}
        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
          💡 點擊日期可新增或管理時段。紫色的日期表示已開放時段，點擊可查看或刪除。
        </div>

        {/* 快速排班 */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">快速排班</h2>
          <p className="text-sm text-gray-500 mb-4">
            為 {currentDate.getFullYear()} 年 {currentDate.getMonth() + 1} 月的特定星期新增或刪除時段
          </p>

          <div className="flex flex-wrap items-end gap-4">
            {/* 時間範圍 */}
            <div className="flex items-center gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">開始</label>
                <select
                  value={quickStartTime}
                  onChange={e => setQuickStartTime(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                      {`${i.toString().padStart(2, '0')}:00`}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-gray-400 mt-5">-</span>
              <div>
                <label className="block text-xs text-gray-600 mb-1">結束</label>
                <select
                  value={quickEndTime}
                  onChange={e => setQuickEndTime(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                      {`${i.toString().padStart(2, '0')}:00`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 星期選擇 */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">選擇星期</label>
              <div className="flex gap-1">
                {weekdays.map(w => (
                  <button
                    key={w.value}
                    onClick={() => toggleWeekday(w.value)}
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                      selectedWeekdays.includes(w.value)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 預覽 */}
            <div className="text-xs text-gray-500">
              {selectedWeekdays.length > 0
                ? `將新增 ${getDatesForSelectedWeekdays.length} 個時段`
                : '選擇星期以預覽'}
            </div>

            {/* 按鈕 */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleQuickAdd}
                disabled={quickSubmitting || !selectedWeekdays.length}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {quickSubmitting ? '處理中...' : '+ 新增'}
              </button>
              <button
                onClick={handleQuickDelete}
                disabled={quickSubmitting || !selectedWeekdays.length}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                批次刪除
              </button>
            </div>
          </div>

          {/* 預覽選中的日期 */}
          {selectedWeekdays.length > 0 && getDatesForSelectedWeekdays.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">
                將影響的日期：
              </p>
              <div className="flex flex-wrap gap-1">
                {getDatesForSelectedWeekdays.map(d => {
                  const date = new Date(d + 'T00:00:00')
                  const weekday = dayNames[date.getDay()]
                  const dateStr = date.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })
                  return (
                    <span key={d} className="px-2 py-1 bg-white rounded text-xs">
                      {weekday}{dateStr}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 新增時段 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">新增時段</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                <input
                  type="text"
                  value={selectedDate ? formatDate(selectedDate) : ''}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">開始時間</label>
                  <select
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                        {`${i.toString().padStart(2, '0')}:00`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">結束時間</label>
                  <select
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                        {`${i.toString().padStart(2, '0')}:00`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateSlot}
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {submitting ? '新增中...' : '確認新增'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 已有時段詳情 Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">時段詳情</h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">日期</label>
                <p className="font-medium text-gray-800">{formatDate(selectedSlot.date)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">時段</label>
                <p className="font-medium text-gray-800">{selectedSlot.startTime} - {selectedSlot.endTime}</p>
              </div>

              {/* 該日預約 */}
              {getBookingsForDate(new Date(selectedSlot.date)).length > 0 && (
                <div className="mt-4">
                  <label className="text-sm text-gray-500">已有預約</label>
                  <div className="mt-2 space-y-2">
                    {getBookingsForDate(new Date(selectedSlot.date)).map(booking => (
                      <div key={booking.id} className="p-2 bg-gray-50 rounded text-sm">
                        <p className="text-gray-800">
                          {new Date(booking.startTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {booking.studentName || '學生'} | {booking.duration}小時
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSelectedSlot(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                關閉
              </button>
              <button
                onClick={() => handleDeleteSlot(selectedSlot.id)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                刪除時段
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
