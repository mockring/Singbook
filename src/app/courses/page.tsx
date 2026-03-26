'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Course {
  id: number
  name: string
  price: number
  sessions: number
  description: string | null
  image: string | null
}

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCourses() {
      const res = await fetch('/api/courses')
      const data = await res.json()
      setCourses(data)
      setLoading(false)
    }
    fetchCourses()
  }, [])

  const handleBookClick = (courseId: number) => {
    const userId = localStorage.getItem('userId')
    if (userId) {
      router.push(`/book?courseId=${courseId}`)
    } else {
      router.push(`/login?redirect=/book?courseId=${courseId}`)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">載入中...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <header className="py-6 px-4 border-b border-amber-100">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-amber-800">🎤 STAGELESS沐光</Link>
          <nav className="flex gap-4">
            <Link href="/courses" className="text-amber-700 font-semibold">課程</Link>
            <Link href="/locations" className="text-amber-700 hover:text-amber-900">地點</Link>
            <Link href="/login" className="text-amber-700 hover:text-amber-900">登入</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-2">課程總覽</h1>
        <p className="text-amber-600 mb-8">選擇適合您的課程方案</p>

        <div className="grid md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-amber-100 hover:shadow-md transition-shadow overflow-hidden">
              {course.image && (
                <div className="aspect-video bg-amber-100 overflow-hidden">
                  <img 
                    src={course.image} 
                    alt={course.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-amber-900">{course.name}</h2>
                    <p className="text-2xl font-bold text-amber-600 mt-1">NT$ {course.price.toLocaleString()}起</p>
                  </div>
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">
                    {course.sessions} 堂
                  </span>
                </div>
                
                {course.description && (
                  <p className="text-amber-600 text-sm mb-4">{course.description}</p>
                )}
                
                <button 
                  onClick={() => handleBookClick(course.id)}
                  className="w-full block text-center bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  立即報名
                </button>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12 text-amber-600">
            <p>目前沒有開放的課程</p>
          </div>
        )}
      </main>
    </div>
  )
}