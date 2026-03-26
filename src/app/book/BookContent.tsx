'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Course {
  id: number
  name: string
  price: number
  sessions: number
  description: string | null
}

interface Location {
  id: number
  name: string
  price: number
  address: string
}

interface Student {
  id: number
  name: string
  email: string
  phone: string | null
}

function BookContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')

  const [step, setStep] = useState(1)
  const [courses, setCourses] = useState<Course[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<Student | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [selectedCourse, setSelectedCourse] = useState<number | null>(courseId ? parseInt(courseId) : null)
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userRole = localStorage.getItem('userRole')
    const userName = localStorage.getItem('userName')
    const userEmail = localStorage.getItem('userEmail')

    async function fetchData() {
      const [coursesRes, locationsRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/locations')
      ])
      const coursesData = await coursesRes.json()
      const locationsData = await locationsRes.json()

      setCourses(coursesData)
      setLocations(locationsData)
      setLoading(false)

      // 如果已登入，帶入學生資料
      if (userId && userRole === 'student') {
        setIsLoggedIn(true)
        if (userName) setName(userName)
        if (userEmail) setEmail(userEmail)
        
        // 從 API 取得完整學生資料
        const studentRes = await fetch(`/api/student/${userId}`)
        if (studentRes.ok) {
          const studentData = await studentRes.json()
          if (studentData.phone) setPhone(studentData.phone)
        }
      }
    }
    fetchData()
  }, [])

  // 尚未登入則跳轉到登入頁面
  useEffect(() => {
    if (!loading && !isLoggedIn && step > 1) {
      router.push('/login?redirect=/book' + (courseId ? `?courseId=${courseId}` : ''))
    }
  }, [loading, isLoggedIn, step, router, courseId])

  const selectedCourseData = courses.find(c => c.id === selectedCourse)
  const selectedLocationData = locations.find(l => l.id === selectedLocation)

  const totalAmount = selectedCourseData && selectedLocationData
    ? (selectedCourseData.price * quantity) + (selectedLocationData.price * quantity * selectedCourseData.sessions)
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !email) {
      setError('請填寫姓名和 Email')
      return
    }

    // 註冊學生並建立訂單
    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        phone,
        courseId: selectedCourse,
        locationId: selectedLocation,
        quantity
      })
    })

    const data = await res.json()

    if (data.success) {
      router.push(`/payment?orderId=${data.orderId}`)
    } else {
      setError(data.error || '發生錯誤，請稍後再試')
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">載入中...</div>
  }

  // 尚未登入顯示提示
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <header className="py-6 px-4 border-b border-amber-100">
          <div className="max-w-4xl mx-auto">
            <Link href="/" className="text-2xl font-bold text-amber-800">🎤 STAGELESS沐光</Link>
          </div>
        </header>
        <main className="max-w-2xl mx-auto p-8 text-center">
          <h1 className="text-3xl font-bold text-amber-900 mb-4">請先登入</h1>
          <p className="text-amber-600 mb-8">報名前需要先登入或註冊帳戶</p>
          <div className="flex justify-center gap-4">
            <Link href={`/login?redirect=/book${courseId ? `?courseId=${courseId}` : ''}`} className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700">
              登入
            </Link>
            <Link href="/register" className="border-2 border-amber-600 text-amber-600 px-6 py-3 rounded-lg hover:bg-amber-50">
              註冊
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <header className="py-6 px-4 border-b border-amber-100">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-2xl font-bold text-amber-800">🎤 STAGELESS沐光</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-8">報名流程</h1>

        {/* 步驟指示 */}
        <div className="flex justify-center gap-4 mb-8">
          {['選擇課程', '選擇地點', '填寫資料'].map((s, i) => (
            <div key={i} className={`px-4 py-2 rounded-full ${step > i ? 'bg-amber-600 text-white' : step === i + 1 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
              {i + 1}. {s}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: 選擇課程 + 數量 */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-amber-900">選擇課程</h2>
              <div className="grid gap-4">
                {courses.map(course => (
                  <label
                    key={course.id}
                    className={`block p-4 rounded-xl border-2 cursor-pointer transition-colors ${selectedCourse === course.id ? 'border-amber-500 bg-amber-50' : 'border-amber-100 bg-white hover:border-amber-200'}`}
                  >
                    <input
                      type="radio"
                      name="course"
                      value={course.id}
                      checked={selectedCourse === course.id}
                      onChange={(e) => setSelectedCourse(parseInt(e.target.value))}
                      className="sr-only"
                    />
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-amber-900">{course.name}</h3>
                        <p className="text-sm text-amber-600">{course.sessions} 堂</p>
                      </div>
                      <span className="text-lg font-bold text-amber-600">NT$ {course.price.toLocaleString()}起</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* 選擇數量 */}
              {selectedCourseData && (
                <div className="bg-white p-4 rounded-xl border border-amber-100">
                  <label className="block text-amber-700 font-semibold mb-2">購買數量</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-full border border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      -
                    </button>
                    <span className="text-xl font-bold text-amber-900 w-8 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-full border border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!isLoggedIn) {
                    router.push(`/login?redirect=/book${courseId ? `?courseId=${courseId}` : ''}`)
                  } else {
                    setStep(2)
                  }
                }}
                disabled={!selectedCourse}
                className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 disabled:bg-amber-300 disabled:cursor-not-allowed"
              >
                下一步
              </button>
            </div>
          )}

          {/* Step 2: 選擇地點 */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-amber-900">選擇地點</h2>
              <div className="grid gap-4">
                {locations.map(location => (
                  <label
                    key={location.id}
                    className={`block p-4 rounded-xl border-2 cursor-pointer transition-colors ${selectedLocation === location.id ? 'border-amber-500 bg-amber-50' : 'border-amber-100 bg-white hover:border-amber-200'}`}
                  >
                    <input
                      type="radio"
                      name="location"
                      value={location.id}
                      checked={selectedLocation === location.id}
                      onChange={(e) => setSelectedLocation(parseInt(e.target.value))}
                      className="sr-only"
                    />
                    <div>
                      <h3 className="font-semibold text-amber-900">{location.name}</h3>
                      <p className="text-sm text-amber-500">{location.address}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border-2 border-amber-600 text-amber-600 py-3 rounded-lg hover:bg-amber-50"
                >
                  上一步
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!selectedLocation}
                  className="flex-1 bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 disabled:bg-amber-300 disabled:cursor-not-allowed"
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {/* Step 3: 填寫資料 */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-amber-900">填寫個人資料</h2>
              
              {/* 訂單摘要 */}
              <div className="bg-amber-50 p-4 rounded-xl">
                <h3 className="font-semibold text-amber-900 mb-2">訂單摘要</h3>
                <div className="space-y-1 text-sm text-amber-700">
                  <p>課程：{selectedCourseData?.name} × {quantity}</p>
                  <p>地點：{selectedLocationData?.name}</p>
                  <p className="font-bold text-lg text-amber-900 mt-2">
                    總金額：NT$ {totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-amber-700 mb-1">姓名 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-amber-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-amber-700 mb-1">電話 *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 border-2 border-amber-600 text-amber-600 py-3 rounded-lg hover:bg-amber-50"
                >
                  上一步
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700"
                >
                  確認訂單
                </button>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}

export default BookContent
