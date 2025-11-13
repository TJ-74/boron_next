'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Loader2, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, CheckCircle, Briefcase, TrendingUp, Award, Users, Quote } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import logo from "@/app/images/logo-no-background.png";
import AuthRedirect from '../components/auth/AuthRedirect';

// Slideshow data with realistic content
const slides = [
  {
    icon: Briefcase,
    title: "Professional Resume Building",
    description: "Create a professional resume that showcases your skills and experience effectively. Our AI-powered tools help you craft compelling content that stands out.",
    author: "Professional Tool",
    role: "Resume Builder",
    color: "from-purple-500 to-fuchsia-500"
  },
  {
    icon: TrendingUp,
    title: "Career Development",
    description: "Take control of your career journey with our comprehensive resume building platform. Build confidence with every application you submit.",
    author: "Career Platform",
    role: "Professional Development",
    color: "from-cyan-500 to-blue-500"
  },
  {
    icon: Award,
    title: "ATS Optimization",
    description: "Ensure your resume passes Applicant Tracking Systems with our built-in optimization features. Get your resume in front of hiring managers.",
    author: "Smart Technology",
    role: "Job Search Assistant",
    color: "from-orange-500 to-pink-500"
  },
  {
    icon: Users,
    title: "Join Our Community",
    description: "Be part of a growing community of job seekers who are taking their careers to the next level with professional resume tools.",
    author: "Community Platform",
    role: "Professional Network",
    color: "from-green-500 to-emerald-500"
  }
];

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Check for password reset success
  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setSuccessMessage('Password reset successful! You can now sign in with your new password.');
      // Clear the message after 5 seconds
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Automatic slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setError('Invalid email or password');
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

  const currentSlideData = slides[currentSlide];
  const SlideIcon = currentSlideData.icon;

  return (
    <AuthRedirect>
      <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Animated Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />
          <div className="absolute top-1/4 -left-48 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 -right-48 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        {/* Left Side - Login Form */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10">
          <div className="mx-auto w-full max-w-md">
            {/* Logo */}
            <Link href="/" className="flex items-center mb-8 group">
              <Image
                src={logo}
                alt="Boron Logo"
                width={140}
                height={40}
                className="h-10 w-auto object-contain logo-image"
              />
            </Link>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-3">
                Welcome back
              </h1>
              <p className="text-lg text-gray-400">
                Sign in to continue building amazing resumes
              </p>
            </div>

            {/* Google Sign In Button - Glassmorphic */}
            <button
              type="button"
              disabled={isGoogleLoading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white font-semibold hover:bg-white/10 hover:border-white/20 transition-all duration-300 mb-6"
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
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-950 text-gray-400 font-medium">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500 font-medium hover:border-white/20"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="w-full pl-12 pr-12 py-3.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500 font-medium hover:border-white/20"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300 font-medium">
                    Remember me
                  </label>
                </div>

                <Link href="/forgot-password" className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 backdrop-blur-xl border border-green-500/20 py-3 px-4 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                  {successMessage}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 backdrop-blur-xl border border-red-500/20 py-3 px-4 rounded-xl">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative px-6 py-3.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-xl font-bold shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/60 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </form>

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-gray-400">
              Don't have an account?{' '}
              <Link href="/register" className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 hover:from-purple-300 hover:to-cyan-300 transition-all">
                Sign up for free
              </Link>
            </p>

            {/* Footer */}
            <p className="mt-8 text-center text-sm text-gray-500">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-gray-400 hover:text-white font-medium transition-colors">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-gray-400 hover:text-white font-medium transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - Slideshow Showcase */}
        <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
          {/* Gradient Background with smoother transition */}
          <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.color} transition-all duration-[1500ms] ease-in-out opacity-90`}></div>
          
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
          </div>

          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white/15 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/15 rounded-full blur-3xl animate-pulse delay-700"></div>
            <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-white/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          {/* Content Container */}
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white w-full overflow-hidden">
            {/* Slideshow Content with slide animation */}
            <div
              key={currentSlide}
              className="animate-slideIn"
            >
              {/* Icon */}
              <div className="mb-8 bg-white/15 backdrop-blur-xl w-20 h-20 rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                <SlideIcon className="w-10 h-10" />
              </div>

              {/* Title */}
              <h2 className="text-4xl xl:text-5xl font-black mb-6 leading-tight">
                {currentSlideData.title}
              </h2>

              {/* Description with Quote */}
              <div className="relative mb-8 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-xl">
                <Quote className="w-8 h-8 text-white/50 mb-3" />
                <p className="text-xl text-white/95 leading-relaxed mb-4">
                  {currentSlideData.description}
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/30">
                  <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-xl flex items-center justify-center font-bold text-lg shadow-md">
                    {currentSlideData.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold">{currentSlideData.author}</p>
                    <p className="text-white/80 text-sm">{currentSlideData.role}</p>
                  </div>
                </div>
              </div>

              {/* Slide Indicators */}
              <div className="flex gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      index === currentSlide 
                        ? 'w-8 bg-white shadow-lg' 
                        : 'w-2 bg-white/50 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Success Metrics */}
              <div className="mt-12 pt-8 border-t border-white/30">
                <p className="text-white/90 text-sm mb-4">Professional resume building tools</p>
                <div className="flex flex-wrap gap-4">
                  {['Resume Builder', 'Career Tools', 'Job Search', 'Professional CV'].map((feature) => (
                    <div
                      key={feature}
                      className="px-4 py-2 bg-white/15 backdrop-blur-xl rounded-lg border border-white/30 text-sm font-semibold shadow-md"
                    >
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes slideIn {
          0% {
            opacity: 0;
            transform: translateX(100px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.8s ease-out forwards;
        }
      `}</style>
    </AuthRedirect>
  );
}
