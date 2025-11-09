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
  Search,
  Home,
  Sparkles,
  CheckCircle2,
  AlertCircle
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

  const isActivePath = (path: string) => pathname === path;

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-lg shadow-gray-200/50' 
        : 'bg-white border-b border-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Image 
                src={logo} 
                alt="Boron" 
                width={140} 
                height={36} 
                className="h-9 w-auto object-contain brightness-0 transition-all duration-300 group-hover:scale-105"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            <Link href="/">
              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActivePath('/') 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Home className="h-4 w-4" />
                Home
              </button>
            </Link>

            <Link href="/search">
              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActivePath('/search') 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </Link>
            
            <Link href="/resume-generator">
              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActivePath('/resume-generator') 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <FileText className="h-4 w-4" />
                Resume
              </button>
            </Link>

            <Link href="/profile/recruiter">
              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActivePath('/profile/recruiter') 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Plus className="h-4 w-4" />
                Post Job
              </button>
            </Link>

            <Link href="/dashboard">
              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActivePath('/dashboard') 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </button>
            </Link>
          </nav>

          {/* Right Side: Save Status + Profile */}
          <div className="flex items-center space-x-4">
            {/* Save Status Indicator - Enhanced */}
            {saveStatus && saveStatus !== 'idle' && (
              <div className="hidden sm:flex items-center">
                {saveStatus === 'saving' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-semibold">Saving...</span>
                  </div>
                )}
                {saveStatus === 'success' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-200 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-semibold">Saved</span>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl border border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-semibold">Error</span>
                  </div>
                )}
              </div>
            )}

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
              >
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-purple-500/30">
                    <div className="h-full w-full rounded-[10px] bg-white flex items-center justify-center overflow-hidden">
                      {user?.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="rounded-[10px] object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {user?.displayName?.split(' ')[0] || 'Profile'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                    isProfileDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </div>
              </button>

              {/* Dropdown Menu - Enhanced */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-gray-300/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Info Header */}
                  <div className="px-5 py-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5">
                        <div className="h-full w-full rounded-[11px] bg-white flex items-center justify-center overflow-hidden">
                          {user?.photoURL ? (
                            <Image
                              src={user.photoURL}
                              alt="Profile"
                              width={48}
                              height={48}
                              className="rounded-[11px] object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.displayName || 'User'}</p>
                        <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => handleNavigation('/profile')}
                      className="flex items-center gap-3 w-full px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
                    >
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <span>Your Profile</span>
                    </button>
                    
                    <button
                      onClick={() => handleNavigation('/dashboard')}
                      className="flex items-center gap-3 w-full px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 lg:hidden"
                    >
                      <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </div>
                      <span>Dashboard</span>
                    </button>
                    
                    <button
                      onClick={() => handleNavigation('/profile/recruiter')}
                      className="flex items-center gap-3 w-full px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 lg:hidden"
                    >
                      <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <Plus className="h-4 w-4 text-green-600" />
                      </div>
                      <span>Post Job</span>
                    </button>
                    
                    <button
                      onClick={() => handleNavigation('/resume-generator')}
                      className="flex items-center gap-3 w-full px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200 lg:hidden"
                    >
                      <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-orange-600" />
                      </div>
                      <span>Resume Generator</span>
                    </button>
                    
                    <div className="my-2 mx-4 border-t border-gray-200"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all duration-200"
                    >
                      <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <LogOut className="h-4 w-4 text-red-600" />
                      </div>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-200"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Enhanced */}
        {isOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white py-4 animate-in slide-in-from-top duration-200">
            <div className="space-y-2">
              <Link href="/">
                <button
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isActivePath('/') 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Home className="h-5 w-5" />
                  Home
                </button>
              </Link>

              <Link href="/search">
                <button
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isActivePath('/search') 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Search className="h-5 w-5" />
                  Search Profiles
                </button>
              </Link>
              
              <Link href="/resume-generator">
                <button
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isActivePath('/resume-generator') 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  Resume Generator
                </button>
              </Link>

              <Link href="/profile/recruiter">
                <button
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isActivePath('/profile/recruiter') 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Plus className="h-5 w-5" />
                  Post Job
                </button>
              </Link>

              <Link href="/dashboard">
                <button
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isActivePath('/dashboard') 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  Dashboard
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
