import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  sendEmail,
  emailTemplate_N4_BookingCancelled,
  formatDateMedium,
  formatTimeRange,
} from '@/lib/email';

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        order: {
          select: {
            id: true,
            course: {
              select: {
                name: true,
                sessions: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    // 格式化並加入 teacherId
    const formattedBookings = bookings.map(b => ({
      ...b,
      teacherId: b.teacher.id,
      studentName: b.student.name || b.student.email,
    }))

    return NextResponse.json(formattedBookings);
  } catch (error) {
    console.error('Bookings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, status, cancelReason } = body;

    if (!bookingId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const bookingIdNum = parseInt(bookingId);

    // 取得預約資料
    const booking = await prisma.booking.findUnique({
      where: { id: bookingIdNum },
      include: {
        student: true,
        teacher: true,
        location: true,
        order: { include: { course: true } },
      }
    })

    if (!booking) {
      return NextResponse.json({ error: '找不到預約' }, { status: 400 });
    }

    // 如果是取消預約，不退還堂數
    if (status === 'cancelled') {
      // 計算學生剩餘堂數 = 已購買 - 非取消的 duration
      const paidOrders = await prisma.order.findMany({
        where: { studentId: booking.studentId, status: 'paid' },
        include: { course: true }
      })
      const purchasedSessions = paidOrders.reduce((sum, o) => sum + (o.course.sessions * o.quantity), 0)

      const allBookings = await prisma.booking.findMany({
        where: { studentId: booking.studentId }
      })
      const nonCancelledDuration = allBookings
        .filter(b => b.status !== 'cancelled' && b.id !== bookingIdNum)
        .reduce((sum, b) => sum + b.duration, 0)

      const newRemaining = purchasedSessions - nonCancelledDuration

      // 更新預約狀態
      await prisma.booking.update({
        where: { id: bookingIdNum },
        data: { status },
      })

      // N4: 老師取消預約後，通知學生
      try {
        const { subject, html } = emailTemplate_N4_BookingCancelled({
          studentName: booking.student.name || booking.student.email,
          date: formatDateMedium(booking.startTime),
          time: formatTimeRange(booking.startTime, booking.endTime),
          locationName: booking.location.name,
          teacherName: booking.teacher.name,
          reason: cancelReason || undefined,
        })
        await sendEmail({ to: booking.student.email, subject, html })
      } catch (emailError) {
        console.error('N4 Email send error:', emailError)
        // 不影響主要流程
      }

      return NextResponse.json({ 
        success: true, 
        message: '已取消預約（堂數不退還）',
        newRemaining
      });
    }

    // 其他狀態更新
    const updated = await prisma.booking.update({
      where: { id: bookingIdNum },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Booking update error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
