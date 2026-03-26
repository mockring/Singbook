'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })

      const data = await res.json()

      if (res.ok) {
        setSent(true)
      } else {
        setError(data.error || '發生錯誤')
      }
    } catch {
      setError('發生錯誤，請稍後再試')
    }

    setLoading(false)
  }

  const theme = role === 'teacher'
    ? { bg: 'from-indigo-50 to-white', primary: 'indigo', btn: 'bg-indigo-600 hover:bg-indigo-700', card: 'border-indigo-100' }
    : { bg: 'from-amber-50 to-white', primary: 'amber', btn: 'bg-amber-600 hover:bg-amber-700', card: 'border-amber-100' }

  if (sent) {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${theme.bg} flex items-center justify-center p-4`}>
        <div className="bg-white p-8 rounded-2xl shadow-sm border ${theme.card} max-w-md w-full text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className={`text-xl font-bold text-${theme.primary}-900 mb-2`}>郵件已寄出！</h2>
          <p className={`text-${theme.primary}-600 mb-6`}>
            如果此 Email 存在於系統中，您會收到一封密碼重設郵件。<br />
            請在 1 小時內點擊連結設定新密碼。
          </p>
          <Link href={`/${role === 'teacher' ? 'admin/login' : 'login'}`}
            className={`inline-block ${theme.btn} text-white px-6 py-2.5 rounded-lg font-semibold transition-colors`}>
            返回登入
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${theme.bg} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className={`text-3xl font-bold text-${theme.primary}-800`}>🎤 STAGELESS沐光</Link>
          <p className={`text-${theme.primary}-600 mt-2`}>重設密碼</p>
        </div>

        <form onSubmit={handleSubmit} className={`bg-white p-8 rounded-2xl shadow-sm border ${theme.card}`}>
          {/* 身份切換 */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                role === 'student'
                  ? 'bg-amber-100 text-amber-800 border-2 border-amber-400'
                  : 'bg-gray-100 text-gray-500 border-2 border-transparent'
              }`}
            >
              我是學生
            </button>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                role === 'teacher'
                  ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-400'
                  : 'bg-gray-100 text-gray-500 border-2 border-transparent'
              }`}
            >
              我是老師
            </button>
          </div>

          <p className={`text-${theme.primary}-600 text-sm mb-4`}>
            請輸入您註冊時的 Email，我們會寄送密碼重設連結給您。
          </p>

          <div className="mb-4">
            <label className={`block text-${theme.primary}-700 mb-1 font-medium`}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={`w-full p-3 border border-${theme.primary}-200 rounded-lg focus:ring-2 focus:ring-${theme.primary}-500 outline-none`}
              placeholder="example@email.com"
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${theme.btn} text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors`}
          >
            {loading ? '發送中...' : '發送重設連結'}
          </button>
        </form>

        <p className={`text-center text-${theme.primary}-500 mt-4 text-sm`}>
          <Link href={role === 'teacher' ? '/admin/login' : '/login'} className="hover:underline">
            想起密碼了？返回登入
          </Link>
        </p>
      </div>
    </div>
  )
}
