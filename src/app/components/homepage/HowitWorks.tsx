'use client'
import React from 'react';
import { UserPlus, Layout, FileText, Download } from 'lucide-react';

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      icon: <UserPlus className="w-6 h-6" />,
      title: "Sign Up",
      text: "Create account in seconds",
    },
    {
      icon: <Layout className="w-6 h-6" />,
      title: "Choose",
      text: "Select your template",
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Fill",
      text: "Add your details",
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: "Download",
      text: "Get your resume",
    },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 py-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-lg text-gray-400">
            Four simple steps to your professional resume
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-cyan-300 transform -translate-y-1/2" />
          
          {steps.map((item, index) => (
            <div
              key={index}
              className="relative flex flex-col items-center"
            >
              <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full flex items-center justify-center mb-4 relative z-10">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold mb-1">{item.title}</h3>
              <p className="text-sm text-gray-400 text-center">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowItWorksSection; 