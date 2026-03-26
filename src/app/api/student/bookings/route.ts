import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  sendEmail,
  emailTemplate_N3_BookingConfirmed,
  formatDateMedium,
  formatTimeRange,
} from '@/lib/email'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('studentId')

  if (!studentId) {
    return NextResponse.json({ bookings: [] })
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { studentId: parseInt(studentId) },
      include: {
        location: true,
        order: { include: { course: true } }
      },
      orderBy: { startTime: 'desc' }
    })

    // 格式化回應
    const formattedBookings = bookings.map(b => ({
      id: b.id,
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      duration: b.duration,
      status: b.status,
      teacherId: b.teacherId,
      location: b.location,
      course: b.order.course
    }))

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ bookings: [] })
  }
}

export async function POST(request: Request) {
  try {
    const { orderId, timeSlotId, startTime, endTime, duration } = await request.json()

    if (!orderId || !timeSlotId || !startTime || !endTime || !duration) {
      return NextResponse.json({ success: false, error: '缺少必要資料' }, { status: 400 })
    }

    // 取得時段資料
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: { teacher: true }
    })

    if (!timeSlot) {
      return NextResponse.json({ success: false, error: '時段不存在' }, { status: 400 })
    }

    // 取得訂單資料
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { student: true, location: true, course: true }
    })

    if (!order) {
      return NextResponse.json({ success: false, error: '訂單不存在' }, { status: 400 })
    }

    if (order.status !== 'paid') {
      return NextResponse.json({ success: false, error: '訂單尚未付款' }, { status: 400 })
    }

    const studentId = order.studentId

    // 計算學生剩餘堂數
    // 剩餘堂數 = 已購堂數 - (已完成 + 已預約) 的 duration
    // 取消的堂數不退還
    const paidOrders = await prisma.order.findMany({
      where: { studentId, status: 'paid' },
      include: { course: true }
    })
    const purchasedSessions = paidOrders.reduce((sum, o) => sum + (o.course.sessions * o.quantity), 0)

    const existingBookings = await prisma.booking.findMany({
      where: { studentId }
    })
    const nonCancelledDuration = existingBookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.duration, 0)
    const remainingSessions = purchasedSessions - nonCancelledDuration

    if (remainingSessions < duration) {
      return NextResponse.json({ success: false, error: `剩餘堂數不足，需要 ${duration} 堂` }, { status: 400 })
    }

    // 檢查該老師在該日期是否有時間衝突
    const slotDate = new Date(timeSlot.date).toISOString().split('T')[0]
    const reqStartHour = new Date(startTime).getHours()
    const reqEndHour = new Date(endTime).getHours()

    const teacherBookings = await prisma.booking.findMany({
      where: {
        teacherId: timeSlot.teacherId,
        status: { not: 'cancelled' }
      }
    })

    // 檢查是否有重疊的時段
    const hasOverlap = teacherBookings.some(b => {
      const bDate = new Date(b.startTime).toISOString().split('T')[0]
      if (bDate !== slotDate) return false
      const bStart = new Date(b.startTime).getHours()
      const bEnd = new Date(b.endTime).getHours()
      // 重疊條件：新的開始 < 現有的結束 且 新的結束 > 現有的開始
      return !(reqEndHour <= bStart || reqStartHour >= bEnd)
    })

    if (hasOverlap) {
      return NextResponse.json({ success: false, error: '此時段已被其他預約' }, { status: 400 })
    }

    // 建立預約
    const booking = await prisma.booking.create({
      data: {
        studentId: order.studentId,
        orderId: orderId,
        teacherId: timeSlot.teacherId,
        locationId: order.locationId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration,
        status: 'scheduled'
      }
    })

    // isBooked 已廢除，不需要更新 TimeSlot

    // N3: 通知學生預約成功
    try {
      const startDate = new Date(startTime)
      const endDate = new Date(endTime)
      const { subject, html } = emailTemplate_N3_BookingConfirmed({
        studentName: order.student.name || order.student.email,
        courseName: order.course.name,
        date: formatDateMedium(startDate),
        time: formatTimeRange(startDate, endDate),
        locationName: order.location.name,
        locationAddress: order.location.address,
        teacherName: timeSlot.teacher.name,
      })
      await sendEmail({ to: order.student.email, subject, html })
    } catch (emailError) {
      console.error('N3 Email send error:', emailError)
      // 不影響主要流程
    }

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ success: false, error: '預約失敗' }, { status: 500 })
  }
}

// DELETE: 學生取消預約
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')
    const studentId = searchParams.get('studentId')

    if (!bookingId || !studentId) {
      return NextResponse.json({ error: '缺少必要資料' }, { status: 400 })
    }

    const bookingIdNum = parseInt(bookingId)
    const studentIdNum = parseInt(studentId)

    // 取得預約資料
    const booking = await prisma.booking.findUnique({
      where: { id: bookingIdNum }
    })

    if (!booking) {
      return NextResponse.json({ error: '找不到預約' }, { status: 400 })
    }

    if (booking.studentId !== studentIdNum) {
      return NextResponse.json({ error: '無權限取消此預約' }, { status: 403 })
    }

    if (booking.status !== 'scheduled') {
      return NextResponse.json({ error: '只能取消待上課的預約' }, { status: 400 })
    }

    // 取消預約不退還堂數（取消的堂數不退還）
    // 計算學生剩餘堂數 = 已購買 - 非取消的 duration
    const paidOrders = await prisma.order.findMany({
      where: { studentId: studentIdNum, status: 'paid' },
      include: { course: true }
    })
    const purchasedSessions = paidOrders.reduce((sum, o) => sum + (o.course.sessions * o.quantity), 0)

    const allBookings = await prisma.booking.findMany({
      where: { studentId: studentIdNum }
    })
    // 不算入：1) 狀態是 cancelled 的  2) 即將被取消的這筆
    const nonCancelledDuration = allBookings
      .filter(b => b.status !== 'cancelled' && b.id !== bookingIdNum)
      .reduce((sum, b) => sum + b.duration, 0)

    const newRemaining = purchasedSessions - nonCancelledDuration

    // 更新預約狀態
    await prisma.booking.update({
      where: { id: bookingIdNum },
      data: { status: 'cancelled' }
    })

    return NextResponse.json({ 
      success: true, 
      message: '已取消預約（堂數不退還）',
      newRemaining
    })
  } catch (error) {
    console.error('Booking cancel error:', error)
    return NextResponse.json({ error: '取消失敗' }, { status: 500 })
  }
}
