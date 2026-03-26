'use client'

import { Suspense } from 'react'
import BookContent from './BookContent'

export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">載入中...</div>}>
      <BookContent />
    </Suspense>
  )
}
