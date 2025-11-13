'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, Mail, ArrowRight, ArrowLeft, Shield, Lock, CheckCircle, RefreshCw } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import logo from "@/app/images/logo-no-background.png";

// Slideshow data for forgot password page
const slides = [
  {
    icon: Shield,
    title: "Secure Password Recovery",
    description: "Your account security is our top priority. We use industry-standard encryption to ensure your password reset is safe and secure.",
    author: "Security Platform",
    role: "Account Protection",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Lock,
    title: "Quick & Easy Reset",
    description: "Forgot your password? No worries! Enter your email and we'll send you a secure link to create a new password.",
    author: "Recovery System",
    role: "Password Management",
    color: "from-purple-500 to-fuchsia-500"
  },
  {
    icon: CheckCircle,
    title: "Email Verification",
    description: "Check your inbox for a password reset link. The link is valid for 1 hour to ensure your account stays secure.",
    author: "Verification Service",
    role: "Account Safety",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: RefreshCw,
    title: "Back to Building",
    description: "Once you reset your password, you'll be back to creating professional resumes and advancing your career in no time.",
    author: "Career Platform",
    role: "Resume Builder",
    color: "from-orange-500 to-pink-500"
  }
];

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Automatic slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const currentSlideData = slides[currentSlide];
  const SlideIcon = currentSlideData.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
      setEmail(''); // Clear the email field on success
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-48 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Left Side - Reset Password Form */}
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

          {/* Back to Login */}
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to login
          </Link>

          {!success ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-3">
                  Forgot password?
                </h1>
                <p className="text-lg text-gray-400">
                  No worries, we'll send you reset instructions.
                </p>
              </div>

              {/* Reset Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

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
                        Sending...
                      </>
                    ) : (
                      <>
                        Reset password
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="mb-6 mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                
                <h1 className="text-4xl font-bold text-white mb-3">
                  Check your email
                </h1>
                <p className="text-lg text-gray-400 mb-8">
                  We sent a password reset link to<br />
                  <span className="text-white font-semibold">{email}</span>
                </p>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-8">
                  <p className="text-gray-300 text-sm">
                    Didn't receive the email? Check your spam folder or{' '}
                    <button
                      onClick={() => setSuccess(false)}
                      className="text-purple-400 hover:text-purple-300 font-semibold"
                    >
                      try again
                    </button>
                  </p>
                </div>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-xl text-white rounded-xl font-semibold border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </div>
            </>
          )}

          {/* Sign Up Link */}
          {!success && (
            <p className="mt-8 text-center text-gray-400">
              Don't have an account?{' '}
              <Link href="/register" className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 hover:from-purple-300 hover:to-cyan-300 transition-all">
                Sign up for free
              </Link>
            </p>
          )}
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

            {/* Description */}
            <div className="relative mb-8 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-xl">
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

            {/* Security Info */}
            <div className="mt-12 pt-8 border-t border-white/30">
              <p className="text-white/90 text-sm mb-4">Your account is protected by</p>
              <div className="flex flex-wrap gap-4">
                {['256-bit Encryption', 'Secure Email', 'Time-Limited Links', 'Account Safety'].map((feature) => (
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
    </div>
  );
}

