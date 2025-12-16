'use client'
import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Star, Zap, CheckCircle, TrendingUp, Brain, Rocket, Shield } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-24 px-6 overflow-hidden min-h-screen flex items-center">
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-8">
            {/* Badge - Glassmorphic */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 backdrop-blur-xl border border-white/20 rounded-full text-sm font-semibold shadow-lg shadow-purple-500/20">
              <div className="relative flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-400 animate-pulse" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                  AI-Powered Resume Builder
                </span>
                <span className="px-2.5 py-0.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs rounded-full animate-pulse">
                  NEW
                </span>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
              <span className="block text-white mb-2">Create Your</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 animate-gradient mb-2">
                Perfect Resume
              </span>
              <span className="block text-white">In Minutes</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Build professional, ATS-friendly resumes with <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-semibold">cutting-edge AI</span>. 
              Stand out from the crowd and land your dream job faster.
            </p>

            {/* Feature Pills - Glassmorphic */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 hover:border-green-500/50 transition-all duration-300 group">
                <CheckCircle size={16} className="text-green-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-gray-300">Free Forever</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 hover:border-yellow-500/50 transition-all duration-300 group">
                <Brain size={16} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-gray-300">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 hover:border-cyan-500/50 transition-all duration-300 group">
                <Rocket size={16} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-gray-300">ATS Optimized</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/register"
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-2xl text-lg font-bold shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/60 transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link 
                href="#features" 
                className="group px-8 py-4 bg-white/5 backdrop-blur-xl text-white rounded-2xl text-lg font-bold border-2 border-white/20 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300"
              >
                <span className="flex items-center justify-center gap-2">
                  See How It Works
                  <Sparkles className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                </span>
              </Link>
            </div>

            {/* Social Proof - Dark Mode */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-4">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="font-bold text-white">4.9/5</span>
                <span className="text-gray-400">rating</span>
              </div>
            </div>
          </div>

          {/* Right Content - Glassmorphic Cards */}
          <div className="relative lg:block hidden">
            <div className="relative">
              {/* Main Glassmorphic Card */}
              <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-purple-500/20 transform hover:scale-105 transition-all duration-500 group">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 rounded-2xl shadow-lg shadow-purple-500/50 flex items-center justify-center">
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded-lg w-3/4 mb-2 animate-pulse"></div>
                      <div className="h-3 bg-white/5 rounded-lg w-1/2 animate-pulse delay-75"></div>
                    </div>
                  </div>
                  
                  {/* Content Lines */}
                  <div className="space-y-3 pt-2">
                    <div className="h-3 bg-gradient-to-r from-purple-500/30 to-purple-500/10 rounded-lg backdrop-blur-sm"></div>
                    <div className="h-3 bg-gradient-to-r from-fuchsia-500/30 to-fuchsia-500/10 rounded-lg w-5/6 backdrop-blur-sm"></div>
                    <div className="h-3 bg-gradient-to-r from-cyan-500/30 to-cyan-500/10 rounded-lg w-4/6 backdrop-blur-sm"></div>
                  </div>

                  {/* Skills - Glassmorphic Pills */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <div className="px-4 py-2 bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 text-purple-300 rounded-full text-xs font-semibold">React</div>
                    <div className="px-4 py-2 bg-fuchsia-500/20 backdrop-blur-xl border border-fuchsia-500/30 text-fuchsia-300 rounded-full text-xs font-semibold">Node.js</div>
                    <div className="px-4 py-2 bg-cyan-500/20 backdrop-blur-xl border border-cyan-500/30 text-cyan-300 rounded-full text-xs font-semibold">Python</div>
                  </div>
                </div>

                {/* AI Badge - Floating */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white px-5 py-2.5 rounded-full shadow-xl shadow-orange-500/50 flex items-center gap-2 animate-bounce">
                  <Sparkles size={16} />
                  <span className="font-bold text-sm">AI Enhanced</span>
                </div>
              </div>

              {/* Floating Glassmorphic Cards */}
              <div className="absolute -top-6 -left-6 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-xl shadow-green-500/20 animate-float">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-400" size={20} />
                  <span className="text-sm font-semibold text-white">ATS Optimized</span>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-xl shadow-cyan-500/20 animate-float animation-delay-2000">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-cyan-400" size={20} />
                  <span className="text-sm font-semibold text-white">85% Success Rate</span>
                </div>
              </div>

              <div className="absolute top-1/2 -left-8 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-xl shadow-purple-500/20 animate-float animation-delay-1000">
                <div className="flex items-center gap-2">
                  <Shield className="text-purple-400" size={20} />
                  <span className="text-sm font-semibold text-white">Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default Hero;





