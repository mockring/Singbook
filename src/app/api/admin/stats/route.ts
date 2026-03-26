import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 今日預約數
    const todayBookings = await prisma.booking.count({
      where: {
        startTime: {
          gte: today,
          lt: tomorrow,
        },
        status: 'scheduled',
      },
    });

    // 待確認訂單數
    const pendingOrders = await prisma.order.count({
      where: {
        status: 'pending',
      },
    });

    // 總學生數
    const totalStudents = await prisma.student.count();

    // 總訂單數
    const totalOrders = await prisma.order.count();

    // 總預約數
    const totalBookings = await prisma.booking.count();

    return NextResponse.json({
      todayBookings,
      pendingOrders,
      totalStudents,
      totalOrders,
      totalBookings,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
