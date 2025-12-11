'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export default function SegmentDetails() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [segment, setSegment] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchSegmentDetails();
  }, [isAuthenticated, authLoading, router, params.id]);

  const fetchSegmentDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/segments/${params.id}`);
      setSegment(response.data.data);
      
      // Automatically load CSV data when segment is fetched
      await loadCsvData();
    } catch (err) {
      setError('Failed to load segment details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCsvData = async () => {
    try {
      setLoadingCsv(true);
      const response = await api.get(`/segments/${params.id}/download`);
      const downloadUrl = response.data.data.downloadUrl;
      
      // Fetch CSV content
      const csvResponse = await fetch(downloadUrl);
      const csvText = await csvResponse.text();
      
      // Parse CSV
      const lines = csvText.trim().split('\n');
      if (lines.length > 0) {
        // Extract headers
        const headers = lines[0].split(',').map(h => h.trim());
        setCsvHeaders(headers);
        
        // Extract data rows
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index] || '';
            return obj;
          }, {});
        });
        setCsvData(data);
      }
    } catch (err) {
      console.error('Failed to load CSV data:', err);
    } finally {
      setLoadingCsv(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await api.get(`/segments/${params.id}/download`);
      const downloadUrl = response.data.data.downloadUrl;
      window.open(downloadUrl, '_blank');
    } catch (err) {
      alert('Failed to generate download link. Please try again.');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${segment.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/segments/${params.id}`);
      alert('Segment deleted successfully');
      router.push('/dashboard/segments');
    } catch (err) {
      alert('Failed to delete segment. Please try again.');
      console.error(err);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#526bb0] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#86868b]">Loading segment details...</p>
        </div>
      </div>
    );
  }

  if (error || !segment) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#1d1d1f] mb-2">Error</h2>
          <p className="text-[#86868b] mb-6">{error || 'Segment not found'}</p>
          <button
            onClick={() => router.push('/dashboard/segments')}
            className="bg-[#526bb0] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#4a5f9e] transition-colors"
          >
            Back to Segments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/segments')}
              className="text-[#526bb0] hover:text-[#01adbd] transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Segments
            </button>
          </div>
          <span className="text-[#1d1d1f] font-semibold">Campaignify</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10 animate-fadeInUp">
          <h1 className="text-3xl font-semibold text-[#1d1d1f] tracking-tight mb-2">
            {segment.name}
          </h1>
          <p className="text-[#86868b]">
            ID: {segment.id}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fadeInUp animation-delay-100">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#526bb0]/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-[#526bb0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#1d1d1f]">{segment.totalRecords.toLocaleString()}</p>
                <p className="text-xs text-[#86868b]">Total Contacts</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#01adbd]/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-[#01adbd]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1d1d1f] truncate max-w-[120px]">{segment.fileName}</p>
                <p className="text-xs text-[#86868b]">File Name</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1d1d1f]">{formatFileSize(segment.fileSize)}</p>
                <p className="text-xs text-[#86868b]">File Size</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1d1d1f] capitalize">{segment.status}</p>
                <p className="text-xs text-[#86868b]">Status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions & Info */}
        <div className="flex flex-wrap gap-3 mb-8 animate-fadeInUp animation-delay-200">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-[#526bb0] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#4a5f9e] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download CSV
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-50 text-red-600 px-5 py-2.5 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
          <div className="flex-1"></div>
          <p className="text-sm text-[#86868b] self-center">
            Uploaded {formatDate(segment.uploadedAt)}
          </p>
        </div>

        {/* CSV Data Table */}
        {loadingCsv ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center animate-fadeInUp animation-delay-300">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#526bb0] border-t-transparent mx-auto mb-4"></div>
            <p className="text-[#86868b]">Loading CSV data...</p>
          </div>
        ) : csvData.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeInUp animation-delay-300">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#1d1d1f]">Customer Data</h3>
                <p className="text-sm text-[#86868b] mt-0.5">
                  Showing {csvData.length} records
                </p>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-[#f5f5f7] sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#86868b] uppercase tracking-wider">#</th>
                    {csvHeaders.map((header, index) => (
                      <th key={index} className="px-4 py-3 text-left text-xs font-semibold text-[#86868b] uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {csvData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-[#f5f5f7]/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-[#86868b]">{rowIndex + 1}</td>
                      {csvHeaders.map((header, colIndex) => (
                        <td key={colIndex} className="px-4 py-3 text-sm text-[#1d1d1f]">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-xs text-[#86868b]">© 2025 Campaignify. All rights reserved.</p>
      </footer>
    </div>
  );
}
