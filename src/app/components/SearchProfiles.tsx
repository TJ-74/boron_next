'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User } from 'lucide-react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Image from 'next/image';
import Link from 'next/link';

// Define the user search result interface
interface UserSearchResult {
  uid: string;
  name: string;
  title?: string;
  profileImage?: string;
  email?: string;
}

export default function SearchProfiles() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Searching for:", searchQuery);
      const response = await fetch(`/api/search-profiles?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      
      const data = await response.json();
      console.log("Search results received:", data);
      setResults(data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Debounce search input
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim()) {
        searchUsers(query);
      }
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [query]);
  
  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking inside the search container
      if (searchContainerRef.current && searchContainerRef.current.contains(event.target as Node)) {
        return;
      }
      
      // Close dropdown when clicking outside
      setShowResults(false);
    };
    
    // Add event listener with capture phase to handle clicks early
    document.addEventListener('mousedown', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, []);
  
  // Keep focus on input when dropdown is open
  useEffect(() => {
    if (showResults && inputRef.current) {
      // Give a slight delay to ensure the focus happens after any other events
      const focusTimer = setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
      
      return () => clearTimeout(focusTimer);
    }
  }, [showResults]);
  
  const handleSearchInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("Search input clicked, showing results");
    setShowResults(true);
    if (query.trim() && !results.length && !loading) {
      searchUsers(query);
    }
  };
  
  const handleSearchFocus = () => {
    console.log("Search input focused");
    setShowResults(true);
  };
  
  const handleViewProfile = (uid: string) => {
    console.log("Navigating to profile:", uid);
    router.push(`/profile/view/${uid}`);
    setShowResults(false);
  };
  
  const handleResultClick = (e: React.MouseEvent, uid: string) => {
    e.stopPropagation();
    e.preventDefault();
    handleViewProfile(uid);
  };
  
  return (
    <div className="relative" ref={searchContainerRef}>
      <div className="flex items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search profiles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={handleSearchInputClick}
            onFocus={handleSearchFocus}
            className="pl-10 pr-4 py-2 w-64 bg-gray-800 border-gray-700 text-gray-200 focus:ring-blue-500 focus:border-blue-500 rounded-md"
          />
        </div>
      </div>
      
      {showResults && (results.length > 0 || loading) && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-md shadow-lg overflow-hidden z-100">
          {loading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Searching...
            </div>
          ) : (
            <div>
              {results.map((user) => (
                <div 
                  key={user.uid}
                  className="flex items-center gap-3 p-3 hover:bg-gray-800 transition-colors cursor-pointer"
                  onMouseDown={(e) => handleResultClick(e, user.uid)}
                >
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
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 font-medium truncate">{user.name}</p>
                    {user.title && (
                      <p className="text-gray-400 text-sm truncate">{user.title}</p>
                    )}
                    <p className="text-gray-500 text-xs truncate">{user.email}</p>
                  </div>
                </div>
              ))}
              
              {results.length > 0 && (
                <div className="p-2 border-t border-gray-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-blue-400 hover:text-blue-300 hover:bg-gray-800"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      router.push('/search');
                      setShowResults(false);
                    }}
                  >
                    View all results
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 