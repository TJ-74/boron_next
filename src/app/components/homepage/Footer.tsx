'use client'
import React from 'react';
import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail, Sparkles } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-16 px-6 mt-20 border-t border-white/10">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-950/20 to-transparent pointer-events-none"></div>
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 text-3xl font-black text-white mb-4 group">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400">
                Boron
              </span>
              <Sparkles className="w-6 h-6 text-cyan-400 group-hover:animate-spin" />
            </Link>
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              Create professional, ATS-friendly resumes that get you noticed. 
              Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-semibold">cutting-edge AI</span> to help you land your dream job.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-11 h-11 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300 hover:scale-110 group"
                aria-label="Twitter"
              >
                <Twitter size={20} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-11 h-11 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center hover:bg-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:scale-110 group"
                aria-label="GitHub"
              >
                <Github size={20} className="text-gray-400 group-hover:text-purple-400 transition-colors" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-11 h-11 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300 hover:scale-110 group"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
              </a>
              <a 
                href="mailto:contact@boron.com"
                className="w-11 h-11 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 hover:scale-110 group"
                aria-label="Email"
              >
                <Mail size={20} className="text-gray-400 group-hover:text-cyan-400 transition-colors" />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-white font-bold mb-6 text-lg">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#features" className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Features
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/templates" className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Templates
                </Link>
              </li>
              <li>
                <Link href="/examples" className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Examples
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-white font-bold mb-6 text-lg">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {currentYear} <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-semibold">Boron</span>. All rights reserved.
          </p>
          <div className="flex gap-8 text-sm">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

