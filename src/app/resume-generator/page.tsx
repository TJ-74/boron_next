'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Navbar from '../components/ui/navbar';
import { Button } from "@/app/components/ui/button";
import { Loader2, FileText, Printer, User, Send, Zap, MessageSquare, Download } from 'lucide-react';
import { getUserProfileSummary } from '@/app/lib/userProfileService';
import type { UserProfile } from '@/app/types/profile';
import Link from 'next/link';
import Image from 'next/image';
import logo from "@/app/images/logo-no-background.png";

interface ResumeData {
  header: {
    name: string;
    title: string;
    contact: {
      email: string;
      phone: string;
      linkedin: string;
      github: string;
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
        <pre key={partIndex} className="bg-gray-100 rounded-lg p-3 my-2 overflow-x-auto">
          <code className="text-sm font-mono">{code}</code>
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
          <div key={`${partIndex}-${lineIndex}`} className="flex items-start gap-2 my-1">
            <span className="text-blue-500 mt-1">•</span>
            <span>{processInlineFormatting(content, `${partIndex}-${lineIndex}`)}</span>
          </div>
        );
      }
      
      // Handle numbered lists
      if (line.trim().match(/^\d+\.\s/)) {
        const match = line.trim().match(/^(\d+)\.\s(.+)$/);
        if (match) {
          return (
            <div key={`${partIndex}-${lineIndex}`} className="flex items-start gap-2 my-1">
              <span className="text-blue-500 font-medium">{match[1]}.</span>
              <span>{processInlineFormatting(match[2], `${partIndex}-${lineIndex}`)}</span>
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
      <code key={`${keyPrefix}-code-${i}`} className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{content}</code> },
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

// PDF generation function with selectable text
const generatePDFWithText = async (resumeData: ResumeData) => {
  try {
    // Helper to convert markdown to HTML for PDF
    const markdownToHtmlForPDF = (text: string): string => {
      if (!text) return '';
      let html = text;
      // Bold
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
      // Italic (avoiding conflicts with bold)
      html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
      html = html.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');
      // Inline code
      html = html.replace(/`(.+?)`/g, '<code style="background-color: #f3f4f6; padding: 2px 4px; border-radius: 2px; font-family: monospace; font-size: 0.9em;">$1</code>');
      return html;
    };

    // Create a clean, text-based HTML structure for PDF
    const createTextBasedHTML = (data: ResumeData): string => {
      const formatPDFDate = (dateString?: string): string => {
        return formatDate(dateString);
      };

      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title></title>
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
    }
    
    h1 {
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 5px;
    }
    
    .title {
      font-size: 14px;
      text-align: center;
      margin-bottom: 10px;
    }
    
    .contact {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      font-size: 10px;
      margin-bottom: 15px;
      flex-wrap: nowrap;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 3px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    
    .section-title {
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 15px;
      margin-bottom: 3px;
      border-bottom: 1px solid #000;
      padding-bottom: 2px;
    }
    
    .section-content {
      margin-bottom: 10px;
    }
    
    .entry {
      margin-bottom: 10px;
    }
    
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-weight: bold;
      margin-bottom: 3px;
    }
    
    .entry-title {
      font-weight: bold;
    }
    
    .entry-date {
      font-size: 10px;
      font-weight: normal;
    }
    
    .bullet-list {
      margin-left: 15px;
      margin-top: 3px;
    }
    
    .bullet-list li {
      margin-bottom: 2px;
      font-size: 11px;
    }
    
    .skills-category {
      margin-bottom: 3px;
      font-size: 11px;
    }
    
    .skills-category strong {
      font-weight: bold;
    }
    
    @media print {
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
      
      body {
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 0;
      }
      
      /* Hide any potential browser UI elements */
      body::before,
      body::after,
      html::before,
      html::after {
        display: none !important;
        content: none !important;
      }
      
      /* Ensure text remains selectable */
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Hide print-specific elements */
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <h1>${data.header.name}</h1>
  ${data.header.title ? `<div class="title">${data.header.title}</div>` : ''}
  
  <div class="contact">
    ${data.header.contact.phone ? `
      <div class="contact-item">
        <span>📱</span>
        <span>${data.header.contact.phone}</span>
      </div>
    ` : ''}
    ${data.header.contact.email ? `
      <div class="contact-item">
        <span>✉️</span>
        <span>${data.header.contact.email}</span>
      </div>
    ` : ''}
    ${data.header.contact.linkedin ? `
      <div class="contact-item">
        <span>💼</span>
        <span>${data.header.contact.linkedin.replace('https://www.linkedin.com/in/', 'linkedin.com/in/')}</span>
      </div>
    ` : ''}
    ${data.header.contact.github ? `
      <div class="contact-item">
        <span>🔗</span>
        <span>${data.header.contact.github.replace('https://github.com/', 'github.com/')}</span>
      </div>
    ` : ''}
  </div>

  ${data.summary ? `
    <div class="section-title">Summary</div>
    <div class="section-content">${markdownToHtmlForPDF(data.summary)}</div>
  ` : ''}

  ${data.skills && Object.keys(data.skills).length > 0 ? `
    <div class="section-title">Skills</div>
    <div class="section-content">
      ${Object.entries(data.skills).map(([domain, skills]) => 
        skills && skills.length > 0 ? 
          `<div class="skills-category"><strong>${domain}:</strong> ${skills.join(', ')}</div>` 
          : ''
      ).join('')}
    </div>
  ` : ''}

  ${data.experience && data.experience.length > 0 ? `
    <div class="section-title">Experience</div>
    <div class="section-content">
      ${data.experience.map(exp => `
        <div class="entry">
          <div class="entry-header">
            <span class="entry-title">${exp.title} - ${exp.company}</span>
            <span class="entry-date">${formatPDFDate(exp.startDate)} — ${formatPDFDate(exp.endDate)}</span>
          </div>
          <ul class="bullet-list">
            ${exp.highlights.map(highlight => `<li>${markdownToHtmlForPDF(highlight)}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  ` : ''}

  ${data.projects && data.projects.length > 0 ? `
    <div class="section-title">Projects</div>
    <div class="section-content">
      ${data.projects.map(project => `
        <div class="entry">
          <div class="entry-header">
            <span class="entry-title">${project.title}</span>
            <span class="entry-date">${formatPDFDate(project.startDate)} — ${formatPDFDate(project.endDate)}</span>
          </div>
          ${project.technologies ? `<div style="font-size: 10px; margin-top: 2px; color: #555;"><em>Technologies: ${markdownToHtmlForPDF(project.technologies)}</em></div>` : ''}
          <ul class="bullet-list">
            ${project.highlights.map(highlight => `<li>${markdownToHtmlForPDF(highlight)}</li>`).join('')}
          </ul>
          ${project.githubUrl || project.projectUrl ? `<div style="font-size: 9px; margin-top: 2px; color: #666;">
            ${project.githubUrl ? `GitHub: ${project.githubUrl}` : ''}
            ${project.githubUrl && project.projectUrl ? ' | ' : ''}
            ${project.projectUrl ? `Live: ${project.projectUrl}` : ''}
          </div>` : ''}
        </div>
      `).join('')}
    </div>
  ` : ''}

  ${data.education && data.education.length > 0 ? `
    <div class="section-title">Education</div>
    <div class="section-content">
      ${data.education.map(edu => `
        <div class="entry">
          <div class="entry-header">
            <span class="entry-title">${edu.school} • ${edu.degree}</span>
            <span class="entry-date">${formatPDFDate(edu.startDate)} - ${formatPDFDate(edu.endDate)}</span>
          </div>
          ${edu.gpa ? `<div style="font-size: 11px; margin-top: 2px;">GPA: ${edu.gpa}</div>` : ''}
        </div>
      `).join('')}
    </div>
  ` : ''}

  ${data.certificates && data.certificates.length > 0 ? `
    <div class="section-title">Certifications</div>
    <div class="section-content">
      ${data.certificates.map(cert => `
        <div class="entry">
          <div class="entry-header">
            <span class="entry-title">${cert.name} by ${cert.issuer}</span>
            <span class="entry-date">${formatPDFDate(cert.date)}</span>
          </div>
        </div>
      `).join('')}
    </div>
  ` : ''}
</body>
</html>`;
    };

    // Generate HTML content
    const htmlContent = createTextBasedHTML(resumeData);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load and clear any potential headers
      setTimeout(() => {
        // Clear the title to prevent it from showing in headers
        printWindow.document.title = '';
        
        // Show print dialog
        printWindow.print();
        
        // Close window after printing
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 500);
    } else {
      throw new Error('Failed to open print window. Please allow popups for this site.');
    }

  } catch (error) {
    console.error('Error generating resume:', error);
    throw error;
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
  
  // Chat interface states
  const [messages, setMessages] = useState<Message[]>([
    {
      text: `Hi ${user?.displayName || 'there'}! I'm your Resume Assistant. Share a job description with me and I'll create a tailored resume for you. Just paste the job posting or tell me about the role you're applying for!`,
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiMessages, setApiMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi ${user?.displayName || 'there'}! I'm your Resume Assistant. Share a job description with me and I'll create a tailored resume for you. Just paste the job posting or tell me about the role you're applying for!`,
    }
  ]);
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

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Adjust textarea height when input value changes
    adjustTextareaHeight();
  }, [inputValue]);

  const resumeStyles = `
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
        padding: 0.75in;
        background-color: white;
        font-family: 'Times New Roman', Times, serif;
        line-height: 1.2;
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
        padding: 0.5in;
        background-color: white;
        font-family: 'Times New Roman', Times, serif;
        line-height: 1.2;
        color: #333;
      }
      
      /* Each section should have proper spacing for multi-page layout */
      .resume-preview-container .section {
        margin-bottom: 0.75rem;
        padding-bottom: 0.25rem;
        width: 100%;
        break-inside: avoid;
      }
      
      .resume-preview-container h1 {
        font-size: 1.5rem;
        font-weight: bold;
        text-align: center;
        margin-bottom: 0.5rem;
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
        margin-bottom: 1rem;
        width: 100%;
      }
      
      .resume-preview-container .contact-info {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 1rem;
        font-size: 0.75rem;
        color: #666;
        margin-bottom: 1rem;
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
      }
      
      .resume-preview-container .bullet-list {
        padding-left: 1.2rem;
        list-style-type: disc;
        margin-top: 0.1rem;
        line-height: 1.2;
        font-size: 0.8rem;
        width: 100%;
      }
      
      .resume-preview-container .entry-title {
        font-weight: normal;
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
          margin: 0.4in;
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
          padding: 0 0.1in !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 7.7in !important;
          height: auto !important;
          min-height: 0 !important;
        }

        .section {
          page-break-inside: auto !important;
          break-inside: auto !important;
          margin-bottom: 0.5rem !important;
          padding-bottom: 0.15rem !important;
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
          margin-bottom: 0.5rem !important;
        }

        h2, .section-title {
          page-break-after: avoid !important;
          break-after: avoid !important;
          page-break-before: auto !important;
          break-before: auto !important;
        }

        .section-divider {
          margin: 0.05rem 0 0.15rem 0 !important;
        }

        /* Optimize spacing between sections */
        .section + .section {
          margin-top: 0.3rem !important;
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
    </style>
  `;

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
              text: `Hi ${user?.displayName || 'there'}! I'm your Resume Assistant. Share a job description with me and I'll create a tailored resume for you. Just paste the job posting or tell me about the role you're applying for!`,
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
        
        // Save the updated resume
        if (user?.uid) {
          await fetch('/api/resume-save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.uid,
              resumeData: chatResult.updatedResume,
            }),
          });
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
        ${data.education.map(edu => `
          <p class="content-indent">
            <strong>${edu.school}</strong> • ${edu.degree}
            <span class="date-text">${formatResumeDate(edu.startDate)} - ${formatResumeDate(edu.endDate)}</span><br>
            ${edu.gpa ? `GPA: ${edu.gpa}` : ''}
          </p>
        `).join('')}
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
            ${project.technologies ? `<p style="font-size: 11px; margin-top: 4px; color: #555;"><em>Technologies: ${markdownToHtml(project.technologies)}</em></p>` : ''}
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
            <h1>${data.header.name}</h1>
            <div class="contact-info">
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
                  <a href="${data.header.contact.linkedin}" target="_blank" rel="noopener noreferrer">
                    ${data.header.contact.linkedin.replace('https://www.linkedin.com/in/', 'linkedin.com/in/')}
                  </a>
                </div>
              ` : ''}
              ${data.header.contact.github ? `
                <div class="contact-item">
                  <span class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg>
                  </span>
                  <a href="${data.header.contact.github}" target="_blank" rel="noopener noreferrer">
                    ${data.header.contact.github.replace('https://github.com/', 'github.com/')}
                  </a>
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

