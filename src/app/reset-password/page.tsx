'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../lib/firebase';
import logo from "@/app/images/logo-no-background.png";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [email, setEmail] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Verify the reset code on mount
  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setError('Invalid or missing reset code. Please request a new password reset link.');
        setIsVerifying(false);
        return;
      }

      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setIsVerifying(false);
      } catch (err: any) {
        console.error('Error verifying reset code:', err);
        if (err.code === 'auth/expired-action-code') {
          setError('This password reset link has expired. Please request a new one.');
        } else if (err.code === 'auth/invalid-action-code') {
          setError('This password reset link is invalid or has already been used.');
        } else {
          setError('Failed to verify reset link. Please request a new password reset.');
        }
        setIsVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    setPasswordStrength(strength);
  }, [password]);

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!oobCode) {
      setError('Invalid reset code');
      return;
    }

    setIsLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else if (err.code === 'auth/expired-action-code') {
        setError('This reset link has expired. Please request a new one.');
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Animated Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />
          <div className="absolute top-1/4 -left-48 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 -right-48 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="relative z-10 text-center">
          <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-48 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Left Side - Reset Password Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center mb-8 group">
            <Image
              src={logo}
              alt="Boron Logo"
              width={140}
              height={40}
              className="h-10 w-auto object-contain logo-image"
              priority
            />
          </Link>

          {success ? (
            // Success State
            <div className="text-center">
              <div className="mb-6 mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/50">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">
                Password Reset Successful!
              </h1>
              <p className="text-lg text-gray-400 mb-8">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-xl font-bold shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/60 transition-all duration-300 hover:scale-[1.02]"
              >
                Go to Sign In
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : error && !email ? (
            // Error State (Invalid/Expired Link)
            <div className="text-center">
              <div className="mb-6 mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/50">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">
                Invalid Reset Link
              </h1>
              <p className="text-lg text-gray-400 mb-8">
                {error}
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-xl font-bold shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/60 transition-all duration-300 hover:scale-[1.02]"
              >
                Request New Link
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            // Reset Form
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-3">
                  Set New Password
                </h1>
                <p className="text-lg text-gray-400">
                  Create a strong password for <span className="font-semibold text-purple-400">{email}</span>
                </p>
              </div>

              {/* Reset Password Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      className="w-full pl-12 pr-12 py-3.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500 font-medium hover:border-white/20"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Password Strength</span>
                        <span className={`text-xs font-semibold ${
                          passwordStrength <= 1 ? 'text-red-400' : 
                          passwordStrength <= 3 ? 'text-yellow-400' : 
                          'text-green-400'
                        }`}>
                          {getStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className={`text-xs flex items-center gap-2 ${password.length >= 8 ? 'text-green-400' : 'text-gray-500'}`}>
                          <span className="w-1 h-1 rounded-full bg-current" />
                          At least 8 characters
                        </p>
                        <p className={`text-xs flex items-center gap-2 ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-green-400' : 'text-gray-500'}`}>
                          <span className="w-1 h-1 rounded-full bg-current" />
                          Upper and lowercase letters
                        </p>
                        <p className={`text-xs flex items-center gap-2 ${/\d/.test(password) ? 'text-green-400' : 'text-gray-500'}`}>
                          <span className="w-1 h-1 rounded-full bg-current" />
                          At least one number
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      className="w-full pl-12 pr-12 py-3.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500 font-medium hover:border-white/20"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Password Match Indicator */}
                  {confirmPassword && (
                    <p className={`mt-2 text-xs flex items-center gap-2 ${
                      password === confirmPassword ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {password === confirmPassword ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Passwords match
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          Passwords do not match
                        </>
                      )}
                    </p>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 backdrop-blur-xl border border-red-500/20 py-3 px-4 rounded-xl">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
                  className="w-full group relative px-6 py-3.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-xl font-bold shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/60 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        Reset Password
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </form>

              {/* Back to Login Link */}
              <p className="mt-8 text-center text-gray-400">
                Remember your password?{' '}
                <Link href="/login" className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 hover:from-purple-300 hover:to-cyan-300 transition-all">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right Side - Info/Branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-fuchsia-500/20 to-cyan-500/20" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white w-full">
          {/* Icon */}
          <div className="mb-8 bg-white/15 backdrop-blur-xl w-20 h-20 rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
            <Shield className="w-10 h-10" />
          </div>

          {/* Title */}
          <h2 className="text-4xl xl:text-5xl font-black mb-6 leading-tight">
            Secure Your Account
          </h2>

          {/* Description */}
          <div className="relative mb-8 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-xl">
            <p className="text-xl text-white/95 leading-relaxed mb-4">
              Your account security is our top priority. Create a strong, unique password to keep your resume data safe and secure.
            </p>
          </div>

          {/* Security Tips */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white/90 mb-3">Password Security Tips:</h3>
            {[
              'Use at least 8 characters with mixed case letters',
              'Include numbers and special characters',
              'Avoid common words or personal information',
              'Don\'t reuse passwords from other sites'
            ].map((tip, index) => (
              <div
                key={index}
                className="flex items-start gap-3 text-white/80"
              >
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

