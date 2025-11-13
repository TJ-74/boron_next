'use client'
import React from 'react';
import Header from '@/app/components/homepage/Header';
import Hero from '@/app/components/homepage/Hero';
import Features from '@/app/components/homepage/Features';
import Footer from '@/app/components/homepage/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-48 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10">
      <Header />
      <Hero />
      <Features />
      <Footer />
      </div>
    </div>
  );
}
