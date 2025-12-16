'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import logo from '@/app/images/logo-no-background.png';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'bg-slate-900/60 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-purple-500/10' 
        : 'bg-transparent border-b border-transparent'
    }`}>
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Image
              src={logo}
              alt="Boron Logo"
              width={120}
              height={32}
              className="h-8 w-auto object-contain transition-all duration-300 group-hover:scale-105 logo-image"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {/* Navigation Links */}
            <div className="flex items-center gap-1 mr-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-2 py-2">
              <Link 
                href="#features" 
                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 font-medium relative group"
              >
                Features
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-3/4 transition-all duration-300"></span>
              </Link>
              <Link 
                href="#pricing" 
                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 font-medium relative group"
              >
                Pricing
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-3/4 transition-all duration-300"></span>
              </Link>
              <Link 
                href="#about" 
                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 font-medium relative group"
              >
                About
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-3/4 transition-all duration-300"></span>
              </Link>
            </div>
            
            {/* Login Button - Glassmorphic */}
            <Link 
              href="/login" 
              className="px-6 py-2.5 text-gray-300 hover:text-white font-semibold transition-all duration-300 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 hover:bg-white/10"
            >
              Login
            </Link>
            
            {/* Get Started Button - Gradient with Glow */}
            <Link
              href="/register" 
              className="group relative px-6 py-2.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/60 transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation - Glassmorphic */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 animate-in slide-in-from-top duration-300">
            <Link 
              href="#features" 
              className="block text-gray-300 hover:text-white hover:bg-white/10 transition-all font-medium py-3 px-4 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="#pricing" 
              className="block text-gray-300 hover:text-white hover:bg-white/10 transition-all font-medium py-3 px-4 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="#about" 
              className="block text-gray-300 hover:text-white hover:bg-white/10 transition-all font-medium py-3 px-4 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <div className="pt-2 space-y-2 border-t border-white/10">
              <Link 
                href="/login" 
                className="block text-center px-6 py-3 text-gray-300 hover:text-white font-semibold transition-all duration-300 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/50 hover:shadow-xl transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                <Sparkles className="w-4 h-4" />
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;





