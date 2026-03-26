import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getLocations() {
  return await prisma.location.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  })
}

export default async function LocationsPage() {
  const locations = await getLocations()

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <header className="py-6 px-4 border-b border-amber-100">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-amber-800">🎤 STAGELESS沐光</Link>
          <nav className="flex gap-4">
            <Link href="/courses" className="text-amber-700 hover:text-amber-900">課程</Link>
            <Link href="/locations" className="text-amber-700 font-semibold">地點</Link>
            <Link href="/login" className="text-amber-700 hover:text-amber-900">登入</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-2">上課地點</h1>
        <p className="text-amber-600 mb-8">選擇便利的上課地點</p>

        <div className="grid md:grid-cols-2 gap-6">
          {locations.map((location) => (
            <div key={location.id} className="bg-white rounded-xl shadow-sm border border-amber-100 hover:shadow-md transition-shadow overflow-hidden">
              {location.image && (
                <div className="aspect-video bg-amber-100 overflow-hidden">
                  <img 
                    src={location.image} 
                    alt={location.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-amber-900">{location.name}</h2>
                <p className="text-amber-600 text-sm mt-2">{location.address}</p>
                {location.description && (
                  <p className="text-amber-500 text-sm mt-2">{location.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {locations.length === 0 && (
          <div className="text-center py-12 text-amber-600">
            <p>目前沒有開放的地點</p>
          </div>
        )}
      </main>
    </div>
  )
}