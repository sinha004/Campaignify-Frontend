'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Sidebar from '../../components/Sidebar';
import { ArrowLeft } from 'lucide-react';

export default function CreateCampaignPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    segmentId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchSegments();
  }, [isAuthenticated, authLoading, router]);

  const fetchSegments = async () => {
    try {
      const response = await api.get('/segments');
      const data = response.data.data || response.data;
      setSegments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load segments');
      setSegments([]);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('End date must be after start date');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/campaigns', {
        name: formData.name,
        description: formData.description || undefined,
        segmentId: formData.segmentId,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      });
      router.push(`/dashboard/campaigns/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create campaign');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="px-6 h-14 flex items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/dashboard/campaigns')} className="text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-medium text-gray-900">Create Campaign</h2>
            </div>
          </div>
        </header>

        <main className="px-6 py-8 max-w-xl">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Campaign name</label>
                <input
                  type="text" id="name" name="name" value={formData.name} onChange={handleChange} required
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                  placeholder="e.g., Summer Sale 2025"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="description" name="description" value={formData.description} onChange={handleChange} rows={3}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors resize-none"
                  placeholder="Describe your campaign objectives..."
                />
              </div>

              <div>
                <label htmlFor="segmentId" className="block text-sm font-medium text-gray-700 mb-1.5">Target segment</label>
                <select
                  id="segmentId" name="segmentId" value={formData.segmentId} onChange={handleChange} required
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                >
                  <option value="">Select a segment</option>
                  {segments.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.totalRecords} contacts)</option>
                  ))}
                </select>
                {segments.length === 0 && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    No segments available.{' '}
                    <button type="button" onClick={() => router.push('/dashboard/segments/upload')} className="text-indigo-600 hover:text-indigo-700">
                      Upload one first
                    </button>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1.5">Start date</label>
                  <input
                    type="datetime-local" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} required
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1.5">End date</label>
                  <input
                    type="datetime-local" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} required
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/campaigns')}
                  className="flex-1 py-2 px-4 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || segments.length === 0}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    'Create campaign'
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
