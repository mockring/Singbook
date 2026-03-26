'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Course {
  id: number;
  name: string;
  price: number;
  sessions: number;
  description: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    sessions: '',
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

    fetch('/api/admin/courses')
      .then(res => res.json())
      .then(data => {
        setCourses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const openModal = (course?: Course) => {
    if (course) {
      setEditCourse(course);
      setFormData({
        name: course.name,
        price: course.price.toString(),
        sessions: course.sessions.toString(),
        description: course.description || '',
        image: course.image || '',
        isActive: course.isActive,
      });
    } else {
      setEditCourse(null);
      setFormData({
        name: '',
        price: '',
        sessions: '',
        description: '',
        image: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.sessions) {
      alert('請填寫課程名稱、價格與堂數');
      return;
    }

    setSubmitting(true);
    try {
      const url = '/api/admin/courses';
      const method = editCourse ? 'PATCH' : 'POST';
      const body = editCourse 
        ? { id: editCourse.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        if (editCourse) {
          setCourses(courses.map(c => c.id === editCourse.id ? { ...c, ...formData, price: parseInt(formData.price), sessions: parseInt(formData.sessions) } : c));
        } else {
          const newCourse = await res.json();
          setCourses([newCourse, ...courses]);
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
    if (!confirm('確定要刪除此課程嗎？')) return;

    try {
      const res = await fetch(`/api/admin/courses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCourses(courses.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleToggleActive = async (course: Course) => {
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: course.id, isActive: !course.isActive }),
      });

      if (res.ok) {
        setCourses(courses.map(c => c.id === course.id ? { ...c, isActive: !course.isActive } : c));
      }
    } catch (error) {
      console.error('Toggle failed:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      sessions: '',
      description: '',
      image: '',
      isActive: true,
    });
    setEditCourse(null);
  };

  const formatPrice = (price: number) => `NT$ ${price.toLocaleString()}`;

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
            <h1 className="text-2xl font-bold">🎵 課程管理</h1>
          </div>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-white text-indigo-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            + 新增課程
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {courses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-500">尚無課程，請新增課程</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <div key={course.id} className={`bg-white rounded-xl shadow-md overflow-hidden ${!course.isActive ? 'opacity-60' : ''}`}>
                {course.image && (
                  <div className="h-40 bg-gray-200 bg-cover bg-center" style={{ backgroundImage: `url(${course.image})` }} />
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{course.name}</h3>
                    <button
                      onClick={() => handleToggleActive(course)}
                      className={`px-2 py-1 rounded text-xs font-medium ${course.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {course.isActive ? '上架中' : '已下架'}
                    </button>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600 mb-2">{formatPrice(course.price)}</div>
                  <div className="text-gray-500 text-sm mb-2">{course.sessions} 堂</div>
                  {course.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(course)}
                      className="flex-1 px-3 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
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
              <h2 className="text-xl font-bold text-gray-800 mb-4">{editCourse ? '編輯課程' : '新增課程'}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">課程名稱 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：聲音開發"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">價格 (NT$) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      placeholder="900"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">堂數 *</label>
                    <input
                      type="number"
                      value={formData.sessions}
                      onChange={e => setFormData({ ...formData, sessions: e.target.value })}
                      placeholder="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">課程說明</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="課程詳細說明..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">課程圖片 URL</label>
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
                  <label htmlFor="isActive" className="text-sm text-gray-700">上架此課程</label>
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
