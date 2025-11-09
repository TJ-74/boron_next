'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowRight } from 'lucide-react';
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg' 
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
              className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter brightness-0"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="#features" 
              className={`${isScrolled ? 'text-gray-600' : 'text-gray-800'} hover:text-blue-600 transition-colors font-medium relative group`}
            >
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              href="#pricing" 
              className={`${isScrolled ? 'text-gray-600' : 'text-gray-800'} hover:text-blue-600 transition-colors font-medium relative group`}
            >
              Pricing
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              href="#about" 
              className={`${isScrolled ? 'text-gray-600' : 'text-gray-800'} hover:text-blue-600 transition-colors font-medium relative group`}
            >
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            {/* Login Button */}
            <Link 
              href="/login" 
              className={`px-7 py-3 ${isScrolled ? 'text-gray-700' : 'text-gray-900'} hover:text-blue-600 font-semibold transition-all duration-300 rounded-xl border-2 ${isScrolled ? 'border-gray-300' : 'border-gray-400'} hover:border-blue-600 hover:bg-blue-50`}
            >
              Login
            </Link>
            
            {/* Get Started Button */}
            <Link 
              href="/signup" 
              className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2 text-base">
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden ${isScrolled ? 'text-gray-900' : 'text-gray-900'} transition-colors`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3 animate-in slide-in-from-top duration-200">
            <Link 
              href="#features" 
              className="block text-gray-600 hover:text-blue-600 transition-colors font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="#pricing" 
              className="block text-gray-600 hover:text-blue-600 transition-colors font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="#about" 
              className="block text-gray-600 hover:text-blue-600 transition-colors font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              href="/login" 
              className="block text-center px-7 py-3 text-gray-900 hover:text-blue-600 font-semibold transition-all duration-300 rounded-xl border-2 border-gray-400 hover:border-blue-600 hover:bg-blue-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </Link>
            <Link 
              href="/signup" 
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 mt-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
