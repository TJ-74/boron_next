'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '../components/ui/navbar';
import { Footer } from '../components/ui/footer';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
            Thank You!
          </h1>
          <p className="mt-5 text-xl text-gray-300 max-w-2xl mx-auto">
            Your payment was successful. You now have access to all premium features.
          </p>
          <div className="mt-8">
            <a
              href="/profile"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-colors"
            >
              Go to Profile
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
} 