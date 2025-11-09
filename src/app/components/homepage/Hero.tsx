'use client'
import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Star, Zap, CheckCircle, TrendingUp } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-24 px-6 overflow-hidden">
      {/* Animated Background with Multiple Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
        
        {/* Diagonal Lines Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 35px,
              rgba(59, 130, 246, 0.3) 35px,
              rgba(59, 130, 246, 0.3) 37px
            )`
          }}></div>
        </div>
        
        {/* Dots Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, rgba(147, 51, 234, 0.4) 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}></div>
        </div>
        
        {/* Radial Gradient Overlays */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-blue-200/30 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-radial from-purple-200/30 via-transparent to-transparent"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute top-40 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-pink-400/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      
      {/* Geometric Shapes */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-blue-300/30 rounded-lg rotate-12 animate-spin-slow"></div>
      <div className="absolute bottom-1/3 right-1/4 w-24 h-24 border-2 border-purple-300/30 rounded-full animate-pulse"></div>
      <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-br from-pink-300/20 to-purple-300/20 rounded-lg rotate-45 animate-bounce-slow"></div>
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-700 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
              <Sparkles size={16} className="text-blue-600" />
              <span>AI-Powered Resume Builder</span>
              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">NEW</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
              <span className="block text-gray-900">Create Your</span>
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                Perfect Resume
              </span>
              <span className="block text-gray-900">In Minutes</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
              Build professional, ATS-friendly resumes with AI assistance. 
              Stand out from the crowd and land your dream job faster.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-200">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-sm font-medium text-gray-700">Free Forever</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-200">
                <Zap size={16} className="text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-200">
                <TrendingUp size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-700">ATS Optimized</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
              <Link 
                href="/signup" 
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl text-lg font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link 
                href="#features" 
                className="group px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-900 rounded-xl text-lg font-bold hover:bg-white transition-all duration-300 border-2 border-gray-300 hover:border-blue-500 hover:shadow-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  See How It Works
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </span>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white shadow-md"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white shadow-md"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-white shadow-md"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-white shadow-md flex items-center justify-center">
                    <span className="text-white text-xs font-bold">+150K</span>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-gray-900">150,000+ Happy Users</p>
                  <p className="text-gray-600">Join the community</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-200">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="font-bold text-gray-900">4.9/5</span>
                <span className="text-gray-600">rating</span>
              </div>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div className="relative lg:block hidden">
            <div className="relative">
              {/* Main Card */}
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-200 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    </div>
                  </div>
                  
                  {/* Content Lines */}
                  <div className="space-y-3 pt-4">
                    <div className="h-3 bg-gradient-to-r from-blue-200 to-blue-100 rounded"></div>
                    <div className="h-3 bg-gradient-to-r from-purple-200 to-purple-100 rounded w-5/6"></div>
                    <div className="h-3 bg-gradient-to-r from-pink-200 to-pink-100 rounded w-4/6"></div>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2 pt-4">
                    <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">React</div>
                    <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">Node.js</div>
                    <div className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-semibold">Python</div>
                  </div>
                </div>

                {/* AI Badge */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
                  <Sparkles size={16} />
                  <span className="font-bold text-sm">AI Enhanced</span>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-6 -left-6 bg-white rounded-lg shadow-xl p-4 border border-gray-200 animate-float">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={20} />
                  <span className="text-sm font-semibold text-gray-700">ATS Optimized</span>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-white rounded-lg shadow-xl p-4 border border-gray-200 animate-float animation-delay-2000">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-blue-500" size={20} />
                  <span className="text-sm font-semibold text-gray-700">85% Success Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(12deg); }
          to { transform: rotate(372deg); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) rotate(45deg); }
          50% { transform: translateY(-15px) rotate(45deg); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }
        
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        
        .bg-gradient-radial {
          background-image: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </section>
  );
};

export default Hero;
