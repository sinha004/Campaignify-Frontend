'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Sidebar from '../components/Sidebar';

export default function CampaignsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

  const getStatusConfig = (status) => {
    const configs = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
      scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      running: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500 animate-pulse' },
      paused: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      completed: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
      failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    };
    return configs[status] || configs.draft;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#01adbd]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#01adbd] animate-spin"></div>
          </div>
          <p className="text-[#86868b] text-lg font-medium">Loading campaigns...</p>
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
              <h2 className="text-lg font-medium text-[#1d1d1f]">Campaigns</h2>
              <button
                onClick={() => router.push('/dashboard/campaigns/create')}
                className="inline-flex items-center px-4 py-2 bg-[#1d1d1f] text-white text-sm font-medium rounded-full hover:bg-[#01adbd] transition-colors btn-shine"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Campaign
              </button>
            </div>
          </div>
        </nav>

        <main className="px-6 lg:px-8 py-12">
        {/* Header */}
        <section className="mb-12 animate-fade-in-up">
          <h1 className="text-4xl lg:text-5xl font-bold text-[#1d1d1f] tracking-tight mb-4">
            Campaigns
          </h1>
          <p className="text-xl text-[#86868b]">
            Create, manage, and track your marketing campaigns.
          </p>
        </section>

        {/* Statistics Cards */}
        {statistics && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Total', value: statistics.totalCampaigns, color: 'from-[#526bb0] to-[#6b7fd6]' },
              { label: 'Active', value: statistics.activeCampaigns, color: 'from-green-500 to-green-400' },
              { label: 'Scheduled', value: statistics.scheduledCampaigns, color: 'from-blue-500 to-blue-400' },
              { label: 'Completed', value: statistics.completedCampaigns, color: 'from-purple-500 to-purple-400' },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 card-hover animate-fade-in-up"
                style={{ opacity: 0, animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
              >
                <p className="text-[#86868b] text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-[#1d1d1f]">{stat.value}</p>
              </div>
            ))}
          </section>
        )}

        {/* Performance Stats */}
        {statistics && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Users Targeted', value: statistics.totalUsersTargeted.toLocaleString(), icon: '👥' },
              { label: 'Total Sent', value: statistics.totalSent.toLocaleString(), icon: '✉️' },
              { label: 'Failed', value: statistics.totalFailed.toLocaleString(), icon: '⚠️' },
              { 
                label: 'Success Rate', 
                value: statistics.totalSent + statistics.totalFailed > 0
                  ? `${((statistics.totalSent / (statistics.totalSent + statistics.totalFailed)) * 100).toFixed(1)}%`
                  : '0%',
                icon: '📊' 
              },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 card-hover animate-fade-in-up"
                style={{ opacity: 0, animationDelay: `${(index + 4) * 50}ms`, animationFillMode: 'forwards' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#86868b] text-sm">{stat.label}</p>
                  <span className="text-lg">{stat.icon}</span>
                </div>
                <p className="text-2xl font-bold text-[#1d1d1f]">{stat.value}</p>
              </div>
            ))}
          </section>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Campaigns List */}
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#01adbd]/10 to-[#526bb0]/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-[#01adbd]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-[#1d1d1f] mb-2">No campaigns yet</h3>
            <p className="text-[#86868b] mb-8 max-w-md mx-auto">
              Create your first campaign to start reaching your audience with targeted marketing.
            </p>
            <button
              onClick={() => router.push('/dashboard/campaigns/create')}
              className="inline-flex items-center px-6 py-3 bg-[#1d1d1f] text-white font-medium rounded-full hover:bg-[#01adbd] transition-colors btn-shine"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Campaign
            </button>
          </div>
        ) : (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-[#1d1d1f] mb-6">All Campaigns</h2>
            {campaigns.map((campaign, index) => {
              const statusConfig = getStatusConfig(campaign.status);
              return (
                <div
                  key={campaign.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden card-hover animate-fade-in-up"
                  style={{ opacity: 0, animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Campaign Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-[#1d1d1f] truncate">{campaign.name}</h3>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </span>
                        </div>
                        {campaign.description && (
                          <p className="text-[#86868b] text-sm mb-3 line-clamp-1">{campaign.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-[#86868b]">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{campaign.segment?.name}</span>
                            <span className="text-[#aeaeb2]">•</span>
                            <span>{campaign.segment?.totalRecords} contacts</span>
                          </div>
                          <div className="flex items-center gap-2 text-[#86868b]">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatDate(campaign.startDate)} → {formatDate(campaign.endDate)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats & Actions */}
                      <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-green-600 font-semibold">{campaign.totalSent}</p>
                            <p className="text-[#86868b] text-xs">Sent</p>
                          </div>
                          <div className="text-center">
                            <p className="text-red-500 font-semibold">{campaign.totalFailed}</p>
                            <p className="text-[#86868b] text-xs">Failed</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                            className="px-4 py-2 text-sm font-medium text-[#526bb0] hover:bg-[#526bb0]/10 rounded-lg transition-colors"
                          >
                            View
                          </button>
                          {campaign.status !== 'running' && campaign.status !== 'completed' && (
                            <button
                              onClick={() => handleDelete(campaign.id, campaign.name)}
                              className="p-2 text-[#86868b] hover:text-[#e51a3a] hover:bg-red-50 rounded-lg transition-all"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
