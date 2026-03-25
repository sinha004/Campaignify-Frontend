'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Sidebar from '../components/Sidebar';
import { Plus, Trash2, Eye } from 'lucide-react';

export default function CampaignsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
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

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/campaigns/${id}`);
      fetchCampaigns();
      fetchStatistics();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete campaign');
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-50 text-blue-700',
      running: 'bg-emerald-50 text-emerald-700',
      paused: 'bg-amber-50 text-amber-700',
      completed: 'bg-purple-50 text-purple-700',
      failed: 'bg-red-50 text-red-700',
    };
    return styles[status] || styles.draft;
  };

  const getDotStyle = (status) => {
    const styles = {
      draft: 'bg-gray-400',
      scheduled: 'bg-blue-500',
      running: 'bg-emerald-500 animate-pulse',
      paused: 'bg-amber-500',
      completed: 'bg-purple-500',
      failed: 'bg-red-500',
    };
    return styles[status] || styles.draft;
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading campaigns...</p>
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
            <h2 className="text-sm font-medium text-gray-900">Campaigns</h2>
            <button
              onClick={() => router.push('/dashboard/campaigns/create')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create
            </button>
          </div>
        </header>

        <main className="px-6 py-8 max-w-5xl">
          {/* Header */}
          <section className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Campaigns</h1>
            <p className="text-sm text-gray-500 mt-1">Create, manage, and track your marketing campaigns.</p>
          </section>

          {/* Stats */}
          {statistics && (
            <section className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total', value: statistics.totalCampaigns },
                { label: 'Active', value: statistics.activeCampaigns },
                { label: 'Scheduled', value: statistics.scheduledCampaigns },
                { label: 'Completed', value: statistics.completedCampaigns },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </section>
          )}

          {/* Performance stats */}
          {statistics && (
            <section className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Users targeted', value: statistics.totalUsersTargeted.toLocaleString() },
                { label: 'Sent', value: statistics.totalSent.toLocaleString() },
                { label: 'Failed', value: statistics.totalFailed.toLocaleString() },
                {
                  label: 'Success rate',
                  value: statistics.totalSent + statistics.totalFailed > 0
                    ? `${((statistics.totalSent / (statistics.totalSent + statistics.totalFailed)) * 100).toFixed(1)}%`
                    : '0%',
                },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                  <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </section>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>
          )}

          {/* Empty state */}
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">No campaigns yet</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Create your first campaign to start reaching your audience.
              </p>
              <button
                onClick={() => router.push('/dashboard/campaigns/create')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create campaign
              </button>
            </div>
          ) : (
            /* Campaigns table */
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Failed</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                          className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                        >
                          {campaign.name}
                        </button>
                        {campaign.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{campaign.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(campaign.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getDotStyle(campaign.status)}`}></span>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {campaign.segment?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-emerald-600 font-medium">{campaign.totalSent}</td>
                      <td className="px-4 py-3 text-sm text-center text-red-500 font-medium">{campaign.totalFailed}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {campaign.status !== 'running' && campaign.status !== 'completed' && (
                            <button
                              onClick={() => handleDelete(campaign.id, campaign.name)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
