'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd]">
      <div className="text-center animate-fadeInUp">
        <div className="mb-6">
          <span className="text-3xl font-semibold text-[#1d1d1f]">Campaignify</span>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#526bb0] border-t-transparent mx-auto"></div>
        <p className="mt-4 text-[#86868b] text-sm">Redirecting...</p>
      </div>
    </div>
  );
}
