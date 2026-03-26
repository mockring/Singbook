import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request) {
  try {
    const { studentId, name, email, currentPassword, newPassword, phone } = await request.json()

    if (!studentId) {
      return NextResponse.json({ error: '缺少學生ID' }, { status: 400 })
    }

    const studentIdNum = parseInt(studentId)

    // 取得學生現有資料
    const student = await prisma.student.findUnique({
      where: { id: studentIdNum }
    })

    if (!student) {
      return NextResponse.json({ error: '找不到學生資料' }, { status: 404 })
    }

    // 如果要改密碼，必須驗證舊密碼
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: '請輸入舊密碼以確認修改' }, { status: 400 })
      }
      if (student.password !== currentPassword) {
        return NextResponse.json({ error: '舊密碼錯誤' }, { status: 401 })
      }
    }

    // 如果要改 Email，檢查是否被其他學生使用
    if (email && email !== student.email) {
      const existing = await prisma.student.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: '此 Email 已被其他學生使用' }, { status: 400 })
      }
    }

    // 更新資料
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (newPassword) updateData.password = newPassword
    if (phone !== undefined) updateData.phone = phone || null

    const updated = await prisma.student.update({
      where: { id: studentIdNum },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      student: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
      }
    })
  } catch (error) {
    console.error('Student profile update error:', error)
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}