  // Function to handle print
  const handlePrint = () => {
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
                margin: 0.4in;
                /* Remove all browser-generated content */
                @top-left { content: ""; }
                @top-center { content: ""; }
                @top-right { content: ""; }
                @bottom-left { content: ""; }
                @bottom-center { content: ""; }
                @bottom-right { content: ""; }
                /* Additional margin rules to prevent content */
                margin-top: 0.4in;
                margin-bottom: 0.4in;
                margin-left: 0.4in;
                margin-right: 0.4in;
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
                  margin-top: 0.4in;
                }
                
                @page :left {
                  margin-left: 0.4in;
                  margin-right: 0.4in;
                }
                
                @page :right {
                  margin-left: 0.4in;
                  margin-right: 0.4in;
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
                      margin: 0.4in; 
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

  return (
    <ProtectedRoute>
      <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 text-gray-900 box-border">
        {/* Navbar */}
        <Navbar saveStatus={saveStatus} />

        <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-5rem)] divide-y lg:divide-y-0 lg:divide-x divide-gray-200 overflow-hidden m-0 p-0">
          {/* Left Column - Chat Interface */}
          <div className="bg-white flex flex-col h-full overflow-hidden shadow-sm">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Resume Assistant</h2>
                  <p className="text-sm text-gray-500">AI-Powered Resume Generator</p>
                </div>
              </div>

