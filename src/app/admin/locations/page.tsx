'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Location {
  id: number;
  name: string;
  address: string;
  price: number;
  description: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminLocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    price: '',
    description: '',
    image: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'teacher') {
      router.push('/admin/login');
      return;
    }

    fetch('/api/admin/locations')
      .then(res => res.json())
      .then(data => {
        setLocations(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const openModal = (location?: Location) => {
    if (location) {
      setEditLocation(location);
      setFormData({
        name: location.name,
        address: location.address,
        price: location.price.toString(),
        description: location.description || '',
        image: location.image || '',
        isActive: location.isActive,
      });
    } else {
      setEditLocation(null);
      setFormData({
        name: '',
        address: '',
        price: '',
        description: '',
        image: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.address) {
      alert('請填寫地點名稱與地址');
      return;
    }

    setSubmitting(true);
    try {
      const url = '/api/admin/locations';
      const method = editLocation ? 'PATCH' : 'POST';
      const body = editLocation
        ? { id: editLocation.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        if (editLocation) {
          setLocations(locations.map(l => l.id === editLocation.id ? { ...l, ...formData, price: parseInt(formData.price) || 0 } : l));
        } else {
          const newLocation = await res.json();
          setLocations([newLocation, ...locations]);
        }
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Submit failed:', error);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此地點嗎？')) return;

    try {
      const res = await fetch(`/api/admin/locations?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLocations(locations.filter(l => l.id !== id));
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleToggleActive = async (location: Location) => {
    try {
      const res = await fetch('/api/admin/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: location.id, isActive: !location.isActive }),
      });

      if (res.ok) {
        setLocations(locations.map(l => l.id === location.id ? { ...l, isActive: !location.isActive } : l));
      }
    } catch (error) {
      console.error('Toggle failed:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      price: '',
      description: '',
      image: '',
      isActive: true,
    });
    setEditLocation(null);
  };

  const formatPrice = (price: number) => price > 0 ? `NT$ ${price.toLocaleString()}/堂` : '免加價';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-white hover:text-indigo-200">← 返回</Link>
            <h1 className="text-2xl font-bold">📍 地點管理</h1>
          </div>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-white text-indigo-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            + 新增地點
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {locations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-500">尚無地點，請新增地點</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map(location => (
              <div key={location.id} className={`bg-white rounded-xl shadow-md overflow-hidden ${!location.isActive ? 'opacity-60' : ''}`}>
                {location.image && (
                  <div className="h-40 bg-gray-200 bg-cover bg-center" style={{ backgroundImage: `url(${location.image})` }} />
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{location.name}</h3>
                    <button
                      onClick={() => handleToggleActive(location)}
                      className={`px-2 py-1 rounded text-xs font-medium ${location.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {location.isActive ? '上架中' : '已下架'}
                    </button>
                  </div>
                  <div className="text-xl font-bold text-indigo-600 mb-2">{formatPrice(location.price)}</div>
                  <div className="text-gray-500 text-sm mb-2">📍 {location.address}</div>
                  {location.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{location.description}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(location)}
                      className="flex-1 px-3 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
                      className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-800 mb-4">{editLocation ? '編輯地點' : '新增地點'}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地點名稱 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：信義私人錄音室"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地址 *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="請輸入地址"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地點加價 (每堂)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地點說明</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="地點詳細說明..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地點圖片 URL</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">上架此地點</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  {submitting ? '儲存中...' : '確認儲存'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
