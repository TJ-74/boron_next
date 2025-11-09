'use client'
import React from 'react';
import Header from '@/app/components/homepage/Header';
import Hero from '@/app/components/homepage/Hero';
import Features from '@/app/components/homepage/Features';
import Footer from '@/app/components/homepage/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
}
