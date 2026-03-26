import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { name, email, password, phone } = await request.json()

    // 檢查帳號是否已存在
    const existingStudent = await prisma.student.findUnique({
      where: { email }
    })

    if (existingStudent) {
      return NextResponse.json({ success: false, error: '此 Email 已經註冊過' }, { status: 400 })
    }

    // 建立學生帳號
    const student = await prisma.student.create({
      data: {
        name,
        email,
        password,
        phone: phone || null
      }
    })

    return NextResponse.json({
      success: true,
      user: { id: student.id, name: student.name, email: student.email }
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ success: false, error: '註冊失敗' }, { status: 500 })
  }
}