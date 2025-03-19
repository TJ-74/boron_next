'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { User } from 'lucide-react';
import Image from 'next/image';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  title?: string;
  location?: string;
  profileImage?: string;
}

export default function DebugProfiles() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load all profiles for debugging
  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug-profiles');
      if (!response.ok) {
        throw new Error(`Error fetching profiles: ${response.status}`);
      }
      
      const data = await response.json();
      setProfiles(data.profiles || []);
    } catch (err) {
      console.error('Failed to load profiles:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Test search functionality
  const testSearch = async () => {
    setSearchLoading(true);
    setSearchError(null);
    
    try {
      const response = await fetch(`/api/search-profiles?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error(`Error searching profiles: ${response.status}`);
      }
      
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (err) {
      console.error('Failed to search profiles:', err);
      setSearchError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSearchLoading(false);
    }
  };

  // Load profiles on initial render
  useEffect(() => {
    loadProfiles();
  }, []);

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-xl p-6 mt-6">
      <h2 className="text-xl font-bold text-white mb-4">Debug Profiles</h2>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-900/50 text-red-200 p-3 rounded-md mb-4">
          Error: {error}
        </div>
      )}
      
      {/* Loading state */}
      {loading ? (
        <div className="text-gray-400 mb-4">Loading profiles...</div>
      ) : (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-2">Available Profiles ({profiles.length})</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto p-2">
              {profiles.map(profile => (
                <div key={profile.uid} className="bg-gray-700/40 rounded-lg p-3 flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                    {profile.profileImage ? (
                      <Image
                        src={profile.profileImage}
                        alt={profile.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full text-gray-400">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-200 font-medium">{profile.name}</p>
                    <p className="text-gray-400 text-sm">{profile.email}</p>
                    {profile.title && <p className="text-gray-400 text-xs">Title: {profile.title}</p>}
                    {profile.location && <p className="text-gray-400 text-xs">Location: {profile.location}</p>}
                  </div>
                </div>
              ))}
              
              {profiles.length === 0 && (
                <div className="text-gray-400 text-center py-4">
                  No profiles found in database.
                </div>
              )}
            </div>
          </div>
          
          {/* Test search functionality */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-2">Test Search</h3>
            <div className="flex gap-2 mb-4">
              <Input
                type="text"
                placeholder="Enter search query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-700/30 border-gray-600"
              />
              <Button 
                onClick={testSearch} 
                disabled={searchLoading || !searchQuery.trim()}
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            {/* Search error */}
            {searchError && (
              <div className="bg-red-900/50 text-red-200 p-3 rounded-md mb-4">
                Search Error: {searchError}
              </div>
            )}
            
            {/* Search results */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto p-2">
              <h4 className="text-md font-medium text-blue-400">
                Search Results ({searchResults.length})
              </h4>
              
              {searchResults.map(user => (
                <div key={user.uid} className="bg-blue-900/20 rounded-lg p-3 flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                    {user.profileImage ? (
                      <Image
                        src={user.profileImage}
                        alt={user.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full text-gray-400">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-200 font-medium">{user.name}</p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                    {user.title && <p className="text-gray-400 text-xs">Title: {user.title}</p>}
                  </div>
                </div>
              ))}
              
              {searchResults.length === 0 && searchQuery && !searchLoading && (
                <div className="text-gray-400 text-center py-4 bg-gray-700/30 rounded-lg">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button onClick={loadProfiles} variant="outline">
              Refresh Profiles
            </Button>
          </div>
        </>
      )}
    </div>
  );
} 