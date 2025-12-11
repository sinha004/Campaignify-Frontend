'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

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
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    
    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    if (!segmentName) {
      setSegmentName(selectedFile.name.replace('.csv', ''));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    if (segmentName) {
      formData.append('name', segmentName);
    }

    try {
      const response = await api.post('/segments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });

      console.log('Upload response:', response.data);
      const segmentData = response.data.data || response.data;
      setSuccess(
        `Segment uploaded successfully! ${segmentData.totalRecords} records found.`
      );
      setFile(null);
      setSegmentName('');
      setUploadProgress(0);

      // Redirect to segments list after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/segments');
      }, 2000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(
        err.response?.data?.message || 'Failed to upload segment. Please try again.'
      );
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
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

      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeInUp">
          <h1 className="text-4xl font-semibold text-[#1d1d1f] tracking-tight mb-3">
            Upload Segment
          </h1>
          <p className="text-lg text-[#86868b]">
            Import your customer list from a CSV file
          </p>
        </div>

        {/* Upload Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-fadeInUp animation-delay-100">
          <form onSubmit={handleUpload} className="space-y-6">
            {/* Segment Name */}
            <div>
              <label className="block text-[#1d1d1f] font-medium mb-2 text-sm">
                Segment Name
              </label>
              <input
                type="text"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
                placeholder="e.g., Tech Startup Founders"
                className="w-full px-4 py-3 bg-[#f5f5f7] border-0 rounded-xl focus:ring-2 focus:ring-[#526bb0] outline-none transition text-[#1d1d1f] placeholder:text-[#86868b]"
              />
            </div>

            {/* File Upload Area */}
            <div>
              <label className="block text-[#1d1d1f] font-medium mb-2 text-sm">
                CSV File
              </label>
              
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-[#526bb0] bg-[#526bb0]/5'
                    : 'border-gray-200 hover:border-[#526bb0]/50 bg-[#f5f5f7]'
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
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-[#526bb0]/10 rounded-2xl flex items-center justify-center mx-auto">
                      <svg
                        className="w-8 h-8 text-[#526bb0]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                  </div>
                  
                  {file ? (
                    <div>
                      <p className="font-medium text-[#1d1d1f]">{file.name}</p>
                      <p className="text-sm text-[#86868b] mt-1">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setFile(null);
                        }}
                        className="mt-3 text-[#e51a3a] text-sm hover:underline"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-[#1d1d1f] mb-1">
                        Drop your CSV file here
                      </p>
                      <p className="text-sm text-[#86868b]">
                        or click to browse · Max 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="bg-[#f5f5f7] rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#1d1d1f]">Uploading...</span>
                  <span className="text-[#526bb0] font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#526bb0] h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl text-sm">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full bg-[#526bb0] text-white py-4 rounded-xl font-medium hover:bg-[#4a5f9e] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Uploading...
                </>
              ) : (
                'Upload Segment'
              )}
            </button>
          </form>
        </div>

        {/* CSV Format Guide */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fadeInUp animation-delay-200">
          <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">
            CSV Format Guide
          </h3>
          <div className="space-y-3 text-[#86868b] text-sm">
            <p>Your CSV file should include these columns:</p>
            <ul className="list-none space-y-2 ml-0">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#526bb0] rounded-full"></span>
                <strong className="text-[#1d1d1f]">name</strong> — Customer name (required)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#01adbd] rounded-full"></span>
                <strong className="text-[#1d1d1f]">email</strong> — Email address (required)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                Additional columns (company, phone) are optional
              </li>
            </ul>
            
            <div className="mt-4 bg-[#f5f5f7] p-4 rounded-xl font-mono text-xs overflow-x-auto">
              <p className="text-[#86868b] mb-2">Example:</p>
              <pre className="text-[#1d1d1f]">{`name,email,company
John Doe,john@example.com,Acme Inc
Jane Smith,jane@example.com,Tech Corp`}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-xs text-[#86868b]">© 2025 Campaignify. All rights reserved.</p>
      </footer>
    </div>
  );
}
