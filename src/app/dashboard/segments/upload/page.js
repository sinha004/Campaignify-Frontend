'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Sidebar from '../../components/Sidebar';
import { Upload, X, ArrowLeft } from 'lucide-react';

export default function UploadSegment() {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [segmentName, setSegmentName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    setFile(selectedFile);
    if (!segmentName) setSegmentName(selectedFile.name.replace('.csv', ''));
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a file'); return; }

    setUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    if (segmentName) formData.append('name', segmentName);

    try {
      const response = await api.post('/segments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total)),
      });
      const segmentData = response.data.data || response.data;
      setSuccess(`Uploaded successfully! ${segmentData.totalRecords} records found.`);
      setFile(null);
      setSegmentName('');
      setTimeout(() => router.push('/dashboard/segments'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard/segments')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-medium text-gray-900">Upload Segment</h2>
            </div>
          </div>
        </header>

        <main className="px-6 py-8 max-w-xl">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <form onSubmit={handleUpload} className="space-y-5">
              {/* Segment Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Segment name</label>
                <input
                  type="text"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  placeholder="e.g., Tech Startup Founders"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                />
              </div>

              {/* Drop zone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CSV file</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    {file ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setFile(null); }}
                          className="mt-2 text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Drop your CSV here or click to browse</p>
                        <p className="text-xs text-gray-400 mt-1">Max 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Progress */}
              {uploading && (
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-600">Uploading...</span>
                    <span className="text-indigo-600 font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-indigo-600 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
              )}
              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">{success}</div>
              )}

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  'Upload segment'
                )}
              </button>
            </form>
          </div>

          {/* CSV Guide */}
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-3">CSV format guide</h3>
            <ul className="text-sm text-gray-500 space-y-1.5 mb-4">
              <li><span className="font-medium text-gray-700">name</span> — Customer name (required)</li>
              <li><span className="font-medium text-gray-700">email</span> — Email address (required)</li>
              <li>Additional columns like company, phone are optional</li>
            </ul>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-600">
              <p className="text-gray-400 mb-1">Example:</p>
              <pre>{`name,email,company
John Doe,john@example.com,Acme Inc
Jane Smith,jane@example.com,Tech Corp`}</pre>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
