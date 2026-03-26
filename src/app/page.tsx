'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    setIsLoggedIn(!!userId)
  }, [])
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <header className="py-6 px-4 border-b border-amber-100">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-amber-800">🎤 STAGELESS沐光</h1>
          <nav className="flex gap-4">
            <Link href="/courses" className="text-amber-700 hover:text-amber-900">課程</Link>
            <Link href="/locations" className="text-amber-700 hover:text-amber-900">地點</Link>
            {isLoggedIn ? (
              <Link href="/dashboard" className="text-amber-700 hover:text-amber-900 font-semibold">會員專區</Link>
            ) : (
              <Link href="/login" className="text-amber-700 hover:text-amber-900">登入</Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto p-8 text-center">
        <h2 className="text-5xl font-bold text-amber-900 mb-4">用歌聲說故事</h2>
        <p className="text-xl text-amber-700 mb-8">專業歌唱教學，開啟你的音樂之旅</p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-100">
            <div className="text-4xl mb-3">🎵</div>
            <h3 className="font-semibold text-amber-900 mb-2">個人化教學</h3>
            <p className="text-amber-600 text-sm">根據你的聲線特點，量身打造學習方案</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-100">
            <div className="text-4xl mb-3">🏠</div>
            <h3 className="font-semibold text-amber-900 mb-2">多元地點</h3>
            <p className="text-amber-600 text-sm">台北市多處專業教室可選擇</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-100">
            <div className="text-4xl mb-3">📅</div>
            <h3 className="font-semibold text-amber-900 mb-2">彈性預約</h3>
            <p className="text-amber-600 text-sm">線上預約上課時間，輕鬆安排行程</p>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Link 
            href="/courses" 
            className="bg-amber-600 text-white px-8 py-3 rounded-lg hover:bg-amber-700 transition-colors"
          >
            查看課程
          </Link>
          <Link 
            href={isLoggedIn ? "/book" : "/login?redirect=/book"} 
            className="border-2 border-amber-600 text-amber-600 px-8 py-3 rounded-lg hover:bg-amber-50 transition-colors"
          >
            立即報名
          </Link>
        </div>

        {/* 課包說明 */}
        <div className="mt-16 text-left bg-amber-50 p-6 rounded-xl">
          <h3 className="font-semibold text-amber-900 mb-4">📦 課包說明</h3>
          <ul className="space-y-2 text-amber-700">
            <li>• 購買課包後，可預約上課時間</li>
            <li>• 每預約一次成功，扣除 1 堂</li>
            <li>• 支援 1 小時或 2 小時課程</li>
            <li>• 可選擇不同上課地點（地點加價有所不同）</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-amber-600 text-sm border-t border-amber-100">
        <p>© 2026 STAGELESS沐光 - SingBook 預約平台</p>
      </footer>
    </div>
  )
}