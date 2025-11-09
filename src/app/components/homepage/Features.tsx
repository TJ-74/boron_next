'use client'
import React from 'react';
import { Sparkles, FileCheck, Zap, Shield, Download, Globe } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition">
      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

const Features: React.FC = () => {
  const features = [
    {
      icon: <Sparkles size={24} />,
      title: 'AI-Powered Content',
      description: 'Get intelligent suggestions and recommendations to improve your resume content and make it stand out.',
    },
    {
      icon: <FileCheck size={24} />,
      title: 'ATS Optimized',
      description: 'Ensure your resume passes Applicant Tracking Systems with our built-in optimization tools.',
    },
    {
      icon: <Zap size={24} />,
      title: 'Quick & Easy',
      description: 'Create a professional resume in minutes, not hours. No design skills required.',
    },
    {
      icon: <Shield size={24} />,
      title: 'Secure & Private',
      description: 'Your data is encrypted and secure. We never share your personal information.',
    },
    {
      icon: <Download size={24} />,
      title: 'Multiple Formats',
      description: 'Download your resume in PDF, Word, or plain text format. Compatible with any application.',
    },
    {
      icon: <Globe size={24} />,
      title: 'Professional Templates',
      description: 'Choose from dozens of professionally designed templates that work for any industry.',
    },
  ];

  return (
    <section id="features" className="py-20 px-6 bg-gray-50">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to
            <span className="text-blue-600"> Succeed</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to help you create the perfect resume and land your dream job.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
