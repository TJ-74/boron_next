'use client'
import React from 'react';
import { Sparkles, FileCheck, Zap, Shield, Download, Globe, Brain, Rocket, Lock, Layout, TrendingUp, Users } from 'lucide-react';

const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 px-6 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-sm font-semibold mb-6">
            <Zap size={16} className="text-yellow-400" />
            <span className="text-gray-300">Powerful Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
            Everything You Need to
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 mt-2">
              Land Your Dream Job
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Cutting-edge technology meets intuitive design to give you an unfair advantage in your job search.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
          {/* Large Feature Card - AI Powered (spans 2 columns) */}
          <div className="lg:col-span-2 lg:row-span-2 group">
            <div className="h-full bg-gradient-to-br from-purple-500/10 via-fuchsia-500/10 to-purple-500/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:border-purple-500/50 transition-all duration-500 hover:scale-[1.02] shadow-2xl shadow-purple-500/10 relative overflow-hidden">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/50">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">AI-Powered Intelligence</h3>
                <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                  Our advanced AI analyzes your experience and suggests optimal phrasing, keywords, and structure to make your resume stand out to both humans and ATS systems.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 text-purple-300 rounded-full text-xs font-semibold">Smart Suggestions</span>
                  <span className="px-3 py-1.5 bg-fuchsia-500/20 backdrop-blur-xl border border-fuchsia-500/30 text-fuchsia-300 rounded-full text-xs font-semibold">Content Optimization</span>
                  <span className="px-3 py-1.5 bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 text-purple-300 rounded-full text-xs font-semibold">Real-time Feedback</span>
                </div>
              </div>
            </div>
          </div>

          {/* ATS Optimized Card */}
          <div className="lg:col-span-1 group">
            <div className="h-full bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 hover:border-cyan-500/50 transition-all duration-500 hover:scale-[1.02] shadow-xl shadow-cyan-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/50">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">ATS Optimized</h3>
              <p className="text-gray-400 text-sm">
                Pass Applicant Tracking Systems with optimized formatting and keyword placement.
              </p>
            </div>
          </div>

          {/* Quick & Easy Card */}
          <div className="lg:col-span-1 group">
            <div className="h-full bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 hover:border-orange-500/50 transition-all duration-500 hover:scale-[1.02] shadow-xl shadow-orange-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/50">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Lightning Fast</h3>
              <p className="text-gray-400 text-sm">
                Create professional resumes in minutes with our intuitive interface.
              </p>
            </div>
          </div>

          {/* Multiple Templates Card (tall) */}
          <div className="lg:col-span-1 lg:row-span-2 group">
            <div className="h-full bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 hover:border-cyan-500/50 transition-all duration-500 hover:scale-[1.02] shadow-2xl shadow-cyan-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/50">
                <Layout className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Professional Templates</h3>
              <p className="text-gray-400 mb-6">
                Choose from dozens of beautifully designed templates optimized for every industry.
              </p>
              <div className="space-y-3">
                <div className="h-20 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-colors"></div>
                <div className="h-20 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-colors"></div>
                <div className="h-20 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-colors"></div>
              </div>
            </div>
          </div>

          {/* Secure Card */}
          <div className="lg:col-span-1 group">
            <div className="h-full bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 hover:border-green-500/50 transition-all duration-500 hover:scale-[1.02] shadow-xl shadow-green-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/50">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Secure & Private</h3>
              <p className="text-gray-400 text-sm">
                Your data is encrypted end-to-end. We never share your information.
              </p>
            </div>
          </div>

          {/* Export Options Card (wide) */}
          <div className="lg:col-span-2 group">
            <div className="h-full bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-500 hover:scale-[1.02] shadow-xl shadow-purple-500/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50 flex-shrink-0">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Multiple Export Formats</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Download in PDF, Word, or LaTeX. Compatible with every application system.
                  </p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 text-purple-300 rounded-lg text-xs font-semibold">PDF</span>
                    <span className="px-3 py-1.5 bg-pink-500/20 backdrop-blur-xl border border-pink-500/30 text-pink-300 rounded-lg text-xs font-semibold">DOCX</span>
                    <span className="px-3 py-1.5 bg-fuchsia-500/20 backdrop-blur-xl border border-fuchsia-500/30 text-fuchsia-300 rounded-lg text-xs font-semibold">LaTeX</span>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Community Card */}
          <div className="lg:col-span-1 group">
            <div className="h-full bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 hover:border-yellow-500/50 transition-all duration-500 hover:scale-[1.02] shadow-xl shadow-yellow-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-yellow-500/50">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Join 150K+ Users</h3>
              <p className="text-gray-400 text-sm">
                A thriving community of successful job seekers
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;




