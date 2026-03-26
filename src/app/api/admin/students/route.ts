import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        orders: {
          where: { status: 'paid' },
          include: { course: true },
        },
        bookings: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 計算每個學生的剩餘堂數
    const studentsWithSessions = students.map(student => {
      // 購買的總堂數
      const purchasedSessions = student.orders.reduce((total, order) => {
        return total + (order.course.sessions * order.quantity);
      }, 0);

      // 已使用的堂數
      const usedSessions = student.bookings.filter(b => b.status === 'completed').length;

      // 剩餘堂數
      const remainingSessions = purchasedSessions - usedSessions;

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        createdAt: student.createdAt,
        totalOrders: student.orders.length,
        totalBookings: student.bookings.length,
        purchasedSessions,
        usedSessions,
        remainingSessions: Math.max(0, remainingSessions),
      };
    });

    return NextResponse.json(studentsWithSessions);
  } catch (error) {
    console.error('Students fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
