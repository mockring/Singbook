import nodemailer from 'nodemailer'

// ============================================================
// Email 服務 - SingBook 預約平台
// ============================================================
// 使用方式：await sendEmail({ to, subject, html })
// ============================================================

// 建立 transporter（延遲初始化，等環境變數備妥）
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  const transporter = getTransporter()

  const from = process.env.EMAIL_FROM || 'SingBook <noreply@singbook.com>'

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
  })
}

// ============================================================
// Email 範本
// ============================================================

/** N1: 匯款通知（老師收到） */
export function emailTemplate_N1_PaymentSubmitted(data: {
  studentName: string
  courseName: string
  totalAmount: number
  bankAccountLast5: string
  paidAmount?: number
  note?: string
}): { subject: string; html: string } {
  const subject = `🎵 新訂單待確認 - ${data.studentName}`
  const html = `
    <div style="font-family: 'Noto Sans TC', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #f59e0b;">🎵 SingBook 預約平台</h2>
      <p>老師您好，</p>
      <p>有學生已完成匯款，請確認收款：</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>學生姓名</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.studentName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>課程</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.courseName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>訂單金額</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">NT$ ${data.totalAmount.toLocaleString()}</td>
        </tr>
        ${data.paidAmount ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>實付金額</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">NT$ ${data.paidAmount.toLocaleString()}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>匯款帳號後五碼</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.bankAccountLast5}</td>
        </tr>
        ${data.note ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>學生備註</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.note}</td>
        </tr>
        ` : ''}
      </table>
      <p>請至 <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/orders">後台訂單管理</a> 確認收款。</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #888; font-size: 12px;">此為系統自動發送，請勿回覆。</p>
    </div>
  `
  return { subject, html }
}

/** N2: 付款確認（學生收到） */
export function emailTemplate_N2_PaymentConfirmed(data: {
  studentName: string
  courseName: string
  quantity: number
  locationName: string
  totalAmount: number
}): { subject: string; html: string } {
  const subject = `✅ 付款確認成功 - SingBook 預約平台`
  const html = `
    <div style="font-family: 'Noto Sans TC', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #f59e0b;">✅ SingBook 預約平台</h2>
      <p>親愛的 ${data.studentName}，</p>
      <p>您的付款已確認成功！以下是您的訂單詳情：</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>課程</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.courseName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>數量</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.quantity} 份</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>上課地點</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.locationName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>總金額</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">NT$ ${data.totalAmount.toLocaleString()}</td>
        </tr>
      </table>
      <p>您現在可以前往 <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/schedule">預約時段</a> 選擇您想上課的時間了！</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #888; font-size: 12px;">此為系統自動發送，請勿回覆。</p>
    </div>
  `
  return { subject, html }
}

/** N3: 預約成功（學生收到） */
export function emailTemplate_N3_BookingConfirmed(data: {
  studentName: string
  courseName: string
  date: string       // 月日（例：3月29日）
  time: string       // 時間（例：14:00-15:00）
  locationName: string
  locationAddress: string
  teacherName: string
}): { subject: string; html: string } {
  const subject = `📅 預約成功 - ${data.date} ${data.time}`
  const html = `
    <div style="font-family: 'Noto Sans TC', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #f59e0b;">📅 SingBook 預約平台</h2>
      <p>親愛的 ${data.studentName}，</p>
      <p>您的課程預約已確認！詳情如下：</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>日期</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.date}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>時間</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.time}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>地點</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.locationName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>地址</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.locationAddress}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>課程</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.courseName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>老師</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.teacherName}</td>
        </tr>
      </table>
      <p>請準時抵達上課。如有任何問題，請聯繫老師。</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #888; font-size: 12px;">此為系統自動發送，請勿回覆。</p>
    </div>
  `
  return { subject, html }
}

/** N4: 取消通知（學生收到） */
export function emailTemplate_N4_BookingCancelled(data: {
  studentName: string
  date: string
  time: string
  locationName: string
  teacherName: string
  reason?: string
}): { subject: string; html: string } {
  const subject = `❌ 預約已取消`
  const html = `
    <div style="font-family: 'Noto Sans TC', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #ef4444;">❌ SingBook 預約平台</h2>
      <p>親愛的 ${data.studentName}，</p>
      <p>您的預約已被老師取消：</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>原預約日期</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.date}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>原預約時間</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.time}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>地點</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.locationName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>老師</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.teacherName}</td>
        </tr>
        ${data.reason ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>取消原因</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.reason}</td>
        </tr>
        ` : ''}
      </table>
      <p>如有問題請聯繫老師，或重新前往 <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/schedule">預約時段</a> 預約其他時間。</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #888; font-size: 12px;">此為系統自動發送，請勿回覆。</p>
    </div>
  `
  return { subject, html }
}

/** N5: 明日提醒（學生 + 老師收到） */
export function emailTemplate_N5_TomorrowReminder(data: {
  studentName: string
  teacherName: string
  studentEmail: string
  teacherEmail: string
  date: string        // 明日日期
  time: string
  locationName: string
  locationAddress: string
  courseName: string
  role: 'student' | 'teacher'
}): { subject: string; html: string } {
  const subject = `⏰ 明日課程提醒 - ${data.date}`
  const html = `
    <div style="font-family: 'Noto Sans TC', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #f59e0b;">⏰ SingBook 預約平台 - 明日課程提醒</h2>
      <p>${data.role === 'student' ? `親愛的 ${data.studentName}，` : `老師您好，`}</p>
      <p>明日您有預約課程：</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        ${data.role === 'student' ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>學生</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.studentName}</td>
        </tr>
        ` : `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>學生</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.studentName}</td>
        </tr>
        `}
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>日期</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.date}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>時間</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.time}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>地點</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.locationName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>地址</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.locationAddress}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>課程</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.courseName}</td>
        </tr>
      </table>
      <p>請记得准时参加！</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #888; font-size: 12px;">此為系統自動發送，請勿回覆。</p>
    </div>
  `
  return { subject, html }
}

// ============================================================
// 工具函式
// ============================================================

/** 格式化日期為「3月29日」格式 */
export function formatDateMedium(date: Date): string {
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

/** 格式化時間為「14:00-15:00」格式 */
export function formatTimeRange(start: Date, end: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const sh = pad(start.getHours())
  const sm = pad(start.getMinutes())
  const eh = pad(end.getHours())
  const em = pad(end.getMinutes())
  if (sm === '00' && em === '00') {
    return `${sh}:00-${eh}:00`
  }
  return `${sh}:${sm}-${eh}:${em}`
}

/** 格式化完整日期時間為「2026年3月29日 14:00」格式 */
export function formatDateTimeFull(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${year}年${month}月${day}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
