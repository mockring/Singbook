'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (data.success) {
      // 儲存 session
      localStorage.setItem('userId', data.user.id.toString())
      localStorage.setItem('userRole', data.user.role)
      localStorage.setItem('userName', data.user.name)
      localStorage.setItem('userEmail', data.user.email)

    // 檢查是否有 redirect URL
    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get('redirect');
    
    if (data.user.role === 'teacher') {
      // 老師 redirect 到 /admin
      localStorage.setItem('userRole', 'teacher');
      router.push(redirectUrl === '/admin' || !redirectUrl ? '/admin' : redirectUrl);
    } else if (redirectUrl && redirectUrl !== '/admin') {
      router.push(redirectUrl);
    } else {
      router.push('/dashboard');
    }
    } else {
      setError(data.error || '登入失敗')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-amber-800">🎤 STAGELESS沐光</Link>
          <p className="text-amber-600 mt-2">登入您的帳戶</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-amber-100">
          <div className="space-y-4">
            <div>
              <label className="block text-amber-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-amber-700 mb-1">密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 mt-6 disabled:bg-amber-300"
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        <p className="text-center text-amber-600 mt-4">
          還沒有帳戶？ <Link href="/register" className="text-amber-700 font-semibold hover:underline">立即註冊</Link>
        </p>

        <p className="text-center text-amber-500 mt-2 text-sm">
          <Link href="/forgot-password?role=student" className="hover:underline">忘記密碼？</Link>
          <span className="mx-2">|</span>
          老師請至 <Link href="/admin/login" className="hover:underline">後台登入</Link>
        </p>
      </div>
    </div>
  )
}