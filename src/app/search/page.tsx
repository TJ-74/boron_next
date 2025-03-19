'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Search, User, Mail, MapPin, Briefcase, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Define the user search result interface
interface UserSearchResult {
  uid: string;
  name: string;
  email: string;
  title?: string;
  location?: string;
  profileImage?: string;
}

// Create a client component that uses search params
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search for users
  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/search-profiles?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      
      const data = await response.json();
      setResults(data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setError('An error occurred while searching. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial search on page load if query parameter exists
  useEffect(() => {
    if (initialQuery) {
      searchUsers(initialQuery);
    }
  }, [initialQuery]);
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchUsers(query);
    
    // Update URL with search query
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    router.push(`/search?${params.toString()}`);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-8">Search Profiles</h1>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                placeholder="Search by name, email, title, or location..."
                className="pl-10 pr-4 py-2 bg-gray-800 border-gray-700 text-white w-full rounded-lg"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </form>
        
        {/* Search Results */}
        <div className="bg-gray-800/50 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {initialQuery ? `Results for "${initialQuery}"` : 'Search Results'}
          </h2>
          
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="rounded-full bg-gray-700 h-12 w-12"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-36"></div>
                      <div className="h-3 bg-gray-700 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {initialQuery 
                ? 'No profiles found matching your search criteria.' 
                : 'Enter a search term to find profiles.'}
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((user) => (
                <div 
                  key={user.uid}
                  className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 hover:bg-gray-700/30 rounded-lg transition-colors"
                >
                  <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                    {user.profileImage ? (
                      <Image
                        src={user.profileImage}
                        alt={user.name}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full text-gray-400">
                        <User className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-xl text-white">{user.name}</h3>
                    {user.title && (
                      <p className="text-blue-400 flex items-center justify-center sm:justify-start gap-1 mb-1">
                        <Briefcase className="h-4 w-4 flex-shrink-0" />
                        <span>{user.title}</span>
                      </p>
                    )}
                    <p className="text-gray-300 flex items-center justify-center sm:justify-start gap-1 mb-1">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span>{user.email}</span>
                    </p>
                    {user.location && (
                      <p className="text-gray-400 flex items-center justify-center sm:justify-start gap-1">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{user.location}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 mt-2 sm:mt-0">
                    <Button
                      onClick={() => router.push(`/profile/view/${user.uid}`)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main page component with suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Loading Search...</h1>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
} 