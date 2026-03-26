'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone })
    })

    const data = await res.json()

    if (data.success) {
      alert('註冊成功！請登入')
      router.push('/login')
    } else {
      setError(data.error || '註冊失敗')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-amber-800">🎤 STAGELESS沐光</Link>
          <p className="text-amber-600 mt-2">建立帳戶</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-amber-100">
          <div className="space-y-4">
            <div>
              <label className="block text-amber-700 mb-1">姓名 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-amber-700 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-amber-700 mb-1">密碼 *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-amber-700 mb-1">電話 *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
            {loading ? '註冊中...' : '註冊'}
          </button>
        </form>

        <p className="text-center text-amber-600 mt-4">
          已經有帳戶？ <Link href="/login" className="text-amber-700 font-semibold hover:underline">立即登入</Link>
        </p>
      </div>
    </div>
  )
}