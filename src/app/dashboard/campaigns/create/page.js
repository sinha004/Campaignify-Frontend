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
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#526bb0] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#86868b]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/campaigns')}
              className="text-[#526bb0] hover:text-[#01adbd] transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Campaigns
            </button>
          </div>
          <span className="text-[#1d1d1f] font-semibold">Campaignify</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeInUp">
          <h1 className="text-4xl font-semibold text-[#1d1d1f] tracking-tight mb-3">
            Create Campaign
          </h1>
          <p className="text-lg text-[#86868b]">
            Set up your marketing campaign in minutes
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-fadeInUp animation-delay-100">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Name */}
            <div>
              <label htmlFor="name" className="block text-[#1d1d1f] font-medium mb-2 text-sm">
                Campaign Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-[#f5f5f7] border-0 rounded-xl focus:ring-2 focus:ring-[#526bb0] outline-none transition text-[#1d1d1f] placeholder:text-[#86868b]"
                placeholder="e.g., Summer Sale 2025"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-[#1d1d1f] font-medium mb-2 text-sm">
                Description <span className="text-[#86868b] font-normal">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-[#f5f5f7] border-0 rounded-xl focus:ring-2 focus:ring-[#526bb0] outline-none transition text-[#1d1d1f] placeholder:text-[#86868b] resize-none"
                placeholder="Describe your campaign objectives..."
              />
            </div>

            {/* Segment Selection */}
            <div>
              <label htmlFor="segmentId" className="block text-[#1d1d1f] font-medium mb-2 text-sm">
                Target Segment
              </label>
              <select
                id="segmentId"
                name="segmentId"
                value={formData.segmentId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-[#f5f5f7] border-0 rounded-xl focus:ring-2 focus:ring-[#526bb0] outline-none transition text-[#1d1d1f] appearance-none cursor-pointer"
              >
                <option value="">Select a segment</option>
                {Array.isArray(segments) && segments.map((segment) => (
                  <option key={segment.id} value={segment.id}>
                    {segment.name} ({segment.totalRecords} contacts)
                  </option>
                ))}
              </select>
              {segments.length === 0 && (
                <p className="mt-2 text-sm text-[#86868b]">
                  No segments available.{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/segments/upload')}
                    className="text-[#526bb0] hover:text-[#01adbd]"
                  >
                    Upload a segment first →
                  </button>
                </p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-[#1d1d1f] font-medium mb-2 text-sm">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#f5f5f7] border-0 rounded-xl focus:ring-2 focus:ring-[#526bb0] outline-none transition text-[#1d1d1f]"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-[#1d1d1f] font-medium mb-2 text-sm">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#f5f5f7] border-0 rounded-xl focus:ring-2 focus:ring-[#526bb0] outline-none transition text-[#1d1d1f]"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-[#f5f5f7] rounded-xl p-5">
              <h4 className="font-medium text-[#1d1d1f] mb-3 text-sm">📋 What happens next?</h4>
              <ul className="text-sm text-[#86868b] space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#526bb0]">1.</span>
                  Campaign will be created in draft status
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#526bb0]">2.</span>
                  Configure your workflow in the Flow Builder
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#526bb0]">3.</span>
                  Deploy and schedule when ready
                </li>
              </ul>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard/campaigns')}
                className="flex-1 px-6 py-3 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || segments.length === 0}
                className="flex-1 bg-[#526bb0] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#4a5f9e] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  'Create Campaign'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-xs text-[#86868b]">© 2025 Campaignify. All rights reserved.</p>
      </footer>
    </div>
  );
}
