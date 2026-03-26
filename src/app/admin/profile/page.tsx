'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TeacherInfo {
  id: number
  name: string
  email: string
  bio?: string
}

export default function AdminProfilePage() {
  const router = useRouter()
  const [teacher, setTeacher] = useState<TeacherInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 修改表單
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('userId')
    const role = localStorage.getItem('userRole')
    if (!token || role !== 'teacher') {
      router.push('/login')
      return
    }

    // 從 localStorage 取得老師基本資料
    const storedName = localStorage.getItem('userName') || ''
    const storedEmail = localStorage.getItem('userEmail') || ''
    const storedId = localStorage.getItem('userId') || ''

    setTeacher({ id: parseInt(storedId), name: storedName, email: storedEmail })
    setName(storedName)
    setEmail(storedEmail)
    setLoading(false)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // 驗證新密碼
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
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher?.id,
          name: name.trim(),
          email: email.trim(),
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

      // 更新成功，更新 localStorage
      localStorage.setItem('userName', data.teacher.name)
      localStorage.setItem('userEmail', data.teacher.email)
      if (newPassword) {
        // 密碼已改，無需處理 session（老師需重新登入）
      }

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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-white hover:text-indigo-200 transition-colors">← 返回</Link>
          <h1 className="text-xl font-bold">修改個人資料</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-5">
          {/* 基本資料 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">基本資料</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="請輸入姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="請輸入Email"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* 修改密碼 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">修改密碼</h2>
            <p className="text-sm text-gray-500 mb-4">如不修改密碼，以下欄位留空即可</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">舊密碼</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="請輸入舊密碼"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">新密碼</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="請輸入新密碼（至少4字）"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">確認新密碼</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
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

          {/* 儲存按鈕 */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? '儲存中...' : '儲存修改'}
            </button>
            <Link
              href="/admin"
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              取消
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
