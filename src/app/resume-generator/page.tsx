'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Navbar from '../components/ui/navbar';
import { Button } from "@/app/components/ui/button";
import { Loader2, FileText, Printer, User, Send, Zap, MessageSquare, Download, X, Menu, Paperclip } from 'lucide-react';
import ChatHistory from '../components/resume/ChatHistory';
import ResumeCanvas from '../components/resume/ResumeCanvas';
import { getUserProfileSummary } from '@/app/lib/userProfileService';
import type { UserProfile } from '@/app/types/profile';
import Link from 'next/link';
import Image from 'next/image';
import logo from "@/app/images/logo-no-background.png";

export interface ResumeData {
  header: {
    name: string;
    title: string;
    location?: string; // User's location
    contact: {
      email: string;
      phone: string;
      linkedin: string;
      github: string;
      portfolio?: string; // Portfolio URL
    };
  };
  summary: string;
  skills: {
    [domain: string]: string[];
  };
  experience: Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    highlights: string[];
  }>;
  education: Array<{
    degree: string;
    school: string;
    location: string;
    startDate: string;
    endDate: string;
    gpa?: string;
    showDatesInResume?: boolean; // Optional: control whether dates are shown
  }>;
  projects: Array<{
    title: string;
    startDate: string;
    endDate: string;
    technologies?: string;
    projectUrl?: string;
    githubUrl?: string;
    highlights: string[];
  }>;
  certificates: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// ChatAPI message format
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Helper function to render markdown in messages
const renderMarkdown = (text: string) => {
  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, partIndex) => {
    // Handle code blocks
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.slice(3, -3).trim();
      return (
        <pre key={partIndex} className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-lg p-2 sm:p-3 my-1.5 sm:my-2 overflow-x-auto">
          <code className="text-xs sm:text-sm font-mono text-gray-300">{code}</code>
        </pre>
      );
    }
    
    // Split by newlines to handle lists
    const lines = part.split('\n');
    return lines.map((line, lineIndex) => {
      // Handle bullet points (• or -)
      if (line.trim().match(/^[•\-\*]\s/)) {
        const content = line.trim().replace(/^[•\-\*]\s/, '');
        return (
          <div key={`${partIndex}-${lineIndex}`} className="flex items-start gap-2 sm:gap-2 my-0.5 sm:my-1">
            <span className="text-purple-400 mt-1 text-xs sm:text-sm">•</span>
            <span className="text-xs sm:text-sm">{processInlineFormatting(content, `${partIndex}-${lineIndex}`)}</span>
          </div>
        );
      }
      
      // Handle numbered lists
      if (line.trim().match(/^\d+\.\s/)) {
        const match = line.trim().match(/^(\d+)\.\s(.+)$/);
        if (match) {
          return (
            <div key={`${partIndex}-${lineIndex}`} className="flex items-start gap-2 sm:gap-2 my-0.5 sm:my-1">
              <span className="text-purple-400 font-medium text-xs sm:text-sm">{match[1]}.</span>
              <span className="text-xs sm:text-sm">{processInlineFormatting(match[2], `${partIndex}-${lineIndex}`)}</span>
            </div>
          );
        }
      }
      
      // Regular line with inline formatting
      return (
        <div key={`${partIndex}-${lineIndex}`}>
          {processInlineFormatting(line, `${partIndex}-${lineIndex}`)}
        </div>
      );
    });
  });
};

// Helper to process inline formatting (bold, italic, code)
const processInlineFormatting = (text: string, keyPrefix: string) => {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let index = 0;
  
  // Regex patterns
  const patterns = [
    { regex: /\*\*(.+?)\*\*/g, render: (match: string, content: string, i: number) => 
      <strong key={`${keyPrefix}-bold-${i}`} className="font-bold">{content}</strong> },
    { regex: /__(.+?)__/g, render: (match: string, content: string, i: number) => 
      <strong key={`${keyPrefix}-bold2-${i}`} className="font-bold">{content}</strong> },
    { regex: /\*(.+?)\*/g, render: (match: string, content: string, i: number) => 
      <em key={`${keyPrefix}-italic-${i}`} className="italic">{content}</em> },
    { regex: /_(.+?)_/g, render: (match: string, content: string, i: number) => 
      <em key={`${keyPrefix}-italic2-${i}`} className="italic">{content}</em> },
    { regex: /`(.+?)`/g, render: (match: string, content: string, i: number) => 
      <code key={`${keyPrefix}-code-${i}`} className="bg-slate-800/50 backdrop-blur-xl border border-white/10 px-1 sm:px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono text-purple-400">{content}</code> },
  ];
  
  // Find all matches
  const matches: Array<{ start: number; end: number; element: React.ReactNode }> = [];
  
  patterns.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.regex);
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        element: pattern.render(match[0], match[1], match.index)
      });
    }
  });
  
  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);
  
  // Build elements array
  let lastEnd = 0;
  matches.forEach((match, i) => {
    // Skip overlapping matches
    if (match.start < lastEnd) return;
    
    // Add text before match
    if (match.start > lastEnd) {
      elements.push(text.slice(lastEnd, match.start));
    }
    
    // Add formatted element
    elements.push(match.element);
    lastEnd = match.end;
  });
  
  // Add remaining text
  if (lastEnd < text.length) {
    elements.push(text.slice(lastEnd));
  }
  
  return elements.length > 0 ? <>{elements}</> : text;
};

// Add this helper function before the ResumeGenerator component
const formatDate = (dateString?: string): string => {
  // Handle empty, null, undefined, or whitespace-only strings
  if (!dateString || dateString.trim() === '' || dateString === null || dateString === undefined) {
    return 'Present';
  }
  
  // If it's already 'Present', return as is
  if (dateString.toLowerCase().trim() === 'present') {
    return 'Present';
  }
  
  try {
    // Handle YYYY-MM format
    if (dateString.includes('-') && dateString.length <= 7) {
      const [year, month] = dateString.split('-');
      if (!year || !month || isNaN(parseInt(year)) || isNaN(parseInt(month))) {
        return 'Present';
      }
      const date = new Date(parseInt(year), parseInt(month) - 1);
      if (isNaN(date.getTime())) {
        return 'Present';
      }
      return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    }
    
    // Handle other date strings
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Present';
    }
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  } catch (e) {
    return 'Present';
  }
};


