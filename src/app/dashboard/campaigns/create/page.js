'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

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
    // Wait for auth to finish loading before checking
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchSegments();
  }, [isAuthenticated, authLoading, router]);

  const fetchSegments = async () => {
    try {
      const response = await api.get('/segments');
      const segmentsData = response.data.data || response.data;
      setSegments(Array.isArray(segmentsData) ? segmentsData : []);
    } catch (err) {
      setError('Failed to load segments');
      setSegments([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate <= startDate) {
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
      <div className="min-h-screen bg-gradient-to-br from-[#cad6ec] via-white to-[#5fcde0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#526bb0] mx-auto mb-4"></div>
          <p className="text-[#041d36] font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#cad6ec] via-white to-[#5fcde0] p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/campaigns')}
            className="text-[#526bb0] hover:text-[#041d36] mb-4 flex items-center gap-2"
          >
            ← Back to Campaigns
          </button>
          <h1 className="text-4xl font-bold text-[#041d36] mb-2">Create New Campaign</h1>
          <p className="text-gray-600">Set up your marketing campaign</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Name */}
            <div>
              <label htmlFor="name" className="block text-[#041d36] font-semibold mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#526bb0] focus:border-transparent outline-none transition text-[#041d36] placeholder:text-gray-400"
                placeholder="e.g., Summer Sale 2025"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-[#041d36] font-semibold mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#526bb0] focus:border-transparent outline-none transition text-[#041d36] placeholder:text-gray-400"
                placeholder="Describe your campaign objectives..."
              />
            </div>

            {/* Segment Selection */}
            <div>
              <label htmlFor="segmentId" className="block text-[#041d36] font-semibold mb-2">
                Target Segment *
              </label>
              <select
                id="segmentId"
                name="segmentId"
                value={formData.segmentId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#526bb0] focus:border-transparent outline-none transition text-[#041d36]"
              >
                <option value="">Select a segment</option>
                {Array.isArray(segments) && segments.map((segment) => (
                  <option key={segment.id} value={segment.id}>
                    {segment.name} ({segment.totalRecords} contacts)
                  </option>
                ))}
              </select>
              {segments.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  No segments available.{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/segments/upload')}
                    className="text-[#526bb0] hover:text-[#01adbd] underline"
                  >
                    Upload a segment first
                  </button>
                </p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-[#041d36] font-semibold mb-2">
                  Start Date *
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#526bb0] focus:border-transparent outline-none transition text-[#041d36]"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-[#041d36] font-semibold mb-2">
                  End Date *
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#526bb0] focus:border-transparent outline-none transition text-[#041d36]"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">📋 Campaign Workflow</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Campaign will be created in <strong>draft</strong> status</li>
                <li>Configure your workflow in the Flow Builder tab</li>
                <li>Change status to <strong>scheduled</strong> when ready</li>
                <li>Campaign will start automatically at the scheduled time</li>
              </ul>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard/campaigns')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || segments.length === 0}
                className="flex-1 bg-gradient-to-r from-[#526bb0] to-[#01adbd] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition-all disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
