import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: '缺少必要資料' }, { status: 400 })
    }

    if (password.length < 4) {
      return NextResponse.json({ error: '密碼至少需要 4 個字元' }, { status: 400 })
    }

    // 找 token 且未過期的使用者（學生或老師）
    const student = await prisma.student.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    })

    const teacher = await prisma.teacher.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    })

    const user = student || teacher
    const isStudent = !!student

    if (!user) {
      return NextResponse.json({ error: '連結無效或已過期，請重新申請' }, { status: 400 })
    }

    // 更新密碼並清除 token
    if (isStudent) {
      await prisma.student.update({
        where: { id: user.id },
        data: {
          password,
          resetToken: null,
          resetTokenExpiry: null,
        },
      })
    } else {
      await prisma.teacher.update({
        where: { id: (user as any).id },
        data: {
          password,
          resetToken: null,
          resetTokenExpiry: null,
        },
      })
    }

    return NextResponse.json({ success: true, message: '密碼已成功重設，請使用新密碼登入' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: '發生錯誤，請稍後再試' }, { status: 500 })
  }
}
