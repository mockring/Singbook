'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const role = searchParams.get('role') || 'student'

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenInvalid, setTokenInvalid] = useState(false)

  const theme = role === 'teacher'
    ? { bg: 'from-indigo-50 to-white', primary: 'indigo', btn: 'bg-indigo-600 hover:bg-indigo-700', card: 'border-indigo-100', link: '/admin/login' }
    : { bg: 'from-amber-50 to-white', primary: 'amber', btn: 'bg-amber-600 hover:bg-amber-700', card: 'border-amber-100', link: '/login' }

  useEffect(() => {
    if (!token) {
      setTokenInvalid(true)
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password || !confirmPassword) {
      setError('請填寫所有欄位')
      return
    }
    if (password.length < 4) {
      setError('密碼至少需要 4 個字元')
      return
    }
    if (password !== confirmPassword) {
      setError('兩次輸入的密碼不一致')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.error || '重設失敗')
      }
    } catch {
      setError('發生錯誤，請稍後再試')
    }

    setLoading(false)
  }

  if (tokenInvalid) {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${theme.bg} flex items-center justify-center p-4`}>
        <div className={`bg-white p-8 rounded-2xl shadow-sm border ${theme.card} max-w-md w-full text-center`}>
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className={`text-xl font-bold text-${theme.primary}-900 mb-2`}>連結無效</h2>
          <p className={`text-${theme.primary}-600 mb-6`}>
            此密碼重設連結無效或已過期，請重新申請。
          </p>
          <Link href="/forgot-password"
            className={`inline-block ${theme.btn} text-white px-6 py-2.5 rounded-lg font-semibold transition-colors`}>
            重新申請
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${theme.bg} flex items-center justify-center p-4`}>
        <div className={`bg-white p-8 rounded-2xl shadow-sm border ${theme.card} max-w-md w-full text-center`}>
          <div className="text-5xl mb-4">✅</div>
          <h2 className={`text-xl font-bold text-${theme.primary}-900 mb-2`}>密碼已重設！</h2>
          <p className={`text-${theme.primary}-600 mb-6`}>請使用新密碼登入。</p>
          <Link href={theme.link}
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
          <p className={`text-${theme.primary}-600 mt-2`}>設定新密碼</p>
        </div>

        <form onSubmit={handleSubmit} className={`bg-white p-8 rounded-2xl shadow-sm border ${theme.card}`}>
          <p className={`text-${theme.primary}-600 text-sm mb-4`}>
            請輸入您的新密碼。
          </p>

          <div className="space-y-4">
            <div>
              <label className={`block text-${theme.primary}-700 mb-1 font-medium`}>新密碼</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`w-full p-3 border border-${theme.primary}-200 rounded-lg focus:ring-2 focus:ring-${theme.primary}-500 outline-none`}
                placeholder="至少 4 個字元"
                required
              />
            </div>
            <div>
              <label className={`block text-${theme.primary}-700 mb-1 font-medium`}>確認新密碼</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={`w-full p-3 border border-${theme.primary}-200 rounded-lg focus:ring-2 focus:ring-${theme.primary}-500 outline-none`}
                placeholder="再次輸入新密碼"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${theme.btn} text-white py-3 rounded-lg font-semibold mt-6 disabled:opacity-50 transition-colors`}
          >
            {loading ? '儲存中...' : '儲存新密碼'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">載入中...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
