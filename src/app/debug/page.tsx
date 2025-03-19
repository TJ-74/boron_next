'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/app/components/ui/button";
import { ArrowLeft } from "lucide-react";
import DebugProfiles from '@/app/components/DebugProfiles';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function DebugPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Only allow access to this page if a user is logged in
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      setIsAuthorized(true);
    }
  }, [user, loading, router]);

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-gray-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link href="/profile">
            <Button variant="ghost" className="flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </Button>
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-6">Debug Tools</h1>
        <p className="text-gray-300 mb-8">
          This page allows you to debug the profile search functionality and view all profiles in the database.
        </p>
        
        <DebugProfiles />
        
        <div className="mt-12 border-t border-gray-800 pt-6 text-gray-400 text-sm">
          <p>Note: This page is only available in development mode.</p>
        </div>
      </div>
    </div>
  );
} 