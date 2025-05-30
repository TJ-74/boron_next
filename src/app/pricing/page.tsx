'use client';

import CheckoutButton from '../components/CheckoutButton';
import Navbar from '../components/ui/navbar';
import { Footer } from '../components/ui/footer';   

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
              Choose Your Path to Success
            </h1>
            <p className="mt-5 text-xl text-gray-300 max-w-2xl mx-auto">
              Start with a 3-day free trial, then only $12/month. No credit card required.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Free Plan */}
          <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
            <div className="px-6 py-8 sm:p-10">
              <div className="flex justify-between items-baseline">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Free Plan
                  </h2>
                  <p className="mt-2 text-gray-400">Basic features to get started</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-extrabold text-white">$0</p>
                  <p className="text-sm text-gray-400 mt-1">forever</p>
                </div>
              </div>
              <ul className="mt-8 space-y-4">
                {[
                  'Basic Resume Analysis',
                  'Standard Templates',
                  'Basic Job Search',
                  'Community Support',
                ].map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <p className="ml-3 text-base text-gray-300">{feature}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <button className="w-full bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors">
                  Get Started
                </button>
              </div>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-b from-blue-600 to-blue-700 rounded-2xl shadow-xl overflow-hidden transform scale-105">
            <div className="px-6 py-8 sm:p-10">
              <div className="flex justify-between items-baseline">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Premium Plan
                  </h2>
                  <p className="mt-2 text-blue-100">Full access to all features</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-extrabold text-white">$12</p>
                  <p className="text-sm text-blue-100 mt-1">per month</p>
                </div>
              </div>
              <div className="mt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-800 text-white">
                  3-day free trial
                </span>
              </div>
              <ul className="mt-8 space-y-4">
                {[
                  'Advanced AI Resume Analysis',
                  'Personalized Job Recommendations',
                  'Cover Letter Generation',
                  'Skills Assessment & Suggestions',
                  'Priority Support',
                  'Export to Multiple Formats',
                ].map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <p className="ml-3 text-base text-white">{feature}</p>
                  </li>
                ))}
              </ul>

              {/* Trial Info */}
              <div className="mt-8 bg-blue-800/50 rounded-lg p-4 text-sm text-white">
                <p className="flex items-center">
                  <svg className="h-5 w-5 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Try all features free for 3 days. No credit card required during trial.
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-8">
                <CheckoutButton />
              </div>

              {/* Money Back Guarantee */}
              <p className="mt-6 text-center text-sm text-blue-100">
                30-day money-back guarantee • Cancel anytime
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16">
          <div className="flex flex-col items-center space-y-8">
            <h3 className="text-lg font-medium text-gray-400">Trusted by professionals worldwide</h3>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="text-gray-400 flex items-center">
                <svg
                  className="h-6 w-6 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Secure payment</span>
              </div>
              <div className="text-gray-400 flex items-center">
                <svg
                  className="h-6 w-6 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>SSL encrypted</span>
              </div>
              <div className="text-gray-400 flex items-center">
                <svg
                  className="h-6 w-6 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 