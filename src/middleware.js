import { NextResponse } from 'next/server';

export function middleware(request) {
  // Middleware runs on server, can't access localStorage
  // Let client-side handle authentication redirects
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
