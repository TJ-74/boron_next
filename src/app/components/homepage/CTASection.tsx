'use client'
import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';

const CTASection: React.FC = () => {
  const benefits = [
    "Professional templates",
    "AI-powered suggestions",
    "ATS-friendly format",
  ];

  return (
    <div className="container mx-auto px-6 py-20 max-w-6xl">
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-xl p-8 md:p-12">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full filter blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400 rounded-full filter blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-left">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Build Your Resume?
            </h2>
            <p className="text-lg text-blue-100 mb-6">
              Join thousands of professionals who have landed their dream jobs.
            </p>
            <ul className="space-y-3 mb-6">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-blue-300" />
                  <span className="text-blue-100 text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="group inline-flex items-center bg-white text-blue-600 font-bold py-3 px-6 rounded-lg hover:bg-blue-50 transition duration-300"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="flex-1 flex justify-center max-w-sm">
            <div className="w-full bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Free Forever</h3>
                <p className="text-sm text-blue-100 mb-4">No credit card required</p>
                <Link
                  href="/signup"
                  className="block w-full bg-white text-blue-600 font-bold py-2 px-4 rounded-lg hover:bg-blue-50 transition duration-300"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTASection; 