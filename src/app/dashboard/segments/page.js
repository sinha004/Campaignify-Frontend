'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Sidebar from '../components/Sidebar';
import { Plus, Download, Trash2, FileText, Users, HardDrive } from 'lucide-react';

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
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (segmentId, segmentName) => {
    if (!confirm(`Are you sure you want to delete "${segmentName}"?`)) return;
    try {
      setDeletingId(segmentId);
      await api.delete(`/segments/${segmentId}`);
      setSegments(segments.filter((s) => s.id !== segmentId));
    } catch (err) {
      alert('Failed to delete segment.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (segmentId) => {
    try {
      const response = await api.get(`/segments/${segmentId}/download`);
      window.open(response.data.data.downloadUrl, '_blank');
    } catch (err) {
      alert('Failed to generate download link.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading segments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="px-6 h-14 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">Segments</h2>
            <button
              onClick={() => router.push('/dashboard/segments/upload')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Upload
            </button>
          </div>
        </header>

        <main className="px-6 py-8 max-w-5xl">
          {/* Page header */}
          <section className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Customer Segments</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your audience lists for targeted campaigns.</p>
          </section>

          {/* Stats */}
          {segments.length > 0 && (
            <section className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{segments.length}</p>
                  <p className="text-xs text-gray-500">Segments</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {segments.reduce((sum, s) => sum + s.totalRecords, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Total contacts</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <HardDrive className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatFileSize(segments.reduce((sum, s) => sum + s.fileSize, 0))}
                  </p>
                  <p className="text-xs text-gray-500">Storage used</p>
                </div>
              </div>
            </section>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {/* Empty state */}
          {segments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">No segments yet</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Upload your first customer segment to start creating targeted campaigns.
              </p>
              <button
                onClick={() => router.push('/dashboard/segments/upload')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Upload segment
              </button>
            </div>
          ) : (
            /* Segments list */
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacts</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {segments.map((segment) => (
                    <tr key={segment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => router.push(`/dashboard/segments/${segment.id}`)}
                          className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                        >
                          {segment.name}
                        </button>
                        <p className="text-xs text-gray-400 mt-0.5">{segment.fileName}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{segment.totalRecords.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatFileSize(segment.fileSize)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(segment.uploadedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDownload(segment.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(segment.id, segment.name)}
                            disabled={deletingId === segment.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === segment.id ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
