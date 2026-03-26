'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface BankAccount {
  id?: number
  bankName: string
  bankCode: string
  bankAccount: string
  accountName: string
  displayOrder?: number
}

export default function AdminPaymentSettingsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // 新增/編輯表單
  const [form, setForm] = useState<BankAccount>({
    bankName: '',
    bankCode: '',
    bankAccount: '',
    accountName: '',
  })
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('userId')
    const role = localStorage.getItem('userRole')
    if (!token || role !== 'teacher') {
      router.push('/admin/login')
      return
    }
    fetchAccounts()
  }, [router])

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/admin/payment-settings')
      const data = await res.json()
      setAccounts(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!form.bankName || !form.bankCode || !form.bankAccount || !form.accountName) {
      setFormError('請填寫所有欄位')
      return
    }
    setFormError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setForm({ bankName: '', bankCode: '', bankAccount: '', accountName: '' })
        fetchAccounts()
      } else {
        const data = await res.json()
        setFormError(data.error || '新增失敗')
      }
    } catch (e) {
      setFormError('發生錯誤')
    }
    setSubmitting(false)
  }

  const handleEdit = (account: BankAccount) => {
    setEditingId(account.id!)
    setForm({
      bankName: account.bankName,
      bankCode: account.bankCode,
      bankAccount: account.bankAccount,
      accountName: account.accountName,
    })
    setFormError('')
  }

  const handleUpdate = async () => {
    if (!form.bankName || !form.bankCode || !form.bankAccount || !form.accountName) {
      setFormError('請填寫所有欄位')
      return
    }
    setFormError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/payment-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...form }),
      })
      if (res.ok) {
        setEditingId(null)
        setForm({ bankName: '', bankCode: '', bankAccount: '', accountName: '' })
        fetchAccounts()
      } else {
        const data = await res.json()
        setFormError(data.error || '更新失敗')
      }
    } catch (e) {
      setFormError('發生錯誤')
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('確定要刪除這個帳戶嗎？')) return
    try {
      await fetch(`/api/admin/payment-settings?id=${id}`, { method: 'DELETE' })
      fetchAccounts()
    } catch (e) {
      alert('刪除失敗')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm({ bankName: '', bankCode: '', bankAccount: '', accountName: '' })
    setFormError('')
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-white hover:text-indigo-200">← 返回</Link>
            <h1 className="text-2xl font-bold">💳 匯款帳號設定</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 說明 */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-gray-500 text-sm">
            設定學生匯款用的銀行帳戶。可新增多個帳戶，學生報名後可查看所有帳戶進行匯款。
          </p>
        </div>

        {/* 新增 / 編輯 表單 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? '✏️ 編輯帳戶' : '➕ 新增帳戶'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">銀行名稱</label>
              <input
                type="text"
                value={form.bankName}
                onChange={e => setForm({ ...form, bankName: e.target.value })}
                placeholder="例如：玉山銀行"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">銀行代碼</label>
              <input
                type="text"
                value={form.bankCode}
                onChange={e => setForm({ ...form, bankCode: e.target.value })}
                placeholder="例如：012"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">帳號</label>
              <input
                type="text"
                value={form.bankAccount}
                onChange={e => setForm({ ...form, bankAccount: e.target.value })}
                placeholder="例如：3456789012"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">戶名</label>
              <input
                type="text"
                value={form.accountName}
                onChange={e => setForm({ ...form, accountName: e.target.value })}
                placeholder="例如：STAGELESS沐光"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {formError && (
            <p className="text-red-600 text-sm mt-3">{formError}</p>
          )}

          <div className="flex gap-3 mt-4">
            {editingId ? (
              <>
                <button
                  onClick={handleUpdate}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  {submitting ? '儲存中...' : '儲存修改'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
              </>
            ) : (
              <button
                onClick={handleAdd}
                disabled={submitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                {submitting ? '新增中...' : '新增帳戶'}
              </button>
            )}
          </div>
        </div>

        {/* 帳戶列表 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            已設定的帳戶（共 {accounts.length} 個）
          </h2>

          {accounts.length === 0 ? (
            <p className="text-gray-400 text-center py-8">尚無設定任何帳戶</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((account, index) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-indigo-500 font-bold text-sm mt-0.5">{index + 1}</span>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {account.bankName}（{account.bankCode}）
                      </p>
                      <p className="text-gray-600 text-sm">
                        帳號：{account.bankAccount} ｜ 戶名：{account.accountName}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(account)}
                      className="px-3 py-1.5 text-sm text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDelete(account.id!)}
                      className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
