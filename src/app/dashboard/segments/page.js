'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Sidebar from '../components/Sidebar';

export default function SegmentsList() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchSegments();
  }, [isAuthenticated, authLoading, router]);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/segments');
      const segmentsData = response.data.data || response.data || [];
      setSegments(Array.isArray(segmentsData) ? segmentsData : []);
    } catch (err) {
      setError('Failed to load segments');
      console.error('Segments fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (segmentId, segmentName) => {
    if (!confirm(`Are you sure you want to delete "${segmentName}"?`)) {
      return;
    }

    try {
      setDeletingId(segmentId);
      await api.delete(`/segments/${segmentId}`);
      setSegments(segments.filter((s) => s.id !== segmentId));
    } catch (err) {
      alert('Failed to delete segment. Please try again.');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (segmentId, fileName) => {
    try {
      const response = await api.get(`/segments/${segmentId}/download`);
      const downloadUrl = response.data.data.downloadUrl;
      window.open(downloadUrl, '_blank');
    } catch (err) {
      alert('Failed to generate download link. Please try again.');
      console.error(err);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#526bb0]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#526bb0] animate-spin"></div>
          </div>
          <p className="text-[#86868b] text-lg font-medium">Loading segments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="ml-64">
        {/* Top Navigation Bar */}
        <nav className="glass sticky top-0 z-30 border-b border-gray-200/50">
          <div className="px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h2 className="text-lg font-medium text-[#1d1d1f]">Customer Segments</h2>
              <button
                onClick={() => router.push('/dashboard/segments/upload')}
                className="inline-flex items-center px-4 py-2 bg-[#1d1d1f] text-white text-sm font-medium rounded-full hover:bg-[#526bb0] transition-colors btn-shine"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Segment
              </button>
            </div>
          </div>
        </nav>

        <main className="px-6 lg:px-8 py-12">
        {/* Header */}
        <section className="mb-12 animate-fade-in-up">
          <h1 className="text-4xl lg:text-5xl font-bold text-[#1d1d1f] tracking-tight mb-4">
            Customer Segments
          </h1>
          <p className="text-xl text-[#86868b]">
            Manage and organize your audience lists for targeted campaigns.
          </p>
        </section>

        {/* Stats Row */}
        {segments.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover animate-fade-in-up animate-delay-100" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#526bb0] to-[#6b7fd6] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#86868b] text-sm">Total Segments</p>
                  <p className="text-2xl font-bold text-[#1d1d1f]">{segments.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover animate-fade-in-up animate-delay-200" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#01adbd] to-[#5fcde0] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#86868b] text-sm">Total Contacts</p>
                  <p className="text-2xl font-bold text-[#1d1d1f]">
                    {segments.reduce((sum, s) => sum + s.totalRecords, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover animate-fade-in-up animate-delay-300" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#86868b] to-[#aeaeb2] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h8M12 8v8" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#86868b] text-sm">Storage Used</p>
                  <p className="text-2xl font-bold text-[#1d1d1f]">
                    {formatFileSize(segments.reduce((sum, s) => sum + s.fileSize, 0))}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8">
            {error}
          </div>
        )}

        {/* Empty State */}
        {segments.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#526bb0]/10 to-[#01adbd]/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-[#526bb0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-[#1d1d1f] mb-2">No segments yet</h3>
            <p className="text-[#86868b] mb-8 max-w-md mx-auto">
              Upload your first customer segment to start creating targeted marketing campaigns.
            </p>
            <button
              onClick={() => router.push('/dashboard/segments/upload')}
              className="inline-flex items-center px-6 py-3 bg-[#1d1d1f] text-white font-medium rounded-full hover:bg-[#526bb0] transition-colors btn-shine"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Your First Segment
            </button>
          </div>
        ) : (
          /* Segments Grid - Card Layout */
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {segments.map((segment, index) => (
              <div
                key={segment.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden card-hover animate-fade-in-up"
                style={{ opacity: 0, animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
              >
                {/* Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#526bb0] to-[#01adbd] flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="px-3 py-1 bg-[#526bb0]/10 text-[#526bb0] text-xs font-semibold rounded-full">
                      {segment.totalRecords.toLocaleString()} contacts
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#1d1d1f] mb-1 truncate">{segment.name}</h3>
                  <p className="text-sm text-[#86868b] truncate">{segment.fileName}</p>
                </div>

                {/* Card Meta */}
                <div className="px-6 py-3 bg-[#fafafa] border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#86868b]">{formatFileSize(segment.fileSize)}</span>
                    <span className="text-[#86868b]">{formatDate(segment.uploadedAt)}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => router.push(`/dashboard/segments/${segment.id}`)}
                    className="text-[#526bb0] hover:text-[#1d1d1f] text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(segment.id, segment.fileName)}
                      className="p-2 text-[#86868b] hover:text-[#01adbd] hover:bg-[#01adbd]/10 rounded-lg transition-all"
                      title="Download"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(segment.id, segment.name)}
                      disabled={deletingId === segment.id}
                      className="p-2 text-[#86868b] hover:text-[#e51a3a] hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === segment.id ? (
                        <div className="w-5 h-5 border-2 border-[#e51a3a] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-16">
        <div className="py-8">
          <p className="text-center text-[#86868b] text-sm">
            © 2025 Campaignify. Built with precision for modern marketers.
          </p>
        </div>
      </footer>
      </div>
    </div>
  );
}
