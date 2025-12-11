'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './components/Sidebar';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [currentTime, setCurrentTime] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      
      if (hour < 12) setGreeting('Good morning');
      else if (hour < 17) setGreeting('Good afternoon');
      else setGreeting('Good evening');
      
      setCurrentTime(
        now.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#526bb0]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#526bb0] animate-spin"></div>
          </div>
          <p className="text-[#86868b] text-lg font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area - offset by sidebar width */}
      <div className="ml-64">
        {/* Top Navigation Bar */}
        <nav className="glass sticky top-0 z-30 border-b border-gray-200/50">
          <div className="px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h2 className="text-lg font-medium text-[#1d1d1f]">Dashboard</h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#86868b]">{user.email}</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="mb-16 animate-fade-in-up">
          <p className="text-[#86868b] text-sm font-medium mb-2">{currentTime}</p>
          <h1 className="text-5xl lg:text-6xl font-bold text-[#1d1d1f] tracking-tight mb-4">
            {greeting},<br />
            <span className="gradient-text">{user.name || 'Marketer'}</span>
          </h1>
          <p className="text-xl text-[#86868b] max-w-2xl">
            Your marketing command center. Create campaigns, manage segments, and reach your audience effectively.
          </p>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { label: 'Account', value: user.email, icon: '✉️', delay: '100' },
            { label: 'Role', value: user.role?.charAt(0).toUpperCase() + user.role?.slice(1), icon: '👤', delay: '200' },
            { label: 'User ID', value: `#${user.id}`, icon: '🔐', delay: '300' },
          ].map((stat, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover animate-fade-in-up animate-delay-${stat.delay}`}
              style={{ opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#86868b] text-sm font-medium mb-1">{stat.label}</p>
                  <p className="text-[#1d1d1f] text-lg font-semibold truncate max-w-[200px]">{stat.value}</p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Main Actions - Apple Card Style */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-8">Get Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Segments Card */}
            <button
              onClick={() => router.push('/dashboard/segments')}
              className="group relative bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-left card-hover overflow-hidden animate-fade-in-up animate-delay-100"
              style={{ opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#526bb0]/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#526bb0] to-[#6b7fd6] flex items-center justify-center mb-6 shadow-lg shadow-[#526bb0]/20">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-[#1d1d1f] mb-2 group-hover:text-[#526bb0] transition-colors">
                  Customer Segments
                </h3>
                <p className="text-[#86868b] leading-relaxed mb-4">
                  Upload and organize your target audience lists. Import CSV files with customer data for your campaigns.
                </p>
                <span className="inline-flex items-center text-[#526bb0] font-medium text-sm group-hover:translate-x-1 transition-transform">
                  Manage Segments
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </button>

            {/* Campaigns Card */}
            <button
              onClick={() => router.push('/dashboard/campaigns')}
              className="group relative bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-left card-hover overflow-hidden animate-fade-in-up animate-delay-200"
              style={{ opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#01adbd]/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#01adbd] to-[#5fcde0] flex items-center justify-center mb-6 shadow-lg shadow-[#01adbd]/20">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-[#1d1d1f] mb-2 group-hover:text-[#01adbd] transition-colors">
                  Campaigns
                </h3>
                <p className="text-[#86868b] leading-relaxed mb-4">
                  Create powerful marketing campaigns with visual flow builders. Schedule, automate, and track performance.
                </p>
                <span className="inline-flex items-center text-[#01adbd] font-medium text-sm group-hover:translate-x-1 transition-transform">
                  View Campaigns
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* Info Banner */}
        <section className="animate-fade-in-up animate-delay-300" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          <div className="bg-gradient-to-r from-[#526bb0]/5 via-white to-[#01adbd]/5 rounded-2xl p-8 border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#526bb0]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#526bb0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[#1d1d1f] font-semibold mb-1">Secure Authentication Active</h4>
                <p className="text-[#86868b] text-sm leading-relaxed">
                  Your session is protected with JWT authentication. All data transfers are encrypted and your credentials are securely stored.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-100 mt-16">
          <div className="py-8">
            <p className="text-center text-[#86868b] text-sm">
              © 2025 Campaignify. Built with precision for modern marketers.
            </p>
          </div>
        </footer>
      </main>
      </div>
    </div>
  );
}
