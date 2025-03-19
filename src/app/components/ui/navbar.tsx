import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from "@/app/components/ui/button";
import { Menu, X } from "lucide-react";
import logo from "@/app/images/logo-no-background.png";
import { useAuth } from '@/app/context/AuthContext';
import SearchProfiles from '@/app/components/SearchProfiles';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

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

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Features", href: "#features" },
    { label: "Templates", href: "/templates" },
    { label: "Pricing", href: "#pricing" },
    { label: "About", href: "#about" },
  ];

  const handleNavigation = (href: string) => {
    if (href.startsWith('#')) {
      // Handle hash navigation for same page
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Handle route navigation
      router.push(href);
    }
    setIsOpen(false); // Close mobile menu after navigation
  };

  const handleProfileClick = () => {
    router.push('/profile');
    setIsOpen(false);
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-gray-900/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2"
          >
            <img 
              src={logo.src}
              alt="Boron Atom Logo" 
              className="h-6 sm:h-7 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.href)}
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
              >
                {item.label}
              </button>
            ))}
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Button
                    onClick={handleProfileClick}
                    variant="outline"
                    className="text-white hover:text-gray-200"
                  >
                    My Profile
                  </Button>
                  
                  {/* Search Profiles (Desktop) - only show on profile pages */}
                  {isProfilePage && <SearchProfiles />}
                  
                  <Button
                    onClick={logout}
                    variant="outline"
                    className="text-white hover:text-gray-200"
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => router.push('/login')}
                  variant="outline"
                  className="text-white hover:text-gray-200"
                >
                  Login
                </Button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-900 rounded-lg mt-2">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.href)}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md"
                >
                  {item.label}
                </button>
              ))}
              <div className="flex flex-col gap-2 px-3 pt-4 pb-2">
                <div className="flex flex-col items-center gap-2">
                  {user ? (
                    <>
                      <Button
                        onClick={handleProfileClick}
                        variant="outline"
                        className="w-full text-white hover:text-gray-200"
                      >
                        My Profile
                      </Button>
                      
                      {/* Search Profiles (Mobile) - only show on profile pages */}
                      {isProfilePage && (
                        <div className="w-full py-2">
                          <SearchProfiles />
                        </div>
                      )}
                      
                      <Button
                        onClick={logout}
                        variant="outline"
                        className="w-full text-white hover:text-gray-200"
                      >
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => router.push('/login')}
                      variant="outline"
                      className="w-full text-white hover:text-gray-200"
                    >
                      Login
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
