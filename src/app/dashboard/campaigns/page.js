'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export default function CampaignsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchCampaigns();
    fetchStatistics();
  }, [isAuthenticated, authLoading, router]);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/campaigns');
      setCampaigns(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load campaigns');
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/campaigns/statistics');
      setStatistics(response.data);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const handleDelete = async (id, campaignName) => {
    if (!confirm(`Are you sure you want to delete "${campaignName}"?`)) {
      return;
    }

    try {
      await api.delete(`/campaigns/${id}`);
      fetchCampaigns();
      fetchStatistics();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete campaign');
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#cad6ec] via-white to-[#5fcde0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#526bb0] mx-auto mb-4"></div>
          <p className="text-[#041d36] font-semibold">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#cad6ec] via-white to-[#5fcde0] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-[#526bb0] hover:text-[#041d36] mb-4 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-[#041d36] mb-2">Campaigns</h1>
            <p className="text-gray-600">Manage your marketing campaigns</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/campaigns/create')}
            className="bg-gradient-to-r from-[#526bb0] to-[#01adbd] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition-all flex items-center gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Campaign
          </button>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#526bb0]">
              <div className="text-sm text-gray-600 mb-1">Total Campaigns</div>
              <div className="text-3xl font-bold text-[#041d36]">{statistics.totalCampaigns}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="text-sm text-gray-600 mb-1">Active Campaigns</div>
              <div className="text-3xl font-bold text-[#041d36]">{statistics.activeCampaigns}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="text-sm text-gray-600 mb-1">Scheduled</div>
              <div className="text-3xl font-bold text-[#041d36]">{statistics.scheduledCampaigns}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="text-sm text-gray-600 mb-1">Completed</div>
              <div className="text-3xl font-bold text-[#041d36]">{statistics.completedCampaigns}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#01adbd]">
              <div className="text-sm text-gray-600 mb-1">Total Users Targeted</div>
              <div className="text-3xl font-bold text-[#041d36]">{statistics.totalUsersTargeted.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#5fcde0]">
              <div className="text-sm text-gray-600 mb-1">Total Sent</div>
              <div className="text-3xl font-bold text-[#041d36]">{statistics.totalSent.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="text-sm text-gray-600 mb-1">Total Failed</div>
              <div className="text-3xl font-bold text-[#041d36]">{statistics.totalFailed.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="text-sm text-gray-600 mb-1">Success Rate</div>
              <div className="text-3xl font-bold text-[#041d36]">
                {statistics.totalSent + statistics.totalFailed > 0
                  ? ((statistics.totalSent / (statistics.totalSent + statistics.totalFailed)) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Campaigns List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {campaigns.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📧</div>
              <h3 className="text-xl font-semibold text-[#041d36] mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-6">Create your first campaign to get started</p>
              <button
                onClick={() => router.push('/dashboard/campaigns/create')}
                className="bg-[#526bb0] text-white px-6 py-3 rounded-lg hover:bg-[#01adbd] transition-colors"
              >
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Segment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-[#041d36]">{campaign.name}</div>
                        {campaign.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{campaign.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{campaign.segment?.name}</div>
                        <div className="text-sm text-gray-500">{campaign.segment?.totalRecords} contacts</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>{formatDate(campaign.startDate)}</div>
                        <div className="text-gray-500">to {formatDate(campaign.endDate)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="text-green-600">{campaign.totalSent} sent</div>
                        <div className="text-red-600">{campaign.totalFailed} failed</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium space-x-2">
                        <button
                          onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                          className="text-[#526bb0] hover:text-[#01adbd]"
                        >
                          View
                        </button>
                        {campaign.status !== 'running' && campaign.status !== 'completed' && (
                          <button
                            onClick={() => handleDelete(campaign.id, campaign.name)}
                            className="text-[#e51a3a] hover:text-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
