import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { name, email, phone, courseId, locationId, quantity } = await request.json()

    // 查找或建立學生
    let student = await prisma.student.findUnique({
      where: { email }
    })

    if (!student) {
      student = await prisma.student.create({
        data: {
          name,
          email,
          phone: phone || null,
          password: Math.random().toString(36).slice(-8) // 臨時密碼
        }
      })
    }

    // 取得課程與地點資訊計算價格
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    const location = await prisma.location.findUnique({ where: { id: locationId } })

    if (!course || !location) {
      return NextResponse.json({ success: false, error: '課程或地點不存在' }, { status: 400 })
    }

    const totalAmount = (course.price * quantity) + (location.price * quantity * course.sessions)

    // 建立訂單
    const order = await prisma.order.create({
      data: {
        studentId: student.id,
        courseId,
        locationId,
        quantity,
        totalAmount,
        status: 'pending'
      }
    })

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (error) {
    console.error('Book error:', error)
    return NextResponse.json({ success: false, error: '發生錯誤' }, { status: 500 })
  }
}