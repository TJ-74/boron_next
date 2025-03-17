'use client'

import React from 'react';
import { Edit, Bot, Layout } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Edit className="w-8 h-8 text-blue-400 group-hover:text-white transition-colors" />,
      title: "Smart Editor",
      description: "Intuitive interface with real-time preview.",
    },
    {
      icon: <Bot className="w-8 h-8 text-blue-400 group-hover:text-white transition-colors" />,
      title: "AI Assistant",
      description: "Get tailored suggestions to improve your content.",
    },
    {
      icon: <Layout className="w-8 h-8 text-blue-400 group-hover:text-white transition-colors" />,
      title: "Templates",
      description: "Choose from ATS-friendly professional templates.",
    },
  ];

  return (
    <div className="container mx-auto px-6 py-20 max-w-6xl">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
          Powerful Features
        </h2>
        <p className="text-lg text-gray-400 max-w-xl mx-auto">
          Everything you need to create a professional resume
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl hover:bg-blue-600 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-400 text-sm group-hover:text-gray-200">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturesSection; 