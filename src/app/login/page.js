'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');

      const result = await login(data.email, data.password);

      if (result.success) {
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      } else {
        setError(result.error);
        setIsLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      {/* Header */}
      <header className="py-6 px-8">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#526bb0] to-[#01adbd] flex items-center justify-center">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="text-lg font-semibold text-[#1d1d1f]">Campaignify</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Welcome Text */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-[#1d1d1f] tracking-tight mb-3">
              Welcome back
            </h1>
            <p className="text-lg text-[#86868b]">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1d1d1f] mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-3 bg-[#fafafa] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#526bb0] focus:border-transparent focus:bg-white outline-none transition-all text-[#1d1d1f] placeholder:text-[#aeaeb2]"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#1d1d1f] mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register('password')}
                  className="w-full px-4 py-3 bg-[#fafafa] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#526bb0] focus:border-transparent focus:bg-white outline-none transition-all text-[#1d1d1f] placeholder:text-[#aeaeb2]"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#1d1d1f] text-white font-medium rounded-xl hover:bg-[#526bb0] focus:outline-none focus:ring-2 focus:ring-[#526bb0] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-shine"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          {/* Sign Up Link */}
          <p className="text-center mt-8 text-[#86868b]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#526bb0] hover:text-[#1d1d1f] font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-8">
        <p className="text-center text-[#86868b] text-sm">
          © 2025 Campaignify. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
