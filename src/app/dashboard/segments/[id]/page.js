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
      <div className="min-h-screen bg-gradient-to-br from-[#cad6ec] via-white to-[#5fcde0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#526bb0] mx-auto mb-4"></div>
          <p className="text-[#041d36] font-semibold">Loading segment details...</p>
        </div>
      </div>
    );
  }

  if (error || !segment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#cad6ec] via-white to-[#5fcde0] flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-[#041d36] mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Segment not found'}</p>
          <button
            onClick={() => router.push('/dashboard/segments')}
            className="bg-gradient-to-r from-[#526bb0] to-[#01adbd] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition-all"
          >
            Back to Segments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#cad6ec] via-white to-[#5fcde0] p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/segments')}
            className="text-[#526bb0] hover:text-[#041d36] mb-4 flex items-center gap-2"
          >
            ← Back to Segments
          </button>
          <h1 className="text-4xl font-bold text-[#041d36] mb-2">
            Segment Details
          </h1>
          <p className="text-gray-600">
            View and manage your customer segment
          </p>
        </div>

        {/* Segment Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-[#041d36] mb-2">
                {segment.name}
              </h2>
              <p className="text-gray-500">ID: {segment.id}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="bg-gradient-to-r from-[#01adbd] to-[#5fcde0] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download CSV
                  </>
                )}
              </button>
              <button
                onClick={handleDelete}
                className="bg-[#e51a3a] text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-[#526bb0] p-2 rounded-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">File Name</p>
                  <p className="text-lg font-semibold text-[#041d36]">
                    {segment.fileName}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-[#01adbd] p-2 rounded-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Records</p>
                  <p className="text-lg font-semibold text-[#041d36]">
                    {segment.totalRecords.toLocaleString()} contacts
                  </p>
                </div>
              </div>
            </div>

            <div className="border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-[#5fcde0] p-2 rounded-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">File Size</p>
                  <p className="text-lg font-semibold text-[#041d36]">
                    {formatFileSize(segment.fileSize)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-[#604e43] p-2 rounded-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Uploaded</p>
                  <p className="text-lg font-semibold text-[#041d36]">
                    {formatDate(segment.uploadedAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-500 p-2 rounded-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-lg font-semibold text-[#041d36] capitalize">
                    {segment.status}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">S3 Storage</p>
                  <p className="text-sm font-semibold text-[#041d36] truncate max-w-xs">
                    {segment.s3Key}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CSV Data Table */}
        {loadingCsv ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#526bb0] mx-auto mb-4"></div>
            <p className="text-[#041d36] font-semibold">Loading CSV data...</p>
          </div>
        ) : csvData.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#041d36]">Customer Data</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {csvData.length} records from {segment.fileName}
                </p>
              </div>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="bg-[#01adbd] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#5fcde0] transition-all flex items-center gap-2 text-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download Full CSV
              </button>
            </div>
            
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#526bb0] to-[#01adbd] text-white sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-sm">#</th>
                    {csvHeaders.map((header, index) => (
                      <th key={index} className="px-4 py-3 text-left font-semibold text-sm">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {csvData.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                        {rowIndex + 1}
                      </td>
                      {csvHeaders.map((header, colIndex) => (
                        <td key={colIndex} className="px-4 py-3 text-sm text-[#041d36]">
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

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">📊</div>
            <div>
              <h3 className="font-semibold text-[#041d36] mb-2">
                About This Segment
              </h3>
              <p className="text-gray-600 text-sm">
                This customer segment contains <strong>{segment.totalRecords} records</strong> and was
                uploaded on {formatDate(segment.uploadedAt)}. The file is securely stored in AWS S3 and can be
                downloaded at any time using the button above. You can use this segment to target specific
                customers in your marketing campaigns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
