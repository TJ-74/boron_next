'use client'
import React from 'react';
import Link from 'next/link';

const HeroSection: React.FC = () => {
  return (
    <div className="relative container mx-auto px-4 py-56">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-20"
      >
        <source src="https://videos.pexels.com/video-files/2792370/2792370-hd_1920_1080_30fps.mp4" type="video/mp4" />
      </video>
      <div className="relative text-center animate-fade-in">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
          Build Your Professional Resume
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Create stunning resumes with AI assistance and professional templates. Stand out in your job search with ease.
        </p>
        <Link
          href="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 inline-block transform hover:scale-105"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
};

export default HeroSection; 