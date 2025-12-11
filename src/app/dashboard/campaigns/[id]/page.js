'use client';

import { useState, useEffect, useCallback } from 'react';
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
  
  // New states for workflow features
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [n8nConnected, setN8nConnected] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // New states for scheduling and execution
  const [progress, setProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [executions, setExecutions] = useState(null);
  const [executionsLoading, setExecutionsLoading] = useState(false);
  const [executionFilter, setExecutionFilter] = useState('');
  const [executionPage, setExecutionPage] = useState(1);
  const [scheduledAt, setScheduledAt] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [runNowLoading, setRunNowLoading] = useState(false);
  const [pauseResumeLoading, setPauseResumeLoading] = useState(false);

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

  // Fetch workflow status and execution history
  const fetchWorkflowStatus = async () => {
    setWorkflowLoading(true);
    try {
      const response = await api.get(`/campaigns/${params.id}/workflow-status`);
      setWorkflowStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch workflow status:', err);
      setWorkflowStatus({ error: err.response?.data?.message || 'Failed to fetch status' });
    } finally {
      setWorkflowLoading(false);
    }
  };

  // Trigger workflow execution
  const handleTriggerWorkflow = async () => {
    if (!confirm('This will trigger the workflow immediately. Continue?')) {
      return;
    }

    setTriggerLoading(true);
    setActionMessage(null);
    try {
      const response = await api.post(`/campaigns/${params.id}/trigger-workflow`);
      setActionMessage({ type: 'success', text: 'Workflow triggered successfully!' });
      // Refresh workflow status after triggering
      await fetchWorkflowStatus();
    } catch (err) {
      setActionMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to trigger workflow' 
      });
    } finally {
      setTriggerLoading(false);
      // Clear message after 5 seconds
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  // Test n8n connection
  const testN8nConnection = async () => {
    try {
      const response = await api.get('/campaigns/n8n/test-connection');
      setN8nConnected(response.data.connected);
    } catch (err) {
      setN8nConnected(false);
    }
  };

  // Fetch workflow status when flow tab is active
  useEffect(() => {
    if (activeTab === 'flow' && campaign?.n8nWorkflowId) {
      fetchWorkflowStatus();
      testN8nConnection();
    } else if (activeTab === 'flow') {
      // Still check n8n connection even without a deployed workflow
      testN8nConnection();
    }
  }, [activeTab, campaign?.n8nWorkflowId]);

  // Fetch campaign progress
  const fetchProgress = useCallback(async () => {
    if (!params.id) return;
    setProgressLoading(true);
    try {
      const response = await api.get(`/campaigns/${params.id}/progress`);
      setProgress(response.data);
    } catch (err) {
      console.error('Failed to fetch progress:', err);
    } finally {
      setProgressLoading(false);
    }
  }, [params.id]);

  // Fetch execution records
  const fetchExecutions = useCallback(async () => {
    if (!params.id) return;
    setExecutionsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (executionFilter) queryParams.set('status', executionFilter);
      queryParams.set('page', executionPage.toString());
      queryParams.set('limit', '20');
      
      const response = await api.get(`/campaigns/${params.id}/executions?${queryParams}`);
      setExecutions(response.data);
    } catch (err) {
      console.error('Failed to fetch executions:', err);
    } finally {
      setExecutionsLoading(false);
    }
  }, [params.id, executionFilter, executionPage]);

  // Fetch progress when execution tab is active
  useEffect(() => {
    if (activeTab === 'execution' && campaign) {
      fetchProgress();
      fetchExecutions();
    }
  }, [activeTab, campaign?.id, fetchProgress, fetchExecutions]);

  // Refetch executions when filter or page changes
  useEffect(() => {
    if (activeTab === 'execution' && campaign) {
      fetchExecutions();
    }
  }, [executionFilter, executionPage, activeTab, campaign, fetchExecutions]);

  // Auto-refresh progress every 5 seconds when campaign is running
  useEffect(() => {
    let interval;
    if (activeTab === 'execution' && campaign?.status === 'running') {
      interval = setInterval(() => {
        fetchProgress();
        fetchExecutions();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab, campaign?.status, fetchProgress, fetchExecutions]);

  // Schedule campaign
  const handleScheduleCampaign = async () => {
    if (!scheduledAt) {
      setActionMessage({ type: 'error', text: 'Please select a date and time' });
      return;
    }
    
    setScheduleLoading(true);
    setActionMessage(null);
    try {
      await api.post(`/campaigns/${params.id}/schedule`, {
        scheduledAt: new Date(scheduledAt).toISOString()
      });
      setActionMessage({ type: 'success', text: 'Campaign scheduled successfully!' });
      await fetchCampaign();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to schedule campaign' });
    } finally {
      setScheduleLoading(false);
    }
  };

  // Run campaign now
  const handleRunCampaignNow = async () => {
    if (!confirm('This will start the campaign immediately. Continue?')) return;
    
    setRunNowLoading(true);
    setActionMessage(null);
    try {
      await api.post(`/campaigns/${params.id}/run-now`);
      setActionMessage({ type: 'success', text: 'Campaign started successfully!' });
      await fetchCampaign();
      setActiveTab('execution');
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to start campaign' });
    } finally {
      setRunNowLoading(false);
    }
  };

  // Pause campaign
  const handlePauseCampaign = async () => {
    if (!confirm('This will pause the campaign. Continue?')) return;
    
    setPauseResumeLoading(true);
    setActionMessage(null);
    try {
      await api.post(`/campaigns/${params.id}/pause`);
      setActionMessage({ type: 'success', text: 'Campaign paused' });
      await fetchCampaign();
      await fetchProgress();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to pause campaign' });
    } finally {
      setPauseResumeLoading(false);
    }
  };

  // Resume campaign
  const handleResumeCampaign = async () => {
    if (!confirm('This will resume the campaign. Continue?')) return;
    
    setPauseResumeLoading(true);
    setActionMessage(null);
    try {
      await api.post(`/campaigns/${params.id}/resume`);
      setActionMessage({ type: 'success', text: 'Campaign resumed' });
      await fetchCampaign();
      await fetchProgress();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to resume campaign' });
    } finally {
      setPauseResumeLoading(false);
    }
  };

  // Retry failed executions
  const handleRetryFailed = async () => {
    if (!confirm('This will retry all failed executions. Continue?')) return;
    
    setActionMessage(null);
    try {
      const response = await api.post(`/campaigns/${params.id}/retry-failed`);
      setActionMessage({ type: 'success', text: response.data.message });
      await fetchCampaign();
      await fetchProgress();
      await fetchExecutions();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to retry executions' });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#526bb0] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#86868b]">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-[#1d1d1f] text-lg mb-4">{error || 'Campaign not found'}</p>
            <button
              onClick={() => router.push('/dashboard/campaigns')}
              className="text-[#526bb0] hover:text-[#01adbd] font-medium"
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
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/campaigns')}
              className="text-[#526bb0] hover:text-[#01adbd] transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Campaigns
            </button>
          </div>
          <span className="text-[#1d1d1f] font-semibold">Campaignify</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-fadeInUp">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-semibold text-[#1d1d1f] tracking-tight">{campaign.name}</h1>
              {campaign.description && (
                <p className="text-[#86868b] mt-2">{campaign.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadgeColor(campaign.status)}`}>
                {campaign.status.toUpperCase()}
              </span>
              {availableTransitions.length > 0 && (
                <div className="relative status-dropdown-container">
                  <button
                    disabled={statusLoading}
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className="bg-[#526bb0] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#4a5f9e] transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    Change Status
                    <svg className={`w-4 h-4 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showStatusDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden">
                      {availableTransitions.map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            handleStatusChange(status);
                            setShowStatusDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-2.5 hover:bg-[#f5f5f7] text-[#1d1d1f] text-sm transition-colors"
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
        <div className="border-b border-gray-200 mb-8 animate-fadeInUp animation-delay-100">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'border-[#526bb0] text-[#526bb0]'
                  : 'border-transparent text-[#86868b] hover:text-[#1d1d1f] hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('flow')}
              className={`py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'flow'
                  ? 'border-[#526bb0] text-[#526bb0]'
                  : 'border-transparent text-[#86868b] hover:text-[#1d1d1f] hover:border-gray-300'
              }`}
            >
              Flow Builder
            </button>
            <button
              onClick={() => setActiveTab('execution')}
              className={`py-4 px-1 border-b-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'execution'
                  ? 'border-[#526bb0] text-[#526bb0]'
                  : 'border-transparent text-[#86868b] hover:text-[#1d1d1f] hover:border-gray-300'
              }`}
            >
              Execution
              {campaign?.status === 'running' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Live
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'border-[#526bb0] text-[#526bb0]'
                  : 'border-transparent text-[#86868b] hover:text-[#1d1d1f] hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeInUp animation-delay-200">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="text-sm text-[#86868b] mb-1">Users Targeted</div>
                <div className="text-2xl font-semibold text-[#1d1d1f]">{campaign.totalUsersTargeted.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="text-sm text-[#86868b] mb-1">Jobs Created</div>
                <div className="text-2xl font-semibold text-[#1d1d1f]">{campaign.totalJobsCreated.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="text-sm text-[#86868b] mb-1">Messages Sent</div>
                <div className="text-2xl font-semibold text-green-600">{campaign.totalSent.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="text-sm text-[#86868b] mb-1">Failed</div>
                <div className="text-2xl font-semibold text-red-600">{campaign.totalFailed.toLocaleString()}</div>
              </div>
            </div>

            {/* Campaign Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Campaign Details</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm text-[#86868b]">Campaign ID</dt>
                    <dd className="mt-1 text-sm text-[#1d1d1f] font-mono">{campaign.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-[#86868b]">Created At</dt>
                    <dd className="mt-1 text-sm text-[#1d1d1f]">{formatDate(campaign.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-[#86868b]">Last Updated</dt>
                    <dd className="mt-1 text-sm text-[#1d1d1f]">{formatDate(campaign.updatedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-[#86868b]">Start Date</dt>
                    <dd className="mt-1 text-sm text-[#1d1d1f]">{formatDate(campaign.startDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-[#86868b]">End Date</dt>
                    <dd className="mt-1 text-sm text-[#1d1d1f]">{formatDate(campaign.endDate)}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">Target Segment</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm text-[#86868b]">Segment Name</dt>
                    <dd className="mt-1 text-sm text-[#1d1d1f]">{campaign.segment?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-[#86868b]">Total Contacts</dt>
                    <dd className="mt-1 text-sm text-[#1d1d1f]">{campaign.segment?.totalRecords.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-[#86868b]">File Name</dt>
                    <dd className="mt-1 text-sm text-[#1d1d1f]">{campaign.segment?.fileName}</dd>
                  </div>
                  <div className="pt-2">
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

            {/* Scheduling & Execution Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#86868b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Campaign Execution
              </h3>

              {/* Action Message */}
              {actionMessage && (
                <div className={`rounded-xl p-4 mb-4 ${
                  actionMessage.type === 'success' 
                    ? 'bg-green-50 border border-green-100 text-green-700' 
                    : 'bg-red-50 border border-red-100 text-red-600'
                }`}>
                  {actionMessage.text}
                </div>
              )}

              {/* Workflow Status Check */}
              {!campaign.n8nWorkflowId && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
                  <p className="text-amber-700 text-sm">
                    ⚠️ You need to create and deploy a workflow before you can run this campaign.{' '}
                    <button 
                      onClick={() => setActiveTab('flow')} 
                      className="font-medium underline hover:text-amber-800"
                    >
                      Go to Flow Builder →
                    </button>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Schedule Section */}
                <div className="bg-[#f5f5f7] rounded-xl p-5">
                  <h4 className="font-medium text-[#1d1d1f] mb-3 text-sm">Schedule Campaign</h4>
                  
                  {campaign.scheduledAt && (
                    <div className="mb-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-sm text-blue-700">
                        <strong>Scheduled for:</strong> {formatDate(campaign.scheduledAt)}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      disabled={!campaign.n8nWorkflowId || ['running', 'completed'].includes(campaign.status)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-4 py-3 bg-white border-0 rounded-xl focus:ring-2 focus:ring-[#526bb0] outline-none transition text-[#1d1d1f] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={handleScheduleCampaign}
                      disabled={scheduleLoading || !campaign.n8nWorkflowId || ['running', 'completed'].includes(campaign.status)}
                      className="w-full bg-[#526bb0] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#4a5f9e] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      {scheduleLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      {campaign.scheduledAt ? 'Reschedule' : 'Schedule Campaign'}
                    </button>
                  </div>
                </div>

                {/* Run Now Section */}
                <div className="bg-[#f5f5f7] rounded-xl p-5">
                  <h4 className="font-medium text-[#1d1d1f] mb-3 text-sm">Quick Actions</h4>
                  
                  <div className="space-y-3">
                    {/* Run Now Button */}
                    {['draft', 'scheduled', 'failed'].includes(campaign.status) && (
                      <button
                        onClick={handleRunCampaignNow}
                        disabled={runNowLoading || !campaign.n8nWorkflowId}
                        className="w-full bg-green-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                      >
                        {runNowLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        Run Campaign Now
                      </button>
                    )}

                    {/* Pause Button */}
                    {campaign.status === 'running' && (
                      <button
                        onClick={handlePauseCampaign}
                        disabled={pauseResumeLoading}
                        className="w-full bg-amber-500 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                      >
                        {pauseResumeLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        Pause Campaign
                      </button>
                    )}

                    {/* Resume Button */}
                    {campaign.status === 'paused' && (
                      <button
                        onClick={handleResumeCampaign}
                        disabled={pauseResumeLoading}
                        className="w-full bg-green-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                      >
                        {pauseResumeLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        Resume Campaign
                      </button>
                    )}

                    {/* View Execution Button */}
                    {['running', 'paused', 'completed', 'failed'].includes(campaign.status) && (
                      <button
                        onClick={() => setActiveTab('execution')}
                        className="w-full bg-white text-[#1d1d1f] px-4 py-2.5 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm border border-gray-200"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        View Execution Progress
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'flow' && (
          <div className="space-y-6 animate-fadeInUp">
            {/* Action Message */}
            {actionMessage && (
              <div className={`rounded-xl p-4 ${
                actionMessage.type === 'success' 
                  ? 'bg-green-50 border border-green-100 text-green-700' 
                  : 'bg-red-50 border border-red-100 text-red-600'
              }`}>
                {actionMessage.text}
              </div>
            )}

            {/* n8n Connection Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    n8nConnected === null ? 'bg-gray-300 animate-pulse' :
                    n8nConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-[#1d1d1f]">
                    n8n Automation Engine: {
                      n8nConnected === null ? 'Checking...' :
                      n8nConnected ? 'Connected' : 'Disconnected'
                    }
                  </span>
                </div>
                <button
                  onClick={testN8nConnection}
                  className="text-sm text-[#526bb0] hover:text-[#01adbd]"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Main Flow Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-[#526bb0]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-[#526bb0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#1d1d1f] mb-2">Flow Builder</h3>
                <p className="text-[#86868b] mb-6 max-w-md mx-auto">
                  Create visual workflows to automate your campaign
                </p>
                
                {/* Flow Status */}
                {campaign.flowData && Object.keys(campaign.flowData).length > 0 ? (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm bg-green-50 text-green-700 border border-green-100">
                      ✓ Flow configured ({campaign.flowData.nodes?.length || 0} nodes)
                    </span>
                  </div>
                ) : (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm bg-[#f5f5f7] text-[#86868b]">
                      No flow configured yet
                    </span>
                  </div>
                )}

                {/* n8n Deployment Status */}
                {campaign.n8nWorkflowId && (
                  <div className="mb-6">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-100">
                      🚀 Deployed to n8n (ID: {campaign.n8nWorkflowId})
                    </span>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => router.push(`/dashboard/campaigns/${params.id}/flow-builder`)}
                    className="bg-[#526bb0] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#4a5f9e] transition-colors inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    {campaign.flowData ? 'Edit Flow' : 'Create Flow'}
                  </button>

                  {/* Run Now Button - only show if workflow is deployed */}
                  {campaign.n8nWorkflowId && (
                    <button
                      onClick={handleTriggerWorkflow}
                      disabled={triggerLoading}
                      className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-green-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {triggerLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Running...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Run Now
                        </>
                      )}
                    </button>
                  )}

                  {/* Refresh Status Button */}
                  {campaign.n8nWorkflowId && (
                    <button
                      onClick={fetchWorkflowStatus}
                      disabled={workflowLoading}
                      className="bg-[#f5f5f7] text-[#1d1d1f] px-6 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      <svg className={`w-4 h-4 ${workflowLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Status
                    </button>
                  )}
                </div>

                {/* Flow Features */}
                <div className="mt-8 bg-[#f5f5f7] rounded-2xl p-5 max-w-lg mx-auto text-left">
                  <h4 className="font-medium text-[#1d1d1f] mb-3 text-sm">✨ Flow Builder Features</h4>
                  <ul className="text-sm text-[#86868b] space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#526bb0] rounded-full"></span>
                      Drag-and-drop workflow designer
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#01adbd] rounded-full"></span>
                      Pre-built nodes for email, delays, and conditions
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      One-click deployment to n8n
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Workflow Status & Execution History */}
            {campaign.n8nWorkflowId && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#86868b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Workflow Status
                </h3>

                {workflowLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#526bb0] border-t-transparent"></div>
                    <span className="ml-3 text-[#86868b] text-sm">Loading status...</span>
                  </div>
                ) : workflowStatus?.error ? (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm">
                    {workflowStatus.error}
                  </div>
                ) : workflowStatus ? (
                  <div className="space-y-4">
                    {/* Workflow Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-[#f5f5f7] rounded-xl p-4">
                        <div className="text-xs text-[#86868b] mb-1">Workflow Status</div>
                        <div className="text-sm font-medium flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            workflowStatus.isDeployed ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <span className={workflowStatus.isDeployed ? 'text-green-700' : 'text-[#86868b]'}>
                            {workflowStatus.isDeployed ? 'Deployed' : 'Not Deployed'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-[#f5f5f7] rounded-xl p-4">
                        <div className="text-xs text-[#86868b] mb-1">n8n Workflow ID</div>
                        <div className="text-sm font-medium font-mono text-[#526bb0]">
                          {workflowStatus.n8nWorkflowId || '-'}
                        </div>
                      </div>
                      <div className="bg-[#f5f5f7] rounded-xl p-4">
                        <div className="text-xs text-[#86868b] mb-1">Total Executions</div>
                        <div className="text-sm font-medium text-[#1d1d1f]">
                          {workflowStatus.executions?.length || 0}
                        </div>
                      </div>
                    </div>

                    {/* Execution History Table */}
                    {workflowStatus.executions && workflowStatus.executions.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-[#f5f5f7]">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-[#86868b] uppercase tracking-wider">
                                Execution ID
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-[#86868b] uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-[#86868b] uppercase tracking-wider">
                                Started At
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-[#86868b] uppercase tracking-wider">
                                Finished At
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-[#86868b] uppercase tracking-wider">
                                Mode
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {workflowStatus.executions.slice(0, 10).map((execution, index) => (
                              <tr key={execution.id || index} className="hover:bg-[#f5f5f7]/50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-[#526bb0]">
                                  {execution.id}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                    execution.status === 'success' || execution.finished
                                      ? 'bg-green-50 text-green-700'
                                      : execution.status === 'error' || execution.status === 'failed'
                                      ? 'bg-red-50 text-red-700'
                                      : execution.status === 'running'
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {execution.status || (execution.finished ? 'success' : 'unknown')}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-[#1d1d1f]">
                                  {execution.startedAt ? formatDate(execution.startedAt) : '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-[#1d1d1f]">
                                  {execution.stoppedAt ? formatDate(execution.stoppedAt) : '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-[#86868b]">
                                  {execution.mode || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {workflowStatus.executions.length > 10 && (
                          <p className="text-xs text-[#86868b] text-center py-3 bg-[#f5f5f7]">
                            Showing 10 of {workflowStatus.executions.length} executions
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-[#f5f5f7] rounded-xl p-8 text-center">
                        <p className="text-[#86868b] text-sm">No executions yet. Click "Run Now" to trigger the workflow.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#f5f5f7] rounded-xl p-8 text-center">
                    <p className="text-[#86868b] text-sm">Click "Refresh Status" to load workflow information</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'execution' && (
          <div className="space-y-6 animate-fadeInUp">
            {/* Progress Overview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[#1d1d1f] flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#86868b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Execution Progress
                  {campaign.status === 'running' && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 animate-pulse">
                      ● Running
                    </span>
                  )}
                </h3>
                <button
                  onClick={async () => { 
                    await fetchCampaign();
                    await fetchProgress(); 
                    await fetchExecutions(); 
                  }}
                  disabled={progressLoading || executionsLoading}
                  className="text-sm text-[#526bb0] hover:text-[#01adbd] flex items-center gap-1"
                >
                  <svg className={`w-4 h-4 ${progressLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              {progressLoading && !progress ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#526bb0] border-t-transparent"></div>
                </div>
              ) : progress ? (
                <div className="space-y-6">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#86868b]">Overall Progress</span>
                      <span className="font-medium text-[#1d1d1f]">{progress.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-[#f5f5f7] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500 ease-out bg-[#526bb0]"
                        style={{ width: `${progress.progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#f5f5f7] rounded-xl p-4 text-center">
                      <div className="text-xl font-semibold text-[#1d1d1f]">{(progress.totalRecipients || 0).toLocaleString()}</div>
                      <div className="text-xs text-[#86868b]">Total Recipients</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <div className="text-xl font-semibold text-blue-700">{(progress.processedCount || 0).toLocaleString()}</div>
                      <div className="text-xs text-[#86868b]">Processed</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <div className="text-xl font-semibold text-green-700">{(progress.successCount || 0).toLocaleString()}</div>
                      <div className="text-xs text-[#86868b]">Successful</div>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 text-center">
                      <div className="text-xl font-semibold text-red-700">{(progress.failedCount || 0).toLocaleString()}</div>
                      <div className="text-xs text-[#86868b]">Failed</div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {progress.scheduledAt && (
                      <div className="bg-[#f5f5f7] rounded-xl p-4">
                        <div className="text-xs text-[#86868b] mb-1">Scheduled At</div>
                        <div className="text-sm text-[#1d1d1f]">{formatDate(progress.scheduledAt)}</div>
                      </div>
                    )}
                    {progress.startedAt && (
                      <div className="bg-[#f5f5f7] rounded-xl p-4">
                        <div className="text-xs text-[#86868b] mb-1">Started At</div>
                        <div className="text-sm text-[#1d1d1f]">{formatDate(progress.startedAt)}</div>
                      </div>
                    )}
                    {progress.completedAt ? (
                      <div className="bg-[#f5f5f7] rounded-xl p-4">
                        <div className="text-xs text-[#86868b] mb-1">Completed At</div>
                        <div className="text-sm text-[#1d1d1f]">{formatDate(progress.completedAt)}</div>
                      </div>
                    ) : progress.estimatedCompletion && (
                      <div className="bg-[#f5f5f7] rounded-xl p-4">
                        <div className="text-xs text-[#86868b] mb-1">Est. Completion</div>
                        <div className="text-sm text-[#1d1d1f]">{formatDate(progress.estimatedCompletion)}</div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {campaign.status === 'running' && (
                      <button
                        onClick={handlePauseCampaign}
                        disabled={pauseResumeLoading}
                        className="bg-amber-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:bg-gray-300 flex items-center gap-2 text-sm"
                      >
                        {pauseResumeLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        Pause
                      </button>
                    )}

                    {campaign.status === 'paused' && (
                      <button
                        onClick={handleResumeCampaign}
                        disabled={pauseResumeLoading}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 flex items-center gap-2 text-sm"
                      >
                        {pauseResumeLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        Resume
                      </button>
                    )}

                    {progress.failedCount > 0 && (
                      <button
                        onClick={handleRetryFailed}
                        className="bg-orange-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center gap-2 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry Failed ({progress.failedCount})
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[#f5f5f7] rounded-xl p-8 text-center">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <svg className="w-6 h-6 text-[#86868b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-[#86868b] text-sm">No execution data yet. Start the campaign to see progress.</p>
                </div>
              )}
            </div>

            {/* Execution Records Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1d1d1f]">Execution Records</h3>
                <div className="flex items-center gap-3">
                  <select
                    value={executionFilter}
                    onChange={(e) => { setExecutionFilter(e.target.value); setExecutionPage(1); }}
                    className="px-3 py-2 bg-[#f5f5f7] border-0 rounded-xl focus:ring-2 focus:ring-[#526bb0] outline-none text-sm text-[#1d1d1f]"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              {executionsLoading && !executions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#526bb0] border-t-transparent"></div>
                </div>
              ) : executions?.data?.length > 0 ? (
                <>
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-[#f5f5f7]">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#86868b] uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#86868b] uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#86868b] uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#86868b] uppercase tracking-wider">
                            Attempts
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#86868b] uppercase tracking-wider">
                            Last Attempt
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {executions.data.map((execution) => (
                          <tr key={execution.id} className="hover:bg-[#f5f5f7]/50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-[#1d1d1f]">
                              {execution.email}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-[#86868b]">
                              {execution.name || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                execution.status === 'success'
                                  ? 'bg-green-50 text-green-700'
                                  : execution.status === 'failed'
                                  ? 'bg-red-50 text-red-700'
                                  : execution.status === 'processing'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {execution.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-[#86868b]">
                              {execution.attempts}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-[#86868b]">
                              {execution.processedAt ? formatDate(execution.processedAt) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {executions.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="text-sm text-[#86868b]">
                        Page {executions.page} of {executions.totalPages} ({executions.total} total)
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setExecutionPage(p => Math.max(1, p - 1))}
                          disabled={executionPage <= 1}
                          className="px-3 py-1.5 bg-[#f5f5f7] rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setExecutionPage(p => Math.min(executions.totalPages, p + 1))}
                          disabled={executionPage >= executions.totalPages}
                          className="px-3 py-1.5 bg-[#f5f5f7] rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-[#f5f5f7] rounded-xl p-8 text-center">
                  <p className="text-[#86868b] text-sm">No execution records found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-fadeInUp">
            <h3 className="text-lg font-semibold text-[#1d1d1f] mb-6">Campaign Performance</h3>
            
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-green-50 rounded-2xl p-6">
                <div className="text-sm text-green-700 mb-1">Delivery Rate</div>
                <div className="text-3xl font-semibold text-green-800">
                  {campaign.totalSent + campaign.totalFailed > 0
                    ? ((campaign.totalSent / (campaign.totalSent + campaign.totalFailed)) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
              <div className="bg-blue-50 rounded-2xl p-6">
                <div className="text-sm text-blue-700 mb-1">Success Rate</div>
                <div className="text-3xl font-semibold text-blue-800">
                  {campaign.totalUsersTargeted > 0
                    ? ((campaign.totalSent / campaign.totalUsersTargeted) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
              <div className="bg-red-50 rounded-2xl p-6">
                <div className="text-sm text-red-700 mb-1">Failure Rate</div>
                <div className="text-3xl font-semibold text-red-800">
                  {campaign.totalSent + campaign.totalFailed > 0
                    ? ((campaign.totalFailed / (campaign.totalSent + campaign.totalFailed)) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
            </div>

            {/* Additional Analytics Placeholder */}
            <div className="bg-[#f5f5f7] rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <svg className="w-8 h-8 text-[#526bb0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-[#1d1d1f] mb-2">Advanced Analytics</h4>
              <p className="text-[#86868b] text-sm max-w-md mx-auto">
                Detailed charts and insights including message delivery timeline, 
                engagement metrics, and geographic distribution.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
