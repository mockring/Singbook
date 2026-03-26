import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request) {
  try {
    const { teacherId, name, email, currentPassword, newPassword } = await request.json()

    if (!teacherId) {
      return NextResponse.json({ error: '缺少老師ID' }, { status: 400 })
    }

    const teacherIdNum = parseInt(teacherId)

    // 取得老師現有資料
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherIdNum }
    })

    if (!teacher) {
      return NextResponse.json({ error: '找不到老師資料' }, { status: 404 })
    }

    // 如果要改密碼，必須驗證舊密碼
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: '請輸入舊密碼以確認修改' }, { status: 400 })
      }
      if (teacher.password !== currentPassword) {
        return NextResponse.json({ error: '舊密碼錯誤' }, { status: 401 })
      }
    }

    // 如果要改 Email，檢查是否被其他老師使用
    if (email && email !== teacher.email) {
      const existing = await prisma.teacher.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: '此 Email 已被其他老師使用' }, { status: 400 })
      }
    }

    // 更新資料
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (newPassword) updateData.password = newPassword

    const updated = await prisma.teacher.update({
      where: { id: teacherIdNum },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      teacher: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
      }
    })
  } catch (error) {
    console.error('Teacher profile update error:', error)
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}
