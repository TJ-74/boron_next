'use client'
import React from 'react';
import { Navbar } from '@/app/components/ui/navbar';
import HeroSection from '@/app/components/homepage/home';
import FeaturesSection from '@/app/components/homepage/FeaturesSection';
import HowItWorksSection from '@/app/components/homepage/HowitWorks';
import CTASection from '@/app/components/homepage/CTASection';
import Footer from '@/app/components/homepage/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  );
};

