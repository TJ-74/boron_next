'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/app/components/ui/button";
import { Loader2 } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import logo from "@/app/images/logo-no-background.png";
import AuthRedirect from '../components/auth/AuthRedirect';

export default function SignUp() {
  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await signup(formData.email, formData.password);
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      await loginWithGoogle();
    } catch (err) {
      setError('Google sign in failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <AuthRedirect>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        {/* Header with Logo */}
        <header className="w-full py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex justify-center sm:justify-start">
            <Link href="/" className="flex items-center">
              <Image 
                src={logo} 
                alt="Logo" 
                width={150} 
                height={40} 
                className="h-8 w-auto"
              />
            </Link>
          </div>
        </header>

        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Create an Account
              </h2>
              <p className="mt-2 text-gray-400">
                Join us to start your journey
              </p>
            </div>

            {/* Sign Up Form */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
              {/* Google Sign In Button */}
              <div className="mb-6">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isGoogleLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-all duration-200"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <>
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800/50 text-gray-400">
                    Or sign up with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Creating account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800/50 text-gray-400">
                      Already have an account?
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700/50"
                    onClick={() => router.push('/login')}
                  >
                    Sign in instead
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-400">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </AuthRedirect>
  );
} 