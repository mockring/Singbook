'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface BankAccount {
  id: number
  bankName: string
  bankCode: string
  bankAccount: string
  accountName: string
}

interface Order {
  id: number
  course: { name: string; price: number; sessions: number }
  location: { name: string }
  quantity: number
  totalAmount: number
  status: string
}

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  const [bankAccountLast5, setBankAccountLast5] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (!orderId) {
        setLoading(false)
        return
      }

      try {
        const [paymentRes, orderRes] = await Promise.all([
          fetch('/api/payment-settings'),
          fetch(`/api/orders/${orderId}`)
        ])

        const paymentData = paymentRes.ok ? await paymentRes.json() : []
        const orderData = orderRes.ok ? await orderRes.json() : null

        setAccounts(Array.isArray(paymentData) ? paymentData : [])
        setOrder(orderData)
      } catch (error) {
        console.error('Fetch error:', error)
      }
      setLoading(false)
    }
    fetchData()
  }, [orderId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const res = await fetch('/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, bankAccountLast5, amount, note })
    })

    const data = await res.json()

    if (data.success) {
      alert('匯款資料已送出，等待老師確認收款')
      router.push('/dashboard')
    } else {
      setError(data.error || '發生錯誤')
      setSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">載入中...</div>
  if (!orderId || !order) return <div className="min-h-screen flex items-center justify-center">找不到訂單</div>

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <header className="py-6 px-4 border-b border-amber-100">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-2xl font-bold text-amber-800">🎤 STAGELESS沐光</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-8">匯款回覆</h1>

        {/* 匯款資訊（多帳戶） */}
        <div className="bg-amber-50 p-6 rounded-xl mb-8">
          <h2 className="font-semibold text-amber-900 mb-4">請匯款至以下任一帳戶</h2>
          {accounts.length === 0 ? (
            <p className="text-amber-600">（老師尚未設定匯款帳戶，請聯繫老師）</p>
          ) : (
            <div className="space-y-4">
              {accounts.map((acc, index) => (
                <div key={acc.id} className="p-4 bg-white rounded-lg border border-amber-200">
                  <p className="font-semibold text-amber-900 mb-1">
                    {index + 1}. {acc.bankName}（{acc.bankCode}）
                  </p>
                  <p className="text-amber-700 text-sm">
                    帳號：{acc.bankAccount} ｜ 戶名：{acc.accountName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 訂單摘要 */}
        <div className="bg-white p-4 rounded-xl border border-amber-100 mb-8">
          <h2 className="font-semibold text-amber-900 mb-2">訂單資訊</h2>
          <div className="space-y-1 text-amber-700">
            <p>課程：{order.course?.name} × {order.quantity}</p>
            <p>地點：{order.location?.name}</p>
            <p className="font-bold text-xl text-amber-900 mt-2">應付金額：NT$ {order.totalAmount?.toLocaleString()}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-amber-700 mb-1">您的匯款帳號後五碼 *</label>
            <input
              type="text"
              value={bankAccountLast5}
              onChange={e => setBankAccountLast5(e.target.value)}
              maxLength={5}
              placeholder="例如：12345"
              className="w-full p-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          <div>
            <label className="block text-amber-700 mb-1">匯款金額 *</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="例如：900"
              className="w-full p-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          <div>
            <label className="block text-amber-700 mb-1">備註（選填）</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="有什麼想告訴老師的嗎？"
              rows={3}
              className="w-full p-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 disabled:bg-amber-300"
          >
            {submitting ? '送出中...' : '確認匯款'}
          </button>
        </form>
      </main>
    </div>
  )
}

export default PaymentContent
