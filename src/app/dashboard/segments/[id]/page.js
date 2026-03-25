'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Sidebar from '../../components/Sidebar';
import { ArrowLeft, Download, Trash2, Users, FileText, HardDrive, CheckCircle } from 'lucide-react';

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
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchSegmentDetails();
  }, [isAuthenticated, authLoading, router, params.id]);

  const fetchSegmentDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/segments/${params.id}`);
      setSegment(response.data.data);
      await loadCsvData();
    } catch (err) {
      setError('Failed to load segment details');
    } finally {
      setLoading(false);
    }
  };

  const loadCsvData = async () => {
    try {
      setLoadingCsv(true);
      const response = await api.get(`/segments/${params.id}/download`);
      const csvResponse = await fetch(response.data.data.downloadUrl);
      const csvText = await csvResponse.text();
      const lines = csvText.trim().split('\n');
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim());
        setCsvHeaders(headers);
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          return headers.reduce((obj, header, i) => { obj[header] = values[i] || ''; return obj; }, {});
        });
        setCsvData(data);
      }
    } catch (err) {
      console.error('Failed to load CSV:', err);
    } finally {
      setLoadingCsv(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await api.get(`/segments/${params.id}/download`);
      window.open(response.data.data.downloadUrl, '_blank');
    } catch (err) {
      alert('Failed to generate download link.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${segment.name}"?`)) return;
    try {
      await api.delete(`/segments/${params.id}`);
      router.push('/dashboard/segments');
    } catch (err) {
      alert('Failed to delete segment.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading segment...</p>
        </div>
      </div>
    );
  }

  if (error || !segment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm text-center">
          <p className="text-sm text-gray-600 mb-4">{error || 'Segment not found'}</p>
          <button onClick={() => router.push('/dashboard/segments')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Back to Segments
          </button>
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
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/dashboard/segments')} className="text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-medium text-gray-900">{segment.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
        </header>

        <main className="px-6 py-8 max-w-5xl">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{segment.totalRecords.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Contacts</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{segment.fileName}</p>
                <p className="text-xs text-gray-500">File name</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{formatFileSize(segment.fileSize)}</p>
                <p className="text-xs text-gray-500">File size</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 capitalize">{segment.status}</p>
                <p className="text-xs text-gray-500">Status</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-6">Uploaded {formatDate(segment.uploadedAt)}</p>

          {/* CSV Data Table */}
          {loadingCsv ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Loading CSV data...</p>
            </div>
          ) : csvData.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Customer Data</h3>
                <p className="text-xs text-gray-500 mt-0.5">{csvData.length} records</p>
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                      {csvHeaders.map((header, i) => (
                        <th key={i} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {csvData.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-xs text-gray-400">{rowIndex + 1}</td>
                        {csvHeaders.map((header, colIndex) => (
                          <td key={colIndex} className="px-4 py-2.5 text-sm text-gray-700">{row[header]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
