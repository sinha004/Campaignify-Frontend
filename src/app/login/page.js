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

      console.log('Attempting login with:', data.email);
      const result = await login(data.email, data.password);
      console.log('Login result:', result);

      if (result.success) {
        console.log('Login successful, redirecting to dashboard');
        // Use window.location for hard navigation after state is saved
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      } else {
        console.error('Login failed:', result.error);
        setError(result.error);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#cad6ec] to-[#5fcde0] px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#041d36]">Welcome Back</h1>
          <p className="text-[#604e43] mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#e51a3a]/10 border border-[#e51a3a] text-[#e51a3a] rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#041d36] mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#526bb0] focus:border-transparent outline-none transition text-[#041d36] placeholder:text-gray-400"
              placeholder="marketer@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#041d36] mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#526bb0] focus:border-transparent outline-none transition text-[#041d36] placeholder:text-gray-400"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#526bb0] text-white py-2 px-4 rounded-md hover:bg-[#041d36] focus:outline-none focus:ring-2 focus:ring-[#01adbd] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[#604e43]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#526bb0] hover:text-[#041d36] font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
