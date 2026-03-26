import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, emailTemplate_N1_PaymentSubmitted } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { orderId, bankAccountLast5, amount, note } = await request.json()

    // 轉換為數字
    const orderIdNum = parseInt(orderId)

    const order = await prisma.order.findUnique({
      where: { id: orderIdNum },
      include: {
        student: true,
        course: true,
        location: true,
      }
    })

    if (!order) {
      return NextResponse.json({ success: false, error: '訂單不存在' }, { status: 400 })
    }

    // 更新訂單
    await prisma.order.update({
      where: { id: orderIdNum },
      data: {
        bankAccountLast5,
        paidAmount: amount ? parseInt(amount) : null,
        note: note || null,
        status: 'pending' // 等待老師確認
      }
    })

    // N1: 通知老師有新訂單（學生已匯款）
    try {
      const teacher = await prisma.teacher.findFirst()
      if (teacher?.email) {
        const { subject, html } = emailTemplate_N1_PaymentSubmitted({
          studentName: order.student.name || order.student.email,
          courseName: order.course.name,
          totalAmount: order.totalAmount,
          bankAccountLast5: bankAccountLast5 || '',
          paidAmount: amount ? parseInt(amount) : undefined,
          note: note || undefined,
        })
        await sendEmail({ to: teacher.email, subject, html })
      }
    } catch (emailError) {
      console.error('N1 Email send error:', emailError)
      // 不影響主要流程，只記錄錯誤
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json({ success: false, error: '發生錯誤' }, { status: 500 })
  }
}
