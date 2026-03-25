'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './components/Sidebar';
import { Users, BarChart3, ArrowRight } from 'lucide-react';

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
        now.toLocaleDateString('en-US', {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading...</p>
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
            <h2 className="text-sm font-medium text-gray-900">Dashboard</h2>
            <span className="text-sm text-gray-400">{user.email}</span>
          </div>
        </header>

        <main className="px-6 py-8 max-w-5xl">
          {/* Greeting */}
          <section className="mb-10">
            <p className="text-xs text-gray-400 mb-1">{currentTime}</p>
            <h1 className="text-2xl font-semibold text-gray-900">
              {greeting}, {user.name || 'there'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Here&apos;s your marketing command center.
            </p>
          </section>

          {/* Quick actions */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/dashboard/segments')}
              className="group bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center mb-3">
                    <Users className="w-4.5 h-4.5 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Customer Segments</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Upload and manage your audience lists for targeted campaigns.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/campaigns')}
              className="group bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
                    <BarChart3 className="w-4.5 h-4.5 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Campaigns</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Create campaigns with visual flow builders. Schedule and track performance.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
              </div>
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}
