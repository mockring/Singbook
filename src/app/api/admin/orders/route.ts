import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, emailTemplate_N2_PaymentConfirmed } from '@/lib/email';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        student: true,
        course: true,
        location: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status, bankAccountLast5 } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const orderIdNum = parseInt(orderId);

    // 取得完整訂單資料（用於寄送 Email）
    const order = await prisma.order.findUnique({
      where: { id: orderIdNum },
      include: {
        student: true,
        course: true,
        location: true,
      }
    })

    const updateData: any = { status };

    if (status === 'paid') {
      updateData.paidAt = new Date();
    }

    if (bankAccountLast5) {
      updateData.bankAccountLast5 = bankAccountLast5;
    }

    const updated = await prisma.order.update({
      where: { id: orderIdNum },
      data: updateData,
    });

    // N2: 老師確認收款後，通知學生
    if (status === 'paid' && order) {
      try {
        const { subject, html } = emailTemplate_N2_PaymentConfirmed({
          studentName: order.student.name || order.student.email,
          courseName: order.course.name,
          quantity: order.quantity,
          locationName: order.location.name,
          totalAmount: order.totalAmount,
        })
        await sendEmail({ to: order.student.email, subject, html })
      } catch (emailError) {
        console.error('N2 Email send error:', emailError)
        // 不影響主要流程
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
