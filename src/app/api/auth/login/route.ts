import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // 檢查老師
    const teacher = await prisma.teacher.findUnique({
      where: { email }
    })

    if (teacher && teacher.password === password) {
      return NextResponse.json({
        success: true,
        user: { id: teacher.id, name: teacher.name, email: teacher.email, role: 'teacher' }
      })
    }

    // 檢查學生
    const student = await prisma.student.findUnique({
      where: { email }
    })

    if (student && student.password === password) {
      return NextResponse.json({
        success: true,
        user: { id: student.id, name: student.name, email: student.email, role: 'student' }
      })
    }

    return NextResponse.json({ success: false, error: '帳號或密碼錯誤' }, { status: 401 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, error: '登入失敗' }, { status: 500 })
  }
}
