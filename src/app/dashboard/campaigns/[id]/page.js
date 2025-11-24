'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export default function CampaignDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchCampaign();
  }, [isAuthenticated, authLoading, router, params.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusDropdown && !event.target.closest('.status-dropdown-container')) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusDropdown]);

  const fetchCampaign = async () => {
    try {
      const response = await api.get(`/campaigns/${params.id}`);
      setCampaign(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load campaign');
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!confirm(`Are you sure you want to change status to "${newStatus}"?`)) {
      return;
    }

    setStatusLoading(true);
    try {
      await api.patch(`/campaigns/${params.id}/status`, { status: newStatus });
      await fetchCampaign();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      running: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-purple-100 text-purple-700',
      failed: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getAvailableStatusTransitions = (currentStatus) => {
    const transitions = {
      draft: ['scheduled'],
      scheduled: ['running', 'draft'],
      running: ['paused', 'completed', 'failed'],
      paused: ['running', 'failed'],
      completed: [],
      failed: ['draft'],
    };
    return transitions[currentStatus] || [];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#cad6ec] via-white to-[#5fcde0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#526bb0] mx-auto mb-4"></div>
          <p className="text-[#041d36] font-semibold">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#cad6ec] via-white to-[#5fcde0] p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-700 text-lg">{error || 'Campaign not found'}</p>
            <button
              onClick={() => router.push('/dashboard/campaigns')}
              className="mt-4 text-[#526bb0] hover:text-[#041d36]"
            >
              ← Back to Campaigns
            </button>
          </div>
        </div>
      </div>
    );
  }

  const availableTransitions = getAvailableStatusTransitions(campaign.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#cad6ec] via-white to-[#5fcde0] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/campaigns')}
            className="text-[#526bb0] hover:text-[#041d36] mb-4 flex items-center gap-2"
          >
            ← Back to Campaigns
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-[#041d36]">{campaign.name}</h1>
              {campaign.description && (
                <p className="text-gray-600 mt-2">{campaign.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full font-semibold ${getStatusBadgeColor(campaign.status)}`}>
                {campaign.status.toUpperCase()}
              </span>
              {availableTransitions.length > 0 && (
                <div className="relative status-dropdown-container">
                  <button
                    disabled={statusLoading}
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className="bg-gradient-to-r from-[#526bb0] to-[#01adbd] text-white px-4 py-2 rounded-lg font-semibold hover:shadow-xl transition-all disabled:bg-gray-400 disabled:opacity-50 flex items-center gap-2"
                  >
                    Change Status
                    <svg className={`w-4 h-4 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showStatusDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                      {availableTransitions.map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            handleStatusChange(status);
                            setShowStatusDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-[#041d36] first:rounded-t-lg last:rounded-b-lg transition-colors"
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-[#526bb0] text-[#526bb0]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('flow')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'flow'
                  ? 'border-[#526bb0] text-[#526bb0]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Flow Builder
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-[#526bb0] text-[#526bb0]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#526bb0]">
                <div className="text-sm text-gray-600 mb-1">Users Targeted</div>
                <div className="text-3xl font-bold text-[#041d36]">{campaign.totalUsersTargeted.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="text-sm text-gray-600 mb-1">Jobs Created</div>
                <div className="text-3xl font-bold text-[#041d36]">{campaign.totalJobsCreated.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="text-sm text-gray-600 mb-1">Messages Sent</div>
                <div className="text-3xl font-bold text-[#041d36]">{campaign.totalSent.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="text-sm text-gray-600 mb-1">Failed</div>
                <div className="text-3xl font-bold text-[#041d36]">{campaign.totalFailed.toLocaleString()}</div>
              </div>
            </div>

            {/* Campaign Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-[#041d36] mb-4">Campaign Details</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Campaign ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{campaign.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created At</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(campaign.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(campaign.updatedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(campaign.startDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">End Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(campaign.endDate)}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-[#041d36] mb-4">Target Segment</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Segment Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{campaign.segment?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Contacts</dt>
                    <dd className="mt-1 text-sm text-gray-900">{campaign.segment?.totalRecords.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">File Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{campaign.segment?.fileName}</dd>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={() => router.push(`/dashboard/segments/${campaign.segmentId}`)}
                      className="text-[#526bb0] hover:text-[#01adbd] text-sm font-medium"
                    >
                      View Segment Details →
                    </button>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'flow' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold text-[#041d36] mb-2">Flow Builder</h3>
              <p className="text-gray-600 mb-4">
                Visual workflow builder will be integrated here
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto text-left">
                <h4 className="font-medium text-blue-900 mb-2">🚀 Coming Soon</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Drag-and-drop workflow designer with React Flow</li>
                  <li>Pre-built nodes for email, SMS, delays, and conditions</li>
                  <li>Visual branching based on customer actions</li>
                  <li>Integration with n8n for workflow execution</li>
                  <li>Real-time workflow validation</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-semibold text-[#041d36] mb-6">Campaign Performance</h3>
            
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                <div className="text-sm text-green-700 mb-1">Delivery Rate</div>
                <div className="text-3xl font-bold text-green-900">
                  {campaign.totalSent + campaign.totalFailed > 0
                    ? ((campaign.totalSent / (campaign.totalSent + campaign.totalFailed)) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                <div className="text-sm text-blue-700 mb-1">Success Rate</div>
                <div className="text-3xl font-bold text-blue-900">
                  {campaign.totalUsersTargeted > 0
                    ? ((campaign.totalSent / campaign.totalUsersTargeted) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6">
                <div className="text-sm text-red-700 mb-1">Failure Rate</div>
                <div className="text-3xl font-bold text-red-900">
                  {campaign.totalSent + campaign.totalFailed > 0
                    ? ((campaign.totalFailed / (campaign.totalSent + campaign.totalFailed)) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
            </div>

            {/* Additional Analytics Placeholder */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="font-semibold text-gray-900 mb-2">Advanced Analytics</h4>
              <p className="text-gray-600 text-sm">
                Detailed charts and insights will be displayed here, including:
              </p>
              <ul className="text-sm text-gray-600 mt-3 space-y-1">
                <li>• Message delivery timeline</li>
                <li>• Engagement metrics (opens, clicks, conversions)</li>
                <li>• Device and platform breakdown</li>
                <li>• Geographic distribution</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
