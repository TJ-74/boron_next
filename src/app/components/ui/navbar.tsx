'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from "@/app/components/ui/button";
import { 
  Menu, 
  X, 
  User, 
  FileText, 
  Loader2, 
  ChevronDown,
  Settings,
  LogOut,
  Briefcase,
  BarChart3,
  Plus,
  Search
} from "lucide-react";
import logo from "@/app/images/logo-no-background.png";
import { useAuth } from '@/app/context/AuthContext';
import SearchProfiles from '@/app/components/SearchProfiles';
import Image from 'next/image';

interface NavbarProps {
  saveStatus?: 'idle' | 'saving' | 'success' | 'error';
}

export default function Navbar({ saveStatus }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if we're on a profile-related page
  const isProfilePage = pathname?.includes('/profile') || pathname?.includes('/search');

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
    router.push('/');
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsOpen(false);
    setIsProfileDropdownOpen(false);
  };

  return (
    <header className={`sticky top-0 z-50 w-full border-b transition-all duration-200 ${
      isScrolled 
        ? 'bg-gray-900/95 backdrop-blur-lg border-gray-700/50 shadow-lg' 
        : 'bg-gray-900 border-gray-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src={logo} 
              alt="Boron" 
              width={120} 
              height={32} 
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/search">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </Link>
            
            <Link href="/resume-generator">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
              >
                <FileText className="h-4 w-4 mr-2" />
                Resume
              </Button>
            </Link>

            <Link href="/profile/recruiter">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Post Job
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </nav>

          {/* Right Side: Save Status + Profile */}
          <div className="flex items-center space-x-4">
            {/* Save Status Indicator */}
            {saveStatus && saveStatus !== 'idle' && (
              <div className="hidden sm:block">
                {saveStatus === 'saving' && (
                  <div className="flex items-center text-sm text-amber-400">
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    <span className="text-xs">Saving...</span>
                  </div>
                )}
                {saveStatus === 'success' && (
                  <div className="flex items-center text-sm text-green-400">
                    <div className="h-2 w-2 bg-green-400 rounded-full mr-1.5"></div>
                    <span className="text-xs">Saved</span>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center text-sm text-red-400">
                    <div className="h-2 w-2 bg-red-400 rounded-full mr-1.5"></div>
                    <span className="text-xs">Error</span>
                  </div>
                )}
              </div>
            )}

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="Profile"
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                  ) : (
                    <User className="h-4 w-4 text-white" />
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {user?.displayName?.split(' ')[0] || 'Profile'}
                </span>
                <ChevronDown className="h-3 w-3" />
              </Button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">{user?.displayName || 'User'}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                  
                  <div className="py-1">
                    <button
                      onClick={() => handleNavigation('/profile')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <User className="h-4 w-4 mr-3" />
                      Your Profile
                    </button>
                    
                    <button
                      onClick={() => handleNavigation('/dashboard')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors md:hidden"
                    >
                      <BarChart3 className="h-4 w-4 mr-3" />
                      Dashboard
                    </button>
                    
                    <button
                      onClick={() => handleNavigation('/profile/recruiter')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors md:hidden"
                    >
                      <Plus className="h-4 w-4 mr-3" />
                      Post Job
                    </button>
                    
                    <button
                      onClick={() => handleNavigation('/resume-generator')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors md:hidden"
                    >
                      <FileText className="h-4 w-4 mr-3" />
                      Resume Generator
                    </button>
                    
                    <div className="border-t border-gray-700 my-1"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-700 bg-gray-900">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/search">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                  onClick={() => setIsOpen(false)}
                >
                  <Search className="h-4 w-4 mr-3" />
                  Search Profiles
                </Button>
              </Link>
              
              <Link href="/resume-generator">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                  onClick={() => setIsOpen(false)}
                >
                  <FileText className="h-4 w-4 mr-3" />
                  Resume Generator
                </Button>
              </Link>

              <Link href="/profile/recruiter">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                  onClick={() => setIsOpen(false)}
                >
                  <Plus className="h-4 w-4 mr-3" />
                  Post Job
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                  onClick={() => setIsOpen(false)}
                >
                  <BarChart3 className="h-4 w-4 mr-3" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
