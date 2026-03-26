'use client'

import { Suspense } from 'react'
import PaymentContent from './PaymentContent'

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">載入中...</div>}>
      <PaymentContent />
    </Suspense>
  )
}