export default function ResumeGenerator() {
  const { user } = useAuth();
  const [jobDescription, setJobDescription] = useState('');
  const [resumeContent, setResumeContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'modern'>('classic');
  const [viewMode, setViewMode] = useState<'resume' | 'coverLetter'>('resume');
  const [coverLetterContent, setCoverLetterContent] = useState<string>('');
  
  // Function to get resume styles based on selected template
  const getResumeStyles = (template: 'classic' | 'modern') => {
    if (template === 'modern') {
      return `
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    
      .resume-preview-container {
        background: white;
        height: 100%;
        overflow-y: auto;
        padding: 1.5rem;
        display: flex;
        justify-content: center;
      }

      .resume-preview-container .resume-container {
        width: 100%;
      max-width: 8.5in;
      margin: 0 auto;
        padding: 0.3in 0.25in;
        background-color: white;
        font-family: 'Georgia', 'Garamond', serif;
        line-height: 1.2;
        color: #222;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
      }
      
      /* Multi-page specific styles */
      .resume-preview-container .resume-container {
        overflow: visible;
        height: auto;
        width: 100%;
        max-width: 8.5in;
        margin: 0 auto;
        padding: 0.3in 0.25in;
        background-color: white;
        font-family: 'Georgia', 'Garamond', serif;
        line-height: 1.2;
        color: #222;
      }
      
      /* Each section should have proper spacing for multi-page layout */
      .resume-preview-container .section {
        margin-bottom: 0.45rem;
        padding-bottom: 0.1rem;
        width: 100%;
        break-inside: avoid;
      }
      
      .resume-preview-container h1 {
        font-size: 1.5rem;
      font-weight: bold;
      text-align: center;
        margin-bottom: 0.3rem;
        color: #000;
        letter-spacing: 0.3px;
      }
      
      .resume-preview-container .title-separator {
        font-size: 1.5rem;
        font-weight: bold;
        color: #000;
        margin: 0 0.4rem;
      }
      
      .resume-preview-container .header-title {
        font-size: 1rem;
        font-weight: 600;
        color: #000;
      }
      
      .resume-preview-container h2 {
        font-weight: bold;
        font-size: 0.95rem;
        color: #0e6e55;
        margin-bottom: 0.15rem;
        margin-top: 0.4rem;
        padding-bottom: 0.15rem;
        border-bottom: 1.5px solid #0e6e55;
        text-align: left;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      
      .resume-preview-container .header {
      text-align: center;
        margin-bottom: 0.6rem;
        width: 100%;
        border-bottom: none;
    }
    
      .resume-preview-container .contact-info {
      display: flex;
      justify-content: center;
        flex-wrap: wrap;
        gap: 0.7rem;
        font-size: 0.75rem;
        color: #555;
        margin-bottom: 0.6rem;
        width: 100%;
      }
      
      .resume-preview-container .contact-item {
      display: flex;
      align-items: center;
        gap: 0.25rem;
    }
    
      .resume-preview-container .section-title {
      font-weight: bold;
        font-size: 0.95rem;
        color: #0e6e55;
        margin-bottom: 0.15rem;
        margin-top: 0.4rem;
        padding-bottom: 0.15rem;
        border-bottom: 1.5px solid #0e6e55;
        width: 100%;
      text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      
      .resume-preview-container .section-divider {
        display: none;
      }
      
      .resume-preview-container .content-indent {
        margin-left: 0.2rem;
        font-size: 0.8rem;
        line-height: 1.2;
        margin-bottom: 0.15rem;
        color: #000;
        width: 100%;
        break-inside: avoid;
      }
      
      .resume-preview-container .date-text {
        float: right;
        font-size: 0.75rem;
        color: #000;
        font-weight: 600;
      }
      
      .resume-preview-container .bullet-list {
        padding-left: 1.2rem;
        list-style-type: disc;
        margin-top: 0.1rem;
        margin-bottom: 0.15rem;
        line-height: 1.2;
        font-size: 0.8rem;
        width: 100%;
      }
      
      .resume-preview-container .entry-title {
        font-weight: 600;
        display: inline-block;
        margin-bottom: 0.1rem;
        font-size: 0.8rem;
        color: #000;
        width: 70%;
      }
      
      .resume-preview-container .skill-item {
        font-size: 0.75rem;
        margin-bottom: 0.1rem;
        color: #000;
        line-height: 1.3;
      }
      
      .resume-preview-container .icon {
        font-size: 0.7rem;
        margin-right: 0.2rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
      }
      
      .resume-preview-container .icon svg {
        width: 12px;
        height: 12px;
        stroke: currentColor;
      }
      
      .resume-preview-container a {
        color: #0e6e55;
        text-decoration: none;
        font-weight: 500;
      }
      
      .resume-preview-container a:hover {
        text-decoration: underline;
    }
    
    @media print {
      @page {
        size: letter;
          margin: 0.3in 0.25in;
          /* Hide default browser headers and footers */
          @top-left { content: none; }
          @top-center { content: none; }
          @top-right { content: none; }
          @bottom-left { content: none; }
          @bottom-center { content: none; }
          @bottom-right { content: none; }
        }

        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 8.5in !important;
          height: auto !important;
          min-height: 0 !important;
        }

        #print-wrapper {
          visibility: visible;
          position: relative !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: 8.5in !important;
          padding: 0 !important;
          margin: 0 auto !important;
          height: auto !important;
          min-height: 0 !important;
        }

        .resume-preview-container {
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 8.5in !important;
          height: auto !important;
          min-height: 0 !important;
        }

        .resume-container {
          box-shadow: none !important;
          padding: 0 0.08in !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 7.9in !important;
          height: auto !important;
          min-height: 0 !important;
        }

        .section {
          page-break-inside: auto !important;
          break-inside: auto !important;
          margin-bottom: 0.35rem !important;
          padding-bottom: 0.1rem !important;
        }

        .content-indent {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 0.15rem !important;
        }

        .bullet-list {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 0.15rem !important;
        }

        .header {
          page-break-after: avoid !important;
          break-after: avoid !important;
          margin-bottom: 0.35rem !important;
        }

        h2, .section-title {
          page-break-after: avoid !important;
          break-after: avoid !important;
          page-break-before: auto !important;
          break-before: auto !important;
        }

        /* Optimize spacing between sections */
        .section + .section {
          margin-top: 0.2rem !important;
        }

        /* Ensure content flows naturally */
        .resume-container > * {
          page-break-inside: auto !important;
          break-inside: auto !important;
        }

        /* Keep related content together */
        .entry-title, .date-text {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }

        /* Optimize list spacing */
        .bullet-list li {
          margin-bottom: 0.1rem !important;
        }

        /* Remove any fixed heights */
        * {
          height: auto !important;
          min-height: 0 !important;
        }

        /* Ensure proper content flow */
        .resume-container {
          display: block !important;
          float: none !important;
          position: static !important;
          overflow: visible !important;
        }
      }
    </style>`;
    }
    
    // Classic template
    return `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      .resume-preview-container {
        background: white;
        height: 100%;
        overflow-y: auto;
        padding: 1.5rem;
        display: flex;
        justify-content: center;
      }

      .resume-preview-container .resume-container {
        width: 100%;
        max-width: 8.5in;
        margin: 0 auto;
        padding: 0.3in 0.2in;
        background-color: white;
        font-family: 'Times New Roman', Times, serif;
        line-height: 1.15;
        color: #333;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
      }
      
      /* Multi-page specific styles */
      .resume-preview-container .resume-container {
        overflow: visible;
        height: auto;
        width: 100%;
        max-width: 8.5in;
        margin: 0 auto;
        padding: 0.3in 0.2in;
        background-color: white;
        font-family: 'Times New Roman', Times, serif;
        line-height: 1.15;
        color: #333;
      }
      
      /* Each section should have proper spacing for multi-page layout */
      .resume-preview-container .section {
        margin-bottom: 0.5rem;
        padding-bottom: 0.15rem;
        width: 100%;
        break-inside: avoid;
      }
      
      .resume-preview-container h1 {
        font-size: 1.5rem;
        font-weight: bold;
        text-align: center;
        margin-bottom: 0.35rem;
        color: #000;
      }
      
      .resume-preview-container .title-separator {
        font-size: 1.5rem;
        font-weight: bold;
        color: #000;
        margin: 0 0.4rem;
      }
      
      .resume-preview-container .header-title {
        font-size: 1rem;
        font-weight: 600;
        color: #000;
      }
      
      .resume-preview-container h2 {
        font-weight: bold;
        text-transform: uppercase;
        font-size: 1rem;
        color: #4B4B4B;
        letter-spacing: 0.05em;
        margin-bottom: 0.1rem;
        text-align: left;
      }
      
      .resume-preview-container a {
        color: #333;
        text-decoration: none;
      }
      
      .resume-preview-container a:hover {
        text-decoration: underline;
      }
      
      .resume-preview-container .header {
        text-align: center;
        margin-bottom: 0.65rem;
        width: 100%;
      }
      
      .resume-preview-container .contact-info {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 0.85rem;
        font-size: 0.75rem;
        color: #666;
        margin-bottom: 0.65rem;
        width: 100%;
      }
      
      .resume-preview-container .contact-item {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }
      
      .resume-preview-container .section-title {
        font-weight: bold;
        text-transform: uppercase;
        font-size: 1rem;
        color: #4B4B4B;
        letter-spacing: 0.05em;
        margin-bottom: 0.1rem;
        width: 100%;
      }
      
      .resume-preview-container .section-divider {
        border-bottom: 1px solid #000;
        margin: 0.1rem 0 0.2rem 0;
        width: 100%;
      }
      
      .resume-preview-container .content-indent {
        margin-left: 0.3rem;
        font-size: 0.8rem;
        line-height: 1.15;
        margin-bottom: 0.12rem;
        color: #000;
        width: 100%;
        break-inside: avoid;
      }
      
      .resume-preview-container .date-text {
        float: right;
        font-size: 0.75rem;
        color: #000;
      }
      
      .resume-preview-container .bullet-list {
        padding-left: 1.2rem;
        list-style-type: disc;
        margin-top: 0.08rem;
        line-height: 1.15;
        font-size: 0.8rem;
        width: 100%;
      }
      
      .resume-preview-container .entry-title {
        font-weight: normal;
        display: inline-block;
        margin-bottom: 0.08rem;
        font-size: 0.8rem;
        color: #000;
        width: 70%;
      }
      
      .resume-preview-container .skill-item {
        font-size: 0.75rem;
        margin-bottom: 0.08rem;
        color: #000;
      }
      
      .resume-preview-container .icon {
        font-size: 0.7rem;
        margin-right: 0.2rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
      }
      
      .resume-preview-container .icon svg {
        width: 12px;
        height: 12px;
        stroke: currentColor;
      }

      @media print {
        @page {
          size: letter;
          margin: 0.3in 0.2in;
          /* Hide default browser headers and footers */
          @top-left { content: none; }
          @top-center { content: none; }
          @top-right { content: none; }
          @bottom-left { content: none; }
          @bottom-center { content: none; }
          @bottom-right { content: none; }
        }

        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 8.5in !important;
          height: auto !important;
          min-height: 0 !important;
        }

        #print-wrapper {
          visibility: visible;
          position: relative !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: 8.5in !important;
          padding: 0 !important;
          margin: 0 auto !important;
          height: auto !important;
          min-height: 0 !important;
        }

        .resume-preview-container {
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 8.5in !important;
          height: auto !important;
          min-height: 0 !important;
        }

        .resume-container {
          box-shadow: none !important;
          padding: 0 0.05in !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 7.9in !important;
          height: auto !important;
          min-height: 0 !important;
        }

        .section {
          page-break-inside: auto !important;
          break-inside: auto !important;
          margin-bottom: 0.4rem !important;
          padding-bottom: 0.12rem !important;
        }

        .content-indent {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 0.12rem !important;
        }

        .bullet-list {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 0.12rem !important;
        }

        .header {
          page-break-after: avoid !important;
          break-after: avoid !important;
          margin-bottom: 0.4rem !important;
        }

        h2, .section-title {
          page-break-after: avoid !important;
          break-after: avoid !important;
          page-break-before: auto !important;
          break-before: auto !important;
        }

        .section-divider {
          margin: 0.05rem 0 0.12rem 0 !important;
        }

        /* Optimize spacing between sections */
        .section + .section {
          margin-top: 0.25rem !important;
        }

        /* Ensure content flows naturally */
        .resume-container > * {
          page-break-inside: auto !important;
          break-inside: auto !important;
        }

        /* Keep related content together */
        .entry-title, .date-text {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }

        /* Optimize list spacing */
        .bullet-list li {
          margin-bottom: 0.08rem !important;
        }

        /* Remove any fixed heights */
        * {
          height: auto !important;
          min-height: 0 !important;
        }

        /* Ensure proper content flow */
        .resume-container {
          display: block !important;
          float: none !important;
          position: static !important;
          overflow: visible !important;
        }
      }
    </style>
  `;
  };
  
  // Memoize resume styles to avoid recalculating on every render
  const resumeStyles = useMemo(() => getResumeStyles(selectedTemplate), [selectedTemplate]);
  
  // Chat interface states
  const [messages, setMessages] = useState<Message[]>([
    {
      text: `Hi ${user?.displayName || 'there'}! I'm your Resume Assistant. Share a job description with me and I'll create a tailored resume for you. You can also ask me to "generate a cover letter" once your resume is ready!`,
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiMessages, setApiMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi ${user?.displayName || 'there'}! I'm your Resume Assistant. Share a job description with me and I'll create a tailored resume for you. You can also ask me to "generate a cover letter" once your resume is ready!`,
    }
  ]);
  const [showResumeCanvas, setShowResumeCanvas] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState<Array<{
    id: string;
    title: string;
    timestamp: Date;
    messages: Message[];
    apiMessages: ChatMessage[];
    resumeData: ResumeData | null;
  }>>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea function
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  // Load chat sessions from localStorage on mount
  useEffect(() => {
    if (user?.uid) {
      const savedSessions = localStorage.getItem(`chat-sessions-${user.uid}`);
      if (savedSessions) {
        try {
          const parsed = JSON.parse(savedSessions);
          const sessions = parsed.map((s: any) => ({
            ...s,
            timestamp: new Date(s.timestamp),
            messages: s.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }))
          }));
          setChatSessions(sessions);
          // Set current session to the most recent one
          if (sessions.length > 0) {
            const latest = sessions[sessions.length - 1];
            setCurrentSessionId(latest.id);
            setMessages(latest.messages);
            setApiMessages(latest.apiMessages);
            setResumeData(latest.resumeData);
          }
        } catch (error) {
          console.error('Error loading chat sessions:', error);
        }
      } else {
        // Create initial session
        const initialSessionId = `session-${Date.now()}`;
        setCurrentSessionId(initialSessionId);
      }
    }
  }, [user?.uid]);

  // Save current session to localStorage
  useEffect(() => {
    if (user?.uid && currentSessionId && messages.length > 1) {
      const session = {
        id: currentSessionId,
        title: messages.find(m => m.sender === 'user')?.text.slice(0, 50) || 'New Chat',
        timestamp: new Date(),
        messages,
        apiMessages,
        resumeData
      };
      
      setChatSessions(prev => {
        const updated = prev.filter(s => s.id !== currentSessionId);
        updated.push(session);
        localStorage.setItem(`chat-sessions-${user.uid}`, JSON.stringify(updated));
        return updated;
      });
    }
  }, [messages, apiMessages, resumeData, currentSessionId, user?.uid]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Adjust textarea height when input value changes
    adjustTextareaHeight();
  }, [inputValue]);

  const formatResumeContent = (content: string) => {
    // Convert the raw content into properly structured HTML
    const sections = content.split('**').filter(Boolean);
    let formattedHtml = '<div class="resume-container">';
    
    let currentSection = '';
    sections.forEach((section, index) => {
      const trimmedSection = section.trim();
      
      if (index % 2 === 0) {
        // This is a section title
        currentSection = trimmedSection.toLowerCase();
        if (currentSection === 'john doe') {
          formattedHtml += `<div class="resume-header"><h1>${trimmedSection}</h1>`;
        } else if (currentSection === 'software engineer') {
          formattedHtml += `<div class="title">${trimmedSection}</div></div>`;
        } else {
          formattedHtml += `<div class="section"><div class="section-title">${trimmedSection}</div>`;
        }
      } else {
        // This is section content
        if (currentSection === 'technical skills' || currentSection === 'skills') {
          const skills = trimmedSection.split('*').filter(Boolean);
          formattedHtml += '<div class="skills-list">';
          skills.forEach(skill => {
            const [category, items] = skill.split(':').map(s => s.trim());
            if (items) {
              formattedHtml += `
                <div class="skill-category">
                  <span class="skill-category-title">${category}:</span>
                  <span class="skill-items">${items}</span>
                </div>`;
            }
          });
          formattedHtml += '</div>';
        } else if (currentSection === 'experience' || currentSection === 'projects') {
          const entries = trimmedSection.split('*').filter(Boolean);
          entries.forEach(entry => {
            const [title, ...bullets] = entry.split('+').map(s => s.trim());
            formattedHtml += `
              <div class="entry">
                <div class="entry-header">
                  <span class="entry-title">${title}</span>
                </div>
                <ul class="bullet-list">
                  ${bullets.map(bullet => `<li>${bullet}</li>`).join('')}
                </ul>
              </div>`;
          });
        } else {
          // For other sections, preserve the bullet points
          const items = trimmedSection.split('*').filter(Boolean);
          if (items.length > 1) {
            formattedHtml += '<ul class="bullet-list">';
            items.forEach(item => {
              formattedHtml += `<li>${item.trim()}</li>`;
            });
            formattedHtml += '</ul>';
          } else {
            formattedHtml += `<p>${trimmedSection}</p>`;
          }
        }
        formattedHtml += '</div>';
      }
    });
    
    formattedHtml += '</div>';
    return formattedHtml;
  };

  // Function to save resume and chat data
  const saveResumeData = async (resumeData: ResumeData, chatHistory: Message[]) => {
    if (!user?.uid) return;
    
    try {
      setSaveStatus('saving');
      
      // Convert Message[] to ChatMessage[] format for API
      const apiChatHistory = chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.text,
        timestamp: msg.timestamp.toISOString()
      }));

      const response = await fetch('/api/resume-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          jobDescription,
          resumeData,
          chatHistory: apiChatHistory,
        }),
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        throw new Error('Failed to save resume');
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Function to load saved resume and chat data
  const loadSavedData = async () => {
    if (!user?.uid) return;
    
    try {
      const response = await fetch(`/api/resume-save?uid=${user.uid}`);
      
      if (response.ok) {
        const { data } = await response.json();
        
        // Load resume data
        if (data.resumeData) {
          setResumeData(data.resumeData);
        }
        
        // Load job description
        if (data.jobDescription) {
          setJobDescription(data.jobDescription);
        }
        
        // Load chat history
        if (data.chatHistory && data.chatHistory.length > 0) {
          const loadedMessages: Message[] = data.chatHistory.map((msg: any) => ({
            text: msg.content,
            sender: msg.role === 'user' ? 'user' : 'bot',
            timestamp: new Date(msg.timestamp || Date.now()),
          }));
          
          // Merge with initial bot message if no bot messages exist
          const hasInitialBotMessage = loadedMessages.some(msg => msg.sender === 'bot');
          if (!hasInitialBotMessage) {
            const initialMessage: Message = {
              text: `Hi ${user?.displayName || 'there'}! I'm your Resume Assistant. Share a job description with me and I'll create a tailored resume for you. You can also ask me to "generate a cover letter" once your resume is ready!`,
              sender: 'bot',
              timestamp: new Date(),
            };
            setMessages([initialMessage, ...loadedMessages]);
          } else {
            setMessages(loadedMessages);
          }
          
          // Update API messages too
          const apiMessages: ChatMessage[] = data.chatHistory.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          }));
          setApiMessages(apiMessages);
        }
        
        console.log('Resume data loaded successfully');
      } else if (response.status !== 404) {
        // Only log error if it's not a "not found" error (which is expected for new users)
        console.error('Failed to load saved resume data');
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  // Fetch user profile and saved data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;
      
      try {
        // Fetch profile
        const savedProfile = await getUserProfileSummary(user.uid);
        if (savedProfile) {
          // Convert UserProfileSummary to UserProfile by ensuring all required fields have values
          setProfile({
            uid: user.uid,  // Add user ID for database lookups
            name: savedProfile.name,
            email: savedProfile.email,
            profileImage: savedProfile.profileImage || '',
            phone: savedProfile.phone || '',
            location: savedProfile.location || '',
            title: savedProfile.title || '',
            linkedinUrl: savedProfile.linkedinUrl || '',
            githubUrl: savedProfile.githubUrl || '',
            portfolioUrl: savedProfile.portfolioUrl || '',
            about: savedProfile.about || '',
            experiences: savedProfile.experiences || [],
            education: savedProfile.education || [],
            skills: savedProfile.skills || [],
            projects: savedProfile.projects || [],
            certificates: savedProfile.certificates || []
          });
        }

        // Load saved resume and chat data
        await loadSavedData();
        
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const generateCoverLetter = async (jobDesc: string, currentResumeData: ResumeData) => {
    try {
      // Add a message that cover letter is being generated
      setMessages((prev) => [
        ...prev,
        {
          text: '📝 Generating cover letter based on your resume and job description...',
          sender: 'bot' as const,
          timestamp: new Date(),
        },
      ]);

      const response = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: jobDesc,
          resumeData: currentResumeData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover letter');
      }

      const result = await response.json();
      setCoverLetterContent(result.coverLetter);
      
      // Auto-switch to cover letter view and open canvas
      setViewMode('coverLetter');
      setShowResumeCanvas(true);
      
      // Add success message
      setMessages((prev) => [
        ...prev,
        {
          text: '✅ Cover letter generated! I\'ve opened it in the canvas for you. You can switch between "Resume" and "Cover Letter" tabs to view both.',
          sender: 'bot' as const,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Error generating cover letter:', error);
      setMessages((prev) => [
        ...prev,
        {
          text: '❌ Failed to generate cover letter. Please try again.',
          sender: 'bot' as const,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    // Add user message to UI
    setMessages((prev) => [...prev, userMessage]);
    
    // Add user message to API message history
    const newUserApiMessage: ChatMessage = {
      role: 'user',
      content: inputValue
    };
    
    // Update API messages
    const updatedApiMessages = [...apiMessages, newUserApiMessage];
    setApiMessages(updatedApiMessages);
    
    // Clear input and show typing indicator
    setInputValue('');
    setIsTyping(true);

    try {
      // Check if user is asking for cover letter
      const coverLetterKeywords = ['cover letter', 'coverletter', 'generate cover letter', 'write cover letter', 'create cover letter', 'write a cover letter'];
      const isCoverLetterRequest = coverLetterKeywords.some(keyword => 
        inputValue.toLowerCase().includes(keyword)
      );

      if (isCoverLetterRequest) {
        // Handle cover letter generation
        if (!resumeData) {
          setMessages((prev) => [
            ...prev,
            {
              text: '❌ Please generate a resume first before requesting a cover letter. Share a job description to get started!',
              sender: 'bot' as const,
              timestamp: new Date(),
            },
          ]);
          setIsTyping(false);
          return;
        }

        // Check if there's a job description in the message or previous context
        let jobDesc = inputValue.length > 100 ? inputValue : jobDescription;
        
        if (!jobDesc || jobDesc.length < 50) {
          setMessages((prev) => [
            ...prev,
            {
              text: '📝 Please provide a job description so I can create a tailored cover letter. You can paste the JD in your next message or include it with "generate cover letter for: [job description]"',
              sender: 'bot' as const,
              timestamp: new Date(),
            },
          ]);
          setIsTyping(false);
          return;
        }

        await generateCoverLetter(jobDesc, resumeData);
        setIsTyping(false);
        return;
      }
      // Use the intelligent chat handler
      const response = await fetch('/api/resume-chat-handler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          profile,
          currentResume: resumeData,
          conversationHistory: updatedApiMessages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process message');
      }

      const chatResult = await response.json();

      // Handle different response types
      if (chatResult.type === 'generate_new_resume' && chatResult.action === 'trigger_coordinator') {
        // Show todo list message first
        setMessages((prev) => [
          ...prev,
          {
            text: chatResult.message,
            sender: 'bot' as const,
            timestamp: new Date(),
          },
        ]);
        setApiMessages([...updatedApiMessages, {
          role: 'assistant',
          content: chatResult.message
        }]);

        // Extract job description and trigger full generation
        await handleGenerateResume(userMessage.text);
        return;
      }

      // For edits or general answers, show the response
      setMessages((prev) => {
        const updatedMessages = [
          ...prev,
          {
            text: chatResult.message,
            sender: 'bot' as const,
            timestamp: new Date(),
          },
        ];

        // Save chat periodically
        if (updatedMessages.length % 4 === 0 && user?.uid && resumeData) {
          setTimeout(() => {
            saveResumeData(resumeData, updatedMessages);
          }, 100);
        }

        return updatedMessages;
      });
      
      setApiMessages([...updatedApiMessages, {
        role: 'assistant',
        content: chatResult.message
      }]);

      // If there's an updated resume, apply it
      if (chatResult.updatedResume) {
        setResumeData(chatResult.updatedResume);
        
        // Auto-open resume canvas on edit
        if (chatResult.requiresAction) {
          setShowResumeCanvas(true);
        }
        
        // Save the updated resume
        if (user?.uid) {
          // Convert messages to chatHistory format
          const apiChatHistory = [...updatedApiMessages, {
            role: 'assistant' as const,
            content: chatResult.message
          }].map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date().toISOString()
          }));

          const saveResponse = await fetch('/api/resume-save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user.uid,
              jobDescription: jobDescription || '',
              resumeData: chatResult.updatedResume,
              chatHistory: apiChatHistory,
            }),
          });

          if (!saveResponse.ok) {
            const errorData = await saveResponse.json().catch(() => ({}));
            console.error('Failed to save resume:', errorData);
          }
        }
      }
      
    } catch (error) {
      console.error('Error getting response:', error);
      
      // Fallback response
      const fallbackResponse = "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or feel free to paste your job description and I'll help you create a tailored resume.";
      setMessages((prev) => {
        const updatedMessages = [
          ...prev,
          {
            text: fallbackResponse,
            sender: 'bot' as const,
            timestamp: new Date(),
          },
        ];

        // Save chat data even for fallback responses
        if (user?.uid && resumeData) {
          setTimeout(() => {
            saveResumeData(resumeData, updatedMessages);
          }, 100);
        }

        return updatedMessages;
      });
      
      // Add fallback response to API message history
      setApiMessages([...updatedApiMessages, {
        role: 'assistant',
        content: fallbackResponse
      }]);
      
    } finally {
      setIsTyping(false);
    }
  };

  // Create new chat session
  const createNewChat = () => {
    const newSessionId = `session-${Date.now()}`;
    setCurrentSessionId(newSessionId);
    setMessages([{
      text: `Hi ${user?.displayName || 'there'}! I'm your Resume Assistant. Share a job description with me and I'll create a tailored resume for you. You can also ask me to "generate a cover letter" once your resume is ready!`,
      sender: 'bot',
      timestamp: new Date(),
    }]);
    setApiMessages([{
      role: 'assistant',
      content: `Hi ${user?.displayName || 'there'}! I'm your Resume Assistant. Share a job description with me and I'll create a tailored resume for you. You can also ask me to "generate a cover letter" once your resume is ready!`,
    }]);
    setResumeData(null);
    setCoverLetterContent('');
    setViewMode('resume');
    setShowResumeCanvas(false);
  };

  // Switch to a different chat session
  const switchChatSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      console.log('Switching to session:', sessionId, session);
      setCurrentSessionId(session.id);
      setMessages(session.messages);
      setApiMessages(session.apiMessages);
      setResumeData(session.resumeData);
      setShowResumeCanvas(false);
      setInputValue('');
      // Scroll to bottom after loading messages
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Show delete confirmation modal
  const deleteChatSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setShowDeleteConfirm(true);
  };

  // Actually delete the chat session after confirmation
  const confirmDeleteSession = () => {
    if (user?.uid && sessionToDelete) {
      const updated = chatSessions.filter(s => s.id !== sessionToDelete);
      setChatSessions(updated);
      localStorage.setItem(`chat-sessions-${user.uid}`, JSON.stringify(updated));
      
      // If deleted session was current, switch to most recent or create new
      if (sessionToDelete === currentSessionId) {
        if (updated.length > 0) {
          const latest = updated[updated.length - 1];
          switchChatSession(latest.id);
        } else {
          createNewChat();
        }
      }
    }
    setShowDeleteConfirm(false);
    setSessionToDelete(null);
  };

  // Cancel delete operation
  const cancelDeleteSession = () => {
    setShowDeleteConfirm(false);
    setSessionToDelete(null);
  };

  // Handle keyboard shortcuts for delete confirmation modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showDeleteConfirm) {
        if (e.key === 'Escape') {
          cancelDeleteSession();
        } else if (e.key === 'Enter') {
          confirmDeleteSession();
        }
      }
    };

    if (showDeleteConfirm) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showDeleteConfirm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGenerateResume = async (jobDesc?: string) => {
    const description = jobDesc || jobDescription;
    if (!description.trim() || !user?.uid || !profile) {
      return;
    }

    setIsGenerating(true);
    setSaveStatus('saving');
    
    // Add initial message
    const initialMessage: Message = {
      text: '🚀 Starting AI-powered resume generation...',
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, initialMessage]);

    try {
      // Use the new multi-agent coordinator with streaming
      const response = await fetch('/api/resume-agents/coordinator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile,
          jobDescription: description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate resume');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResumeData: ResumeData | null = null;
      let finalAgentInsights: any = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                const update = JSON.parse(line);
                
                if (update.type === 'start') {
                  // Already added initial message
                } else if (update.type === 'progress') {
                  // Add progress message to chat
                  const progressMessage: Message = {
                    text: update.message,
                    sender: 'bot',
                    timestamp: new Date(),
                  };
                  setMessages(prev => [...prev, progressMessage]);
                } else if (update.type === 'complete') {
                  // Store final data
                  finalResumeData = update.data.resumeData;
                  finalAgentInsights = update.data.agentInsights;
                } else if (update.type === 'error') {
                  throw new Error(update.error || 'Unknown error');
                }
              } catch (e) {
                console.error('Error parsing stream update:', e);
              }
            }
          }
        }
      }

      if (!finalResumeData || !finalAgentInsights) {
        throw new Error('No resume data received');
      }

      console.log('🎉 Resume generated with agent insights:', finalAgentInsights);
      
      // Use the generated resume data directly
      const resumeData: ResumeData = finalResumeData;

      setResumeData(resumeData);

      // Add success message with insights
      const successMessage = {
        text: `🎉 Your tailored resume is ready! I used a 6-agent AI system to optimize it:

${finalAgentInsights.processingSteps.map((step: string) => `✅ ${step}`).join('\n')}

The resume has been intelligently optimized with:
• ${finalAgentInsights.matchAnalysis?.matchScore || 'High'}% job match score
• Only items marked for resume included
• ${finalAgentInsights.projectOptimization?.selectedProjects?.length || 0} best projects selected and optimized
• ${finalAgentInsights.experienceOptimization?.optimizedExperience?.length || 0} experience entries rewritten with keywords
• ${finalAgentInsights.skillsEnhancement?.addedSkills?.length || 0} critical missing skills added
• ATS-optimized keywords and formatting
• Enhanced metrics and achievements
• Strategic skill positioning

You can now view it on the right, print it, or save it as PDF! 💾 Your resume and chat have been automatically saved.`,
        sender: 'bot' as const,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const updatedMessages = [...prev, successMessage];
        
        // Save resume and chat data after state update
        setTimeout(() => {
          saveResumeData(resumeData, updatedMessages);
        }, 100);
        
        return updatedMessages;
      });
    } catch (error) {
      console.error('Error generating resume:', error);
      setSaveStatus('error');

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          text: "I'm sorry, there was an error generating your resume with the multi-agent system. Please try again or contact support if the issue persists.",
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);

      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsGenerating(false);
      setIsTyping(false);
    }
  };

  // Helper function to convert markdown to HTML for resume
  const markdownToHtml = (text: string): string => {
    if (!text) return '';
    
    let html = text;
    
    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_ (but not if it's part of bold)
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    html = html.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');
    
    // Inline code: `code`
    html = html.replace(/`(.+?)`/g, '<code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>');
    
    return html;
  };

  const renderResume = (data: ResumeData): string => {
    // Helper function to format dates consistently
    const formatResumeDate = (dateString?: string): string => {
      return formatDate(dateString);
    };

    // Create sections based on the data
    const summarySection = data.summary ? `
      <div class="section">
        <h2 class="section-title">Summary</h2>
        <div class="section-divider"></div>
        <p class="content-indent">${markdownToHtml(data.summary)}</p>
      </div>
    ` : '';

    const skillsSection = data.skills && Object.keys(data.skills).length > 0 ? `
      <div class="section">
        <h2 class="section-title">Skills</h2>
        <div class="section-divider"></div>
        <div class="content-indent">
          ${Object.entries(data.skills).map(([domain, skills]) => 
            skills && skills.length > 0 ? `
              <p class="skill-item"><strong>${domain}</strong>: ${skills.join(', ')}</p>
            ` : ''
          ).join('')}
        </div>
      </div>
    ` : '';

    const experienceSection = data.experience && data.experience.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Experience</h2>
        <div class="section-divider"></div>
        ${data.experience.map(exp => `
          <div class="content-indent">
            <p class="entry-title"><strong>${exp.title}</strong> - ${exp.company}</p>
            <span class="date-text">${formatResumeDate(exp.startDate)} — ${formatResumeDate(exp.endDate)}</span>
            <ul class="bullet-list">
              ${exp.highlights.map(highlight => `<li>${markdownToHtml(highlight)}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    ` : '';

    const educationSection = data.education && data.education.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Education</h2>
        <div class="section-divider"></div>
        ${data.education
          .filter(edu => edu && (edu.school || edu.degree)) // Filter out null/empty entries
          .map(edu => {
            // Check if dates should be shown (defaults to true if not specified)
            const showDates = edu.showDatesInResume !== false;
            const dateDisplay = showDates ? `<span class="date-text">${formatResumeDate(edu.startDate)} — ${formatResumeDate(edu.endDate)}</span>` : '';
            
            return `
          <p class="content-indent">
            <strong>${edu.school || 'School'}</strong> • ${edu.degree || 'Degree'}
            ${dateDisplay}<br>
            ${edu.gpa ? `GPA: ${edu.gpa}` : ''}
          </p>
        `;
          }).join('')}
      </div>
    ` : '';

    const projectsSection = data.projects && data.projects.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Projects</h2>
        <div class="section-divider"></div>
        ${data.projects.map(project => `
          <div class="content-indent">
            <p class="entry-title"><strong>${project.title}</strong></p>
            <span class="date-text">${formatResumeDate(project.startDate)} — ${formatResumeDate(project.endDate)}</span>
            <ul class="bullet-list">
              ${project.highlights.map(highlight => `<li>${markdownToHtml(highlight)}</li>`).join('')}
            </ul>
            ${project.githubUrl || project.projectUrl ? `<p style="font-size: 10px; margin-top: 4px;">
              ${project.githubUrl ? `GitHub: ${project.githubUrl}` : ''}
              ${project.githubUrl && project.projectUrl ? ' | ' : ''}
              ${project.projectUrl ? `Live: ${project.projectUrl}` : ''}
            </p>` : ''}
          </div>
        `).join('')}
      </div>
    ` : '';

    const certificatesSection = data.certificates && data.certificates.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Certifications</h2>
        <div class="section-divider"></div>
        ${data.certificates.map(cert => `
          <div class="content-indent">
            <p class="entry-title"><strong>${cert.name}</strong> <em>by ${cert.issuer}</em>
            <span class="date-text">${formatResumeDate(cert.date)}</span></p>
          </div>
        `).join('')}
      </div>
    ` : '';

    return `
      <div class="resume-preview-container">
        <div class="resume-container">
          <div class="header">
            <h1>${data.header.name}${data.header.title ? ` <span class="title-separator">|</span> <span class="header-title">${data.header.title}</span>` : ''}</h1>
            <div class="contact-info">
              ${data.header.location ? `
                <div class="contact-item">
                  <span class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </span>
                  <span>${data.header.location}</span>
                </div>
              ` : ''}
              ${data.header.contact.phone ? `
                <div class="contact-item">
                  <span class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </span>
                  <span>${data.header.contact.phone}</span>
                </div>
              ` : ''}
              ${data.header.contact.email ? `
                <div class="contact-item">
                  <span class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </span>
                  <a href="mailto:${data.header.contact.email}">${data.header.contact.email}</a>
                </div>
              ` : ''}
              ${data.header.contact.linkedin ? `
                <div class="contact-item">
                  <span class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </span>
                  <a href="${data.header.contact.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                </div>
              ` : ''}
              ${data.header.contact.github ? `
                <div class="contact-item">
                  <span class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg>
                  </span>
                  <a href="${data.header.contact.github}" target="_blank" rel="noopener noreferrer">GitHub</a>
                </div>
              ` : ''}
              ${data.header.contact.portfolio ? `
                <div class="contact-item">
                  <span class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                  </span>
                  <a href="${data.header.contact.portfolio}" target="_blank" rel="noopener noreferrer">Portfolio</a>
                </div>
              ` : ''}
            </div>
          </div>

          ${summarySection}
          ${skillsSection}
          ${experienceSection}
          ${educationSection}
          ${projectsSection}
          ${certificatesSection}
        </div>
      </div>
    `;
  };

  // PDF generation function with selectable text - uses same rendering as UI
  const generateCoverLetterPDF = async (content: string) => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title></title>
            <style>
              @page {
                size: letter;
                margin: 0.5in;
                /* Remove all browser-generated content */
                @top-left { content: ""; }
                @top-center { content: ""; }
                @top-right { content: ""; }
                @bottom-left { content: ""; }
                @bottom-center { content: ""; }
                @bottom-right { content: ""; }
              }
              
              @media print {
                body::before,
                body::after,
                html::before,
                html::after {
                  display: none !important;
                  content: none !important;
                }
                
                @page {
                  size: letter;
                  margin: 0.5in;
                }
                
                /* Hide all potential browser UI elements */
                header, footer, nav, aside {
                  display: none !important;
                }
                
                /* Ensure proper page breaks */
                * {
                  page-break-inside: avoid;
                }
              }
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              html, body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
              }
              
              body {
                width: 8.5in;
                max-width: 8.5in;
                min-height: 11in;
                margin: 0 auto;
                padding: 0;
                font-family: 'Times New Roman', Times, serif;
                font-size: 11pt;
                line-height: 1.5;
                color: #000;
                background: white;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .cover-letter-container {
                width: 100%;
                max-width: 7.5in;
                margin: 0 auto;
                padding: 0.5in;
                box-sizing: border-box;
              }
              
              .cover-letter-container p {
                margin-bottom: 0.75em;
                color: #000 !important;
                text-align: left;
                line-height: 1.5;
                font-size: 11pt;
              }
              
              .cover-letter-container br {
                display: block;
                content: "";
                margin: 0.25em 0;
              }
              
              .cover-letter-container p:last-child {
                margin-bottom: 0;
              }
            </style>
            <script>
              window.onload = function() {
                // Clear document title to prevent it from showing in headers
                document.title = '';
                
                // Hide any potential browser UI elements
                const style = document.createElement('style');
                style.textContent = \`
                  @media print {
                    @page { 
                      margin: 0.5in; 
                      size: letter;
                    }
                    body { 
                      margin: 0 !important;
                      padding: 0 !important;
                    }
                  }
                \`;
                document.head.appendChild(style);
                
                // Small delay to ensure everything is loaded
                setTimeout(() => {
                  window.print();
                }, 100);
              };
            </script>
          </head>
          <body>
            <div class="cover-letter-container">
              ${content}
            </div>
          </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
      }
    } catch (error) {
      console.error('Failed to generate cover letter PDF:', error);
      throw error;
    }
  };

  const generatePDFWithText = async (data: ResumeData) => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title></title>
            ${resumeStyles}
            <style>
              @page {
                size: letter;
                margin: 0.3in;
                /* Remove all browser-generated content */
                @top-left { content: ""; }
                @top-center { content: ""; }
                @top-right { content: ""; }
                @bottom-left { content: ""; }
                @bottom-center { content: ""; }
                @bottom-right { content: ""; }
              }
              
              /* Hide any potential browser UI elements */
              @media print {
                body::before,
                body::after,
                html::before,
                html::after {
                  display: none !important;
                  content: none !important;
                }
                
                /* Ensure no margins for browser headers/footers */
                @page :first {
                  margin-top: 0.3in;
                }
                
                @page :left {
                  margin-left: 0.3in;
                  margin-right: 0.3in;
                }
                
                @page :right {
                  margin-left: 0.3in;
                  margin-right: 0.3in;
                }
              }
              
              body {
                width: 8.5in;
                max-width: 8.5in;
                margin: 0 auto;
                padding: 0;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                print-color-adjust: exact;
              }
              
              #print-wrapper {
                width: 100%;
                max-width: 8.5in;
                margin: 0 auto;
                padding: 0;
                box-sizing: border-box;
                position: relative;
              }
              
              .resume-container {
                width: 100%;
                max-width: 7.9in;
                margin: 0 auto;
                padding: 0 0.08in;
                box-sizing: border-box;
              }
            </style>
            <script>
              // Additional JavaScript to ensure clean printing
              window.onload = function() {
                // Clear document title to prevent it from showing in headers
                document.title = '';
                
                // Hide potential browser UI elements
                const style = document.createElement('style');
                style.textContent = \`
                  @media print {
                    @page { 
                      margin: 0.3in; 
                      size: letter;
                    }
                    body { 
                      margin: 0 !important; 
                      padding: 0 !important; 
                    }
                  }
                \`;
                document.head.appendChild(style);
              };
            </script>
          </head>
          <body>
            <div id="print-wrapper">
              ${renderResume(data)}
            </div>
          </body>
        </html>
      `;
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load and clear any potential headers
        setTimeout(() => {
          // Clear the title again just before printing
          printWindow.document.title = '';
          printWindow.print();
          printWindow.onafterprint = () => printWindow.close();
        }, 500);
      } else {
        throw new Error('Failed to open print window. Please allow popups for this site.');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  // Function to handle print
  const handlePrint = () => {
    if (viewMode === 'coverLetter') {
      if (!coverLetterContent) return;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title></title>
              <style>
                @page {
                  size: letter;
                  margin: 0.5in;
                  /* Remove all browser-generated content */
                  @top-left { content: ""; }
                  @top-center { content: ""; }
                  @top-right { content: ""; }
                  @bottom-left { content: ""; }
                  @bottom-center { content: ""; }
                  @bottom-right { content: ""; }
                }
                
                @media print {
                  body::before,
                  body::after,
                  html::before,
                  html::after {
                    display: none !important;
                    content: none !important;
                  }
                  
                  @page {
                    size: letter;
                    margin: 0.5in;
                  }
                  
                  /* Hide all potential browser UI elements */
                  header, footer, nav, aside {
                    display: none !important;
                  }
                  
                  /* Ensure proper page breaks */
                  * {
                    page-break-inside: avoid;
                  }
                }
                
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                
                html, body {
                  width: 100%;
                  height: 100%;
                  margin: 0;
                  padding: 0;
                }
                
                body {
                  width: 8.5in;
                  max-width: 8.5in;
                  min-height: 11in;
                  margin: 0 auto;
                  padding: 0;
                  font-family: 'Times New Roman', Times, serif;
                  font-size: 11pt;
                  line-height: 1.5;
                  color: #000;
                  background: white;
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                  print-color-adjust: exact;
                }
                
                .cover-letter-container {
                  width: 100%;
                  max-width: 7.5in;
                  margin: 0 auto;
                  padding: 0.5in;
                  box-sizing: border-box;
                }
                
                .cover-letter-container p {
                  margin-bottom: 0.75em;
                  color: #000 !important;
                  text-align: left;
                  line-height: 1.5;
                  font-size: 11pt;
                }
                
                .cover-letter-container br {
                  display: block;
                  content: "";
                  margin: 0.25em 0;
                }
                
                .cover-letter-container p:last-child {
                  margin-bottom: 0;
                }
              </style>
              <script>
                // Clear document title to prevent it from showing in headers
                document.title = '';
                
                // Hide any potential browser UI elements
                const style = document.createElement('style');
                style.textContent = \`
                  @media print {
                    @page { 
                      margin: 0.5in; 
                      size: letter;
                    }
                    body { 
                      margin: 0 !important;
                      padding: 0 !important;
                    }
                  }
                \`;
                document.head.appendChild(style);
              </script>
            </head>
            <body>
              <div class="cover-letter-container">
                ${coverLetterContent}
              </div>
            </body>
          </html>
        `;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
      return;
    }
    
    if (!resumeData) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title></title>
            ${resumeStyles}
            <style>
              @page {
                size: letter;
                margin: 0.25in;
                /* Remove all browser-generated content */
                @top-left { content: ""; }
                @top-center { content: ""; }
                @top-right { content: ""; }
                @bottom-left { content: ""; }
                @bottom-center { content: ""; }
                @bottom-right { content: ""; }
                /* Additional margin rules to prevent content */
                margin-top: 0.3in;
                margin-bottom: 0.3in;
                margin-left: 0.3in;
                margin-right: 0.3in;
              }
              
              /* Hide any potential browser UI elements */
              @media print {
                body::before,
                body::after,
                html::before,
                html::after {
                  display: none !important;
                  content: none !important;
                }
                
                /* Ensure no margins for browser headers/footers */
                @page :first {
                  margin-top: 0.25in;
                }
                
                @page :left {
                  margin-left: 0.25in;
                  margin-right: 0.25in;
                }
                
                @page :right {
                  margin-left: 0.25in;
                  margin-right: 0.25in;
                }
              }
              
              body {
                width: 8.5in;
                max-width: 8.5in;
                margin: 0 auto;
                padding: 0;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                print-color-adjust: exact;
              }
              
              #print-wrapper {
                width: 100%;
                max-width: 8.5in;
                margin: 0 auto;
                padding: 0;
                box-sizing: border-box;
                position: relative;
              }
              
              .resume-container {
                width: 100%;
                max-width: 7.7in;
                margin: 0 auto;
                padding: 0 0.1in;
                box-sizing: border-box;
              }
            </style>
            <script>
              // Additional JavaScript to ensure clean printing
              window.onload = function() {
                // Clear document title to prevent it from showing in headers
                document.title = '';
                
                // Hide potential browser UI elements
                const style = document.createElement('style');
                style.textContent = \`
                  @media print {
                    @page { 
                      margin: 0.3in; 
                      size: letter;
                    }
                    body { 
                      margin: 0 !important; 
                      padding: 0 !important; 
                    }
                  }
                \`;
                document.head.appendChild(style);
              };
            </script>
          </head>
          <body>
            <div id="print-wrapper">
              ${renderResume(resumeData)}
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load and clear any potential headers
      setTimeout(() => {
        // Clear the title again just before printing
        printWindow.document.title = '';
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      }, 500);
    }
  };

  // Handle Overleaf preview
  const handlePreviewOverleaf = async () => {
    if (!resumeData) return;
    
    try {
      // Generate LaTeX from resume data with selected template
      const latexResponse = await fetch('/api/generate-latex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData,
          template: selectedTemplate
        }),
      });

      if (!latexResponse.ok) {
        throw new Error('Failed to generate LaTeX');
      }

      const { latex } = await latexResponse.json();

      // Generate a unique session ID
      const sessionId = `chat-resume-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Store the LaTeX in the session endpoint
      const storeResponse = await fetch(`/api/chat-resume-latex/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latex }),
      });

      if (!storeResponse.ok) {
        throw new Error('Failed to store LaTeX');
      }

      // Create the API URL that Overleaf will fetch from
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/api/chat-resume-latex/${sessionId}.tex`;
      
      // Encode the URL and create Overleaf link
      const encodedUri = encodeURIComponent(apiUrl);
      const overleafUrl = `https://www.overleaf.com/docs?snip_uri=${encodedUri}`;
      
      // Open Overleaf in new window
      window.open(overleafUrl, '_blank');
      
      console.log('Opening resume in Overleaf');
    } catch (error) {
      console.error('Error generating Overleaf preview:', error);
      alert('Failed to generate Overleaf preview. Please try again.');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        {/* Navbar */}
        <Navbar saveStatus={saveStatus} />

        {/* Grid Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative z-10 pt-16 sm:pt-20 h-screen flex">
          {/* Chat History Sidebar */}
          <ChatHistory
            isOpen={showChatHistory}
            sessions={chatSessions}
            currentSessionId={currentSessionId}
            onNewChat={createNewChat}
            onSwitchSession={switchChatSession}
            onDeleteSession={deleteChatSession}
            onToggle={() => setShowChatHistory(!showChatHistory)}
          />

          <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] transition-all duration-500 ease-in-out">
            <div className={`grid h-full divide-y lg:divide-y-0 lg:divide-x divide-white/10 overflow-hidden transition-all duration-500 ease-in-out ${
              showResumeCanvas ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
            }`}>
          {/* Left Column - Chat Interface */}
          <div className="flex flex-col h-full overflow-hidden relative transition-all duration-500 ease-in-out">
            {/* Floating Save Button */}
            <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 z-20 flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {saveStatus === 'saving' && (
                <div className="flex items-center text-purple-400 text-[10px] sm:text-xs bg-purple-500/10 backdrop-blur-xl border border-purple-500/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg">
                  <Loader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 sm:mr-1.5 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                  <span className="sm:hidden">Saving</span>
                </div>
              )}
              {saveStatus === 'success' && (
                <div className="flex items-center text-green-400 text-[10px] sm:text-xs bg-green-500/10 backdrop-blur-xl border border-green-500/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-1 sm:mr-1.5 animate-pulse"></div>
                  <span className="hidden sm:inline">Saved</span>
                  <span className="sm:hidden">Saved</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center text-red-400 text-[10px] sm:text-xs bg-red-500/10 backdrop-blur-xl border border-red-500/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full mr-1 sm:mr-1.5"></div>
                  <span className="hidden sm:inline">Error</span>
                  <span className="sm:hidden">Error</span>
                </div>
              )}

              {resumeData && (
                <button
                  onClick={() => setShowResumeCanvas(!showResumeCanvas)}
                  className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white rounded-full hover:shadow-lg transition-all font-medium text-[10px] sm:text-xs shadow-lg"
                  title={showResumeCanvas ? "Hide Resume Canvas" : "Show Resume Canvas"}
                >
                  <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">{showResumeCanvas ? 'Hide' : 'Show'} Canvas</span>
                  <span className="sm:hidden">{showResumeCanvas ? '✕' : '📄'}</span>
                </button>
              )}

              <button
                onClick={() => resumeData && messages.length > 1 && saveResumeData(resumeData, messages)}
                disabled={!resumeData || saveStatus === 'saving'}
                className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-[10px] sm:text-xs shadow-lg disabled:opacity-50 disabled:hover:shadow-lg"
              >
                <span className="hidden sm:inline">💾 Save</span>
                <span className="sm:hidden">💾</span>
              </button>
            </div>

            {/* Messages */}
            <div
              className="messages-container flex-1 overflow-y-scroll pt-12 sm:pt-14 md:pt-16 pb-4 sm:pb-6 min-h-0 transition-all duration-500 ease-in-out"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#64748b #1e293b'
              }}
            >
              <div className={`space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-6 transition-all duration-500 ease-in-out ${!showResumeCanvas ? 'max-w-4xl mx-auto' : ''}`}>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  } animate-in fade-in slide-in-from-bottom-4 duration-300`}
                >
                  <div
                    className={`group relative max-w-[90%] sm:max-w-[85%] md:max-w-[80%] ${
                      message.sender === 'user'
                        ? 'rounded-2xl sm:rounded-3xl rounded-br-md'
                        : ''
                    } transition-all duration-200 hover:scale-[1.01]`}
                  >
                    {message.sender === 'user' ? (
                      <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-600 via-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-purple-500/20 rounded-2xl sm:rounded-3xl rounded-br-md">
                        <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{renderMarkdown(message.text)}</div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm text-white">{renderMarkdown(message.text)}</div>
                    )}
                    {message.sender === 'user' && (
                      <div className="flex items-center justify-end gap-2 mt-1 mr-1">
                        <span className="text-[10px] sm:text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-400">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area - Floating Style */}
            <div className="flex-shrink-0 pb-4 sm:pb-6 transition-all duration-500 ease-in-out">
              <div className={`transition-all duration-500 ease-in-out ${!showResumeCanvas ? 'max-w-4xl mx-auto' : ''} px-3 sm:px-4`}>
                <div className="relative">
                  <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 px-4 sm:px-5 py-2.5 sm:py-3">
                    <button
                      className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded-full transition-all duration-200 text-gray-400 hover:text-white flex items-center justify-center"
                      title="Attach file"
                      aria-label="Attach file"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Message Resume Assistant..."
                      className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 resize-none transition-all duration-200 min-h-[44px] sm:min-h-[48px] max-h-[200px] text-sm sm:text-base leading-relaxed py-2.5 pr-2 focus:ring-0 focus:outline-none self-center"
                      rows={1}
                      style={{
                        height: 'auto',
                        minHeight: '44px'
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isTyping}
                      className={`flex-shrink-0 p-2 sm:p-2.5 rounded-full transition-all duration-200 disabled:opacity-50 flex items-center justify-center ${
                        inputValue.trim() && !isTyping
                          ? 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 active:scale-95 text-white'
                          : 'bg-transparent text-gray-400 cursor-not-allowed'
                      }`}
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Resume Canvas - Only view for resume */}
          <ResumeCanvas
            isOpen={showResumeCanvas}
            resumeData={resumeData}
            resumeStyles={resumeStyles}
            renderResume={renderResume}
            onClose={() => setShowResumeCanvas(false)}
            onDownload={async () => {
              try {
                if (viewMode === 'coverLetter' && coverLetterContent) {
                  await generateCoverLetterPDF(coverLetterContent);
                } else if (resumeData) {
                  await generatePDFWithText(resumeData);
                }
              } catch (error) {
                console.error('Failed to generate PDF:', error);
                alert('Failed to generate PDF. Please try again.');
              }
            }}
            onPrint={handlePrint}
            onPreviewOverleaf={handlePreviewOverleaf}
            selectedTemplate={selectedTemplate}
            onTemplateChange={setSelectedTemplate}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            coverLetterContent={coverLetterContent}
          />
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        html, body {
          overflow: hidden;
          height: 100%;
        }
        /* Hide page-level scrollbar for WebKit-based browsers */
        body::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
        /* Hide page-level scrollbar for Firefox */
        html {
          scrollbar-width: none;
        }
        /* Custom scrollbar for chat messages container */
        .messages-container::-webkit-scrollbar {
          width: 8px;
        }
        .messages-container::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }
        .messages-container::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 4px;
          border: 1px solid rgba(15, 23, 42, 0.3);
        }
        .messages-container::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.7);
        }
        /* Hide scrollbar for textarea input */
        textarea {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        textarea::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
        
        /* Resume Canvas Animation */
        .resume-canvas-enter {
          animation: slideInFromRight 0.5s ease-out;
        }
        
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        /* Smooth grid column transitions */
        .grid {
          transition: grid-template-columns 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Smooth chat container width transitions */
        .messages-container > div {
          transition: max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.5s cubic-bezier(0.4, 0, 0.2, 1), margin-right 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Smooth input area transitions */
        .flex-shrink-0 > div {
          transition: max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.5s cubic-bezier(0.4, 0, 0.2, 1), margin-right 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={cancelDeleteSession}
        >
          <div 
            className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Delete Chat Session?
              </h3>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <p className="text-gray-300 text-sm leading-relaxed">
                Are you sure you want to delete this chat session? This action cannot be undone and all messages in this conversation will be permanently deleted.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white/5 rounded-b-2xl flex items-center justify-end gap-3">
              <button
                onClick={cancelDeleteSession}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSession}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-lg shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
} 