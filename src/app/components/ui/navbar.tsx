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
  Home,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import logo from "@/app/images/logo-no-background.png";
import { useAuth } from '@/app/context/AuthContext';
import Image from 'next/image';

interface NavbarProps {
  saveStatus?: 'idle' | 'saving' | 'success' | 'error';
  isChatBotOpen?: boolean;
}

export default function Navbar({ saveStatus, isChatBotOpen = false }: NavbarProps) {
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-slate-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-purple-500/10' 
        : 'bg-transparent backdrop-blur-sm border-b border-white/5'
    }`}
    style={{
      marginRight: isChatBotOpen ? '480px' : '0',
      transition: 'margin-right 300ms ease-in-out'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
              <Image 
                src={logo} 
                alt="Boron" 
                width={140} 
                height={36} 
                className="h-9 w-auto object-contain transition-all duration-300 group-hover:scale-105 logo-image"
                priority
              />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            <Link href="/profile">
              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActivePath('/profile')
                    ? 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-purple-500/50'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <User className="h-4 w-4" />
                Profile
              </button>
            </Link>

            <Link href="/resume-generator">
              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActivePath('/resume-generator') 
                    ? 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-purple-500/50' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                AI Resume
              </button>
            </Link>

          </nav>

          {/* Right Side: Save Status + Profile */}
          <div className="flex items-center space-x-4">
            {/* Save Status Indicator - Enhanced */}
            {saveStatus && saveStatus !== 'idle' && (
              <div className="hidden sm:flex items-center">
                {saveStatus === 'saving' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl text-white rounded-xl border border-white/20">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-semibold">Saving...</span>
                  </div>
                )}
                {saveStatus === 'success' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 backdrop-blur-xl text-green-400 rounded-xl border border-green-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-semibold">Saved</span>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 backdrop-blur-xl text-red-400 rounded-xl border border-red-500/30">
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
                className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-200 group"
              >
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 p-0.5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-purple-500/50">
                    <div className="h-full w-full rounded-[10px] bg-slate-900 flex items-center justify-center overflow-hidden">
                      {user?.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="rounded-[10px] object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-gray-300" />
                      )}
                    </div>
                  </div>
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-slate-900"></div>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    {user?.displayName?.split(' ')[0] || 'Profile'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    isProfileDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </div>
              </button>

              {/* Dropdown Menu - Enhanced */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-purple-500/20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Info Header */}
                  <div className="px-5 py-4 bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-cyan-500/20 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 p-0.5">
                        <div className="h-full w-full rounded-[11px] bg-slate-900 flex items-center justify-center overflow-hidden">
                          {user?.photoURL ? (
                            <Image
                              src={user.photoURL}
                              alt="Profile"
                              width={48}
                              height={48}
                              className="rounded-[11px] object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-gray-300" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user?.displayName || 'User'}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => handleNavigation('/profile')}
                      className="flex items-center gap-3 w-full px-5 py-3 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
                    >
                      <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-purple-400" />
                      </div>
                      <span>Your Profile</span>
                    </button>
                    
                    <button
                      onClick={() => handleNavigation('/resume-generator')}
                      className="flex items-center gap-3 w-full px-5 py-3 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200 lg:hidden"
                    >
                      <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                      </div>
                      <span>AI Resume</span>
                    </button>
                    
                    <div className="my-2 mx-4 border-t border-white/10"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-5 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200"
                    >
                      <div className="h-8 w-8 rounded-lg bg-red-500/30 flex items-center justify-center">
                        <LogOut className="h-4 w-4 text-red-400" />
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
              className="lg:hidden p-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Enhanced */}
        {isOpen && (
          <div className="lg:hidden border-t border-white/10 bg-slate-800/95 backdrop-blur-xl py-4 animate-in slide-in-from-top duration-200">
            <div className="space-y-2">
              <Link href="/profile">
                <button
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isActivePath('/profile')
                      ? 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <User className="h-5 w-5" />
                  Profile
                </button>
              </Link>

              
              <Link href="/resume-generator">
                <button
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isActivePath('/resume-generator') 
                      ? 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white shadow-lg' 
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  Resume Generator
                </button>
              </Link>

            </div>
          </div>
        )}
      </div>
    </header>
  );
}