              {/* Save Status and Manual Save Button */}
              <div className="flex items-center gap-3">
                {saveStatus === 'saving' && (
                  <div className="flex items-center text-blue-600 text-sm bg-blue-50 px-3 py-1.5 rounded-lg">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </div>
                )}
                {saveStatus === 'success' && (
                  <div className="flex items-center text-green-600 text-sm bg-green-50 px-3 py-1.5 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Saved
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center text-red-600 text-sm bg-red-50 px-3 py-1.5 rounded-lg">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                    Save Error
                  </div>
                )}

                <button
                  onClick={() => resumeData && messages.length > 1 && saveResumeData(resumeData, messages)}
                  disabled={!resumeData || saveStatus === 'saving'}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
                >
                  💾 Save
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              className="messages-container flex-1 overflow-y-scroll p-6 space-y-6 min-h-0"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 #f1f5f9'
              }}
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-sm border transition-all duration-200 hover:scale-[1.02] ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white border-blue-500/30 shadow-blue-500/20'
                        : 'bg-white text-gray-900 border-gray-200 shadow-gray-100/50'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      {message.sender === 'bot' ? (
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-2">
                          <Zap className="h-3 w-3 text-white" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                          <User className="h-3 w-3 text-gray-600" />
                        </div>
                      )}
                      <span className={`text-xs font-medium ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.sender === 'user' ? 'You' : 'Resume Assistant'} •{' '}
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{renderMarkdown(message.text)}</div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-900 rounded-2xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center space-x-1">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-2">
                        <Zap className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs text-gray-500 mr-3">Resume Assistant is working...</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 flex-shrink-0">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Paste the job description here, or tell me about the role you're applying for..."
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 resize-none transition-all duration-200 min-h-[48px] max-h-[120px] shadow-sm"
                    rows={1}
                    style={{
                      height: 'auto',
                      minHeight: '48px'
                    }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl px-6 py-3 h-12 shadow-lg transition-all duration-200 disabled:opacity-50 hover:scale-105 disabled:hover:scale-100 flex items-center justify-center"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Right Column - Resume Preview */}
          <div className="bg-white overflow-hidden flex flex-col h-full">
            {!resumeData ? (
              <div className="h-full flex flex-col items-center justify-center p-8">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto">
                      <FileText className="h-12 w-12 text-blue-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Resume Generator Ready</h3>
                    <p className="text-gray-600 max-w-md">
                      Share a job description with the Resume Assistant, and I'll create a perfectly tailored resume based on your profile in seconds.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
                    <MessageSquare className="h-4 w-4" />
                    <span>Start chatting to begin</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex-1 relative overflow-hidden">
                  <div className="absolute inset-0 overflow-y-auto">
                    <style dangerouslySetInnerHTML={{ __html: resumeStyles }} />
                    <div className="resume-preview-container">
                      <div id="print-wrapper">
                        <div dangerouslySetInnerHTML={{ __html: renderResume(resumeData) }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Resume Preview</h2>
                      {resumeData && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          Auto-Saved
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        try {
                          await generatePDFWithText(resumeData);
                        } catch (error) {
                          console.error('Failed to generate PDF:', error);
                          alert('Failed to generate PDF. Please try again.');
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium text-sm shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium text-sm shadow-sm"
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </button>
                  </div>
                </div>
              </div>
            )}
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
          background: #f1f5f9;
          border-radius: 4px;
        }
        .messages-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
          border: 1px solid #f1f5f9;
        }
        .messages-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </ProtectedRoute>
  );
} 