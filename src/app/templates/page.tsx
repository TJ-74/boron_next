'use client';

import Navbar from '../components/ui/navbar';
import Image from 'next/image';
import { Footer } from '../components/ui/footer';

const templates = [
  {
    id: 1,
    name: 'Professional Classic',
    description: 'A clean, traditional design perfect for corporate roles',
    category: 'Professional',
    image: '/templates/classic.png',
    features: ['Clean typography', 'Traditional layout', 'Perfect for corporate roles'],
    premium: false,
  },
  {
    id: 2,
    name: 'Modern Minimalist',
    description: 'Contemporary design with plenty of white space',
    category: 'Modern',
    image: '/templates/minimalist.png',
    features: ['Modern typography', 'Ample white space', 'Creative industries'],
    premium: true,
  },
  {
    id: 3,
    name: 'Tech Innovator',
    description: 'Bold design for tech and startup roles',
    category: 'Tech',
    image: '/templates/tech.png',
    features: ['Bold sections', 'Tech-focused layout', 'Startup friendly'],
    premium: true,
  },
  {
    id: 4,
    name: 'Creative Artist',
    description: 'Expressive design for creative professionals',
    category: 'Creative',
    image: '/templates/creative.png',
    features: ['Unique layout', 'Visual hierarchy', 'Portfolio showcase'],
    premium: true,
  },
  {
    id: 5,
    name: 'Executive Suite',
    description: 'Sophisticated design for senior professionals',
    category: 'Executive',
    image: '/templates/executive.png',
    features: ['Elegant typography', 'Executive layout', 'Leadership roles'],
    premium: true,
  },
  {
    id: 6,
    name: 'Academic Scholar',
    description: 'Structured design for academic professionals',
    category: 'Academic',
    image: '/templates/academic.png',
    features: ['Publication focus', 'Research emphasis', 'Academic roles'],
    premium: false,
  },
];

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
              Professional Resume Templates
            </h1>
            <p className="mt-5 text-xl text-gray-300 max-w-2xl mx-auto">
              Choose from our collection of professionally designed templates to create your perfect resume
            </p>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {['All', 'Professional', 'Modern', 'Tech', 'Creative', 'Executive', 'Academic'].map((category) => (
            <button
              key={category}
              className="px-4 py-2 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors group"
            >
              {/* Template Image */}
              <div className="relative h-48 bg-gray-700 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/50 z-10"></div>
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  Template Preview
                </div>
              </div>

              {/* Template Info */}
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{template.name}</h3>
                    <p className="mt-1 text-sm text-gray-400">{template.category}</p>
                  </div>
                  {template.premium && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-800 text-blue-100">
                      Premium
                    </span>
                  )}
                </div>

                <p className="mt-3 text-gray-300">{template.description}</p>

                {/* Features */}
                <ul className="mt-4 space-y-2">
                  {template.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-400">
                      <svg
                        className="h-4 w-4 text-blue-500 mr-2"
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
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <div className="mt-6">
                  <button
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      template.premium
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {template.premium ? 'Use Template (Premium)' : 'Use Template'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Premium CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white">Want access to all premium templates?</h2>
          <p className="mt-4 text-gray-300">
            Upgrade to our Premium plan to unlock all templates and features
          </p>
          <a
            href="/pricing"
            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            View Pricing
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
} 