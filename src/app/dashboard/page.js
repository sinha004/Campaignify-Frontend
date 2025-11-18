'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#cad6ec]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#526bb0] mx-auto"></div>
          <p className="mt-4 text-[#604e43]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#cad6ec]">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#041d36]">Dashboard</h1>
              <p className="text-sm text-[#604e43] mt-1">{currentTime}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-[#e51a3a] text-white rounded-md hover:bg-[#041d36] transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-[#526bb0] to-[#01adbd] rounded-lg shadow-lg p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {user.name || 'Marketer'}! 👋
          </h2>
          <p className="text-white/90">
            You&apos;re successfully logged in to your dashboard.
          </p>
        </div>

        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#604e43]">Email</h3>
              <span className="text-2xl">📧</span>
            </div>
            <p className="text-lg font-semibold text-[#041d36]">{user.email}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#604e43]">Role</h3>
              <span className="text-2xl">👤</span>
            </div>
            <p className="text-lg font-semibold text-[#041d36] capitalize">{user.role}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#604e43]">User ID</h3>
              <span className="text-2xl">🔑</span>
            </div>
            <p className="text-lg font-semibold text-[#041d36]">#{user.id}</p>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-[#041d36]">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#526bb0] hover:bg-[#526bb0]/10 transition text-left">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-medium text-[#041d36]">Analytics</h4>
                <p className="text-sm text-[#604e43] mt-1">View your marketing analytics</p>
              </button>

              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#526bb0] hover:bg-[#526bb0]/10 transition text-left">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-medium text-[#041d36]">Campaigns</h4>
                <p className="text-sm text-[#604e43] mt-1">Manage your campaigns</p>
              </button>

              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#526bb0] hover:bg-[#526bb0]/10 transition text-left">
                <div className="text-2xl mb-2">⚙️</div>
                <h4 className="font-medium text-[#041d36]">Settings</h4>
                <p className="text-sm text-[#604e43] mt-1">Update your preferences</p>
              </button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-[#01adbd]/10 border border-[#01adbd] rounded-lg p-6">
          <div className="flex items-start">
            <div className="text-2xl mr-4">ℹ️</div>
            <div>
              <h4 className="font-semibold text-[#041d36] mb-2">Authentication System Active</h4>
              <p className="text-sm text-[#604e43]">
                This dashboard is protected by JWT authentication. Your session is secure and will
                automatically expire after the token timeout period.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
