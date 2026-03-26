'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface StudentInfo {
  id: number
  name: string
  email: string
  phone?: string
}

export default function StudentProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userRole = localStorage.getItem('userRole')

    if (!userId || userRole !== 'student') {
      router.push('/login')
      return
    }

    // 從 localStorage 取得學生基本資料
    setName(localStorage.getItem('userName') || '')
    setEmail(localStorage.getItem('userEmail') || '')

    // 再從 API 取得完整資料（包含 phone）
    fetch(`/api/student/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setName(data.name || '')
          setEmail(data.email || '')
          setPhone(data.phone || '')
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        setMessage({ type: 'error', text: '請輸入舊密碼以確認修改' })
        return
      }
      if (newPassword.length < 4) {
        setMessage({ type: 'error', text: '新密碼至少要 4 個字元' })
        return
      }
      if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: '新密碼與確認密碼不一致' })
        return
      }
    }

    if (!name.trim()) {
      setMessage({ type: 'error', text: '姓名不可為空' })
      return
    }

    setSaving(true)

    try {
      const userId = localStorage.getItem('userId')
      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: userId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || '更新失敗' })
        setSaving(false)
        return
      }

      // 更新 localStorage
      localStorage.setItem('userName', data.student.name)
      localStorage.setItem('userEmail', data.student.email)

      setMessage({ type: 'success', text: '個人資料已更新！' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setMessage({ type: 'error', text: '更新時發生錯誤，請稍後再試' })
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-amber-700 text-lg">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <header className="py-6 px-4 border-b border-amber-100">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="text-amber-700 hover:text-amber-900 transition-colors">← 返回</Link>
          <h1 className="text-xl font-bold text-amber-900">修改個人資料</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-8">
        <div className="flex gap-8">
          {/* 左側連結 */}
          <div className="w-48 shrink-0">
            <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-wide mb-3">快速連結</h3>
            <div className="space-y-2">
              <Link href="/courses" className="flex items-center gap-2 text-amber-700 hover:text-amber-900 text-sm">
                <span>🎵</span> 課程總覽
              </Link>
              <Link href="/locations" className="flex items-center gap-2 text-amber-700 hover:text-amber-900 text-sm">
                <span>📍</span> 地點總覽
              </Link>
              <Link href="/dashboard" className="flex items-center gap-2 text-amber-700 hover:text-amber-900 text-sm">
                <span>📋</span> 會員專區
              </Link>
              <Link href="/book" className="flex items-center gap-2 text-amber-700 hover:text-amber-900 text-sm">
                <span>🎤</span> 購買課程
              </Link>
              <Link href="/schedule" className="flex items-center gap-2 text-amber-700 hover:text-amber-900 text-sm">
                <span>📅</span> 預約時段
              </Link>
            </div>
          </div>

          {/* 右側表單 */}
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-5">
          {/* 基本資料 */}
          <div>
            <h2 className="text-lg font-semibold text-amber-900 mb-4">基本資料</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="請輸入姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="請輸入Email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">電話（選填）</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="請輸入電話"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* 修改密碼 */}
          <div>
            <h2 className="text-lg font-semibold text-amber-900 mb-1">修改密碼</h2>
            <p className="text-sm text-gray-500 mb-4">如不修改密碼，以下欄位留空即可</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">舊密碼</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="請輸入舊密碼"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">新密碼</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="請輸入新密碼（至少4字）"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">確認新密碼</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="請再次輸入新密碼"
                />
              </div>
            </div>
          </div>

          {/* 訊息提示 */}
          {message && (
            <div className={`px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          {/* 按鈕 */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-amber-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? '儲存中...' : '儲存修改'}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              取消
            </Link>
          </div>
        </form>
        </div>
      </div>
      </main>
    </div>
  )
}
