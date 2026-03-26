import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { email, role } = await request.json()

    if (!email) {
      return NextResponse.json({ error: '請輸入 Email' }, { status: 400 })
    }

    // role: 'student' 或 'teacher'
    const isStudent = role === 'teacher' ? false : true

    const user = isStudent
      ? await prisma.student.findUnique({ where: { email } })
      : await prisma.teacher.findUnique({ where: { email } })

    // 無論帳號是否存在都回傳成功（不暴露帳號是否存在）
    if (!user) {
      return NextResponse.json({ success: true, message: '如果此 Email 存在，已收到重設密碼的郵件' })
    }

    // 產生重設 token（一小時後過期）
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 小時

    // 儲存 token
    if (isStudent) {
      await prisma.student.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry }
      })
    } else {
      await prisma.teacher.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry }
      })
    }

    // 產生重設連結
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&role=${role || (isStudent ? 'student' : 'teacher')}`

    // 寄送 Email
    const html = `
      <div style="font-family: 'Noto Sans TC', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #f59e0b;">🎤 SingBook 預約平台</h2>
        <p>親愛的 ${user.name || email}，</p>
        <p>我們收到您提出的密碼重設請求。請點擊以下連結設定新密碼：</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            重設密碼
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">或複製連結到瀏覽器開啟：<br>${resetUrl}</p>
        <p style="color: #666; font-size: 14px;">此連結將在 1 小時後失效。<br>如果您沒有申請密碼重設，請忽略這封郵件。</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 12px;">此為系統自動發送，請勿回覆。</p>
      </div>
    `

    await sendEmail({
      to: email,
      subject: '🔑 SingBook 密碼重設連結',
      html,
    })

    return NextResponse.json({ success: true, message: '如果此 Email 存在，已收到重設密碼的郵件' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: '發生錯誤，請稍後再試' }, { status: 500 })
  }
}
