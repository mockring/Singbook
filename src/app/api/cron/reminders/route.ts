import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  sendEmail,
  emailTemplate_N5_TomorrowReminder,
  formatDateMedium,
  formatTimeRange,
} from '@/lib/email'

/**
 * N5: 預約前 1 天提醒
 *
 * 此 API 由 OpenClaw Cron Job 每日 09:00 觸發。
 * 邏輯：找出所有「明天」的 scheduled 預約，寄送提醒給學生和老師。
 *
 * 呼叫方式（本地測試）：
 * GET /api/cron/reminders?secret=YOUR_SECRET
 *
 * OpenClaw cron 會定時呼叫，透過 delivery.mode="announce" 或 webhook。
 */
export async function GET(request: Request) {
  // 簡單的 secret 保護，避免路人隨意觸發
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET || 'singbook-cron-secret'

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 計算「明天」的日期範圍
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const tomorrowEnd = new Date(tomorrow)
    tomorrowEnd.setHours(23, 59, 59, 999)

    // 找出所有明天的 scheduled 預約
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        status: 'scheduled',
        startTime: {
          gte: tomorrow,
          lte: tomorrowEnd,
        },
      },
      include: {
        student: true,
        teacher: true,
        location: true,
        order: { include: { course: true } },
      },
    })

    if (upcomingBookings.length === 0) {
      return NextResponse.json({ message: 'No reminders to send', count: 0 })
    }

    let sentCount = 0
    const errors: string[] = []

    for (const booking of upcomingBookings) {
      const dateStr = formatDateMedium(booking.startTime)
      const timeStr = formatTimeRange(booking.startTime, booking.endTime)

      // 寄給學生
      try {
        const studentTemplate = emailTemplate_N5_TomorrowReminder({
          studentName: booking.student.name || booking.student.email,
          teacherName: booking.teacher.name,
          studentEmail: booking.student.email,
          teacherEmail: booking.teacher.email,
          date: dateStr,
          time: timeStr,
          locationName: booking.location.name,
          locationAddress: booking.location.address,
          courseName: booking.order.course.name,
          role: 'student',
        })
        await sendEmail({
          to: booking.student.email,
          subject: studentTemplate.subject,
          html: studentTemplate.html,
        })
      } catch (err) {
        errors.push(`Student email error (booking ${booking.id}): ${err}`)
      }

      // 寄給老師
      try {
        const teacherTemplate = emailTemplate_N5_TomorrowReminder({
          studentName: booking.student.name || booking.student.email,
          teacherName: booking.teacher.name,
          studentEmail: booking.student.email,
          teacherEmail: booking.teacher.email,
          date: dateStr,
          time: timeStr,
          locationName: booking.location.name,
          locationAddress: booking.location.address,
          courseName: booking.order.course.name,
          role: 'teacher',
        })
        await sendEmail({
          to: booking.teacher.email,
          subject: teacherTemplate.subject,
          html: teacherTemplate.html,
        })
      } catch (err) {
        errors.push(`Teacher email error (booking ${booking.id}): ${err}`)
      }

      sentCount++
    }

    return NextResponse.json({
      message: 'Reminders sent',
      count: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Cron reminders error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
