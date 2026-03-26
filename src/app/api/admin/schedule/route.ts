import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 取得所有老師時段
export async function GET() {
  try {
    const timeSlots = await prisma.timeSlot.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // 取得所有 bookings 用於計算可用時段
    const bookings = await prisma.booking.findMany({
      where: { status: { not: 'cancelled' } },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        duration: true,
        teacherId: true,
      },
    });

    // 將 bookings 附加到每個 timeSlot
    const timeSlotsWithBookings = timeSlots.map(slot => {
      const slotDate = new Date(slot.date).toISOString().split('T')[0];
      const slotBookings = bookings.filter(b => {
        const bookingDate = new Date(b.startTime).toISOString().split('T')[0];
        return b.teacherId === slot.teacherId && bookingDate === slotDate;
      });
      // isBooked 已廢除，只顯示 bookings 由前端計算可用時段
      return { ...slot, bookings: slotBookings, isBooked: undefined };
    });

    return NextResponse.json(timeSlotsWithBookings);
  } catch (error) {
    console.error('Time slots fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch time slots' }, { status: 500 });
  }
}

// POST: 新增時段
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, timeSlotId, startTime, endTime, duration } = body;

    // ====== 建立預約（從 schedule 頁面）======
    if (startTime && endTime && timeSlotId) {
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

      // 計算學生剩餘堂數
      const studentId = order.studentId
      
      // 取得該學生所有已付款的訂單
      const paidOrders = await prisma.order.findMany({
        where: { studentId, status: 'paid' },
        include: { course: true }
      })
      const purchasedSessions = paidOrders.reduce((sum, o) => sum + (o.course.sessions * o.quantity), 0)
      
      // 取得該學生所有預約（已預約 + 已完成）
      const existingBookings = await prisma.booking.findMany({
        where: { studentId }
      })
      const usedSessions = existingBookings.filter(b => b.status !== 'cancelled').length
      const remainingSessions = purchasedSessions - usedSessions

      if (remainingSessions < duration) {
        return NextResponse.json({ success: false, error: `剩餘堂數不足，需要 ${duration} 堂` }, { status: 400 })
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

      return NextResponse.json({ success: true, booking })
    }

    // ====== 新增時段（從 admin/schedule 頁面）======
    // 支援兩種格式：slotStartTime/slotEndTime 或 startTime/endTime
    const { teacherId, date, startTime: slotStartTime, endTime: slotEndTime } = body;

    const finalStartTime = slotStartTime || body.startTime;
    const finalEndTime = slotEndTime || body.endTime;

    if (!teacherId || !date || !finalStartTime || !finalEndTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const timeSlot = await prisma.timeSlot.create({
      data: {
        teacherId: parseInt(teacherId),
        date: new Date(date),
        startTime: finalStartTime,
        endTime: finalEndTime,
        // isBooked 已廢除
      },
    });

    return NextResponse.json(timeSlot);
  } catch (error) {
    console.error('Time slot/booking error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

// DELETE: 刪除時段
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Time slot ID required' }, { status: 400 });
    }

    await prisma.timeSlot.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Time slot delete error:', error);
    return NextResponse.json({ error: 'Failed to delete time slot' }, { status: 500 });
  }
}
