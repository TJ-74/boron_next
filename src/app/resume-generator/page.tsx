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
    <div class="section-content">${data.summary}</div>
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
            ${exp.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
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
          <ul class="bullet-list">
            ${project.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
          </ul>
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
      // Call the resume chat API
      const response = await fetch('/api/resume-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedApiMessages,
          profile,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      
      // Add bot response to UI
      setMessages((prev) => {
        const updatedMessages = [
          ...prev,
          {
            text: data.message,
            sender: 'bot' as const,
            timestamp: new Date(),
          },
        ];

        // Save chat periodically (every few messages)
        if (updatedMessages.length % 4 === 0 && user?.uid && resumeData) {
          setTimeout(() => {
            saveResumeData(resumeData, updatedMessages);
          }, 100);
        }

        return updatedMessages;
      });
      
      // Add bot response to API message history
      setApiMessages([...updatedApiMessages, {
        role: 'assistant',
        content: data.message
      }]);

      // Check if we should generate a resume
      if (data.generateResume && data.jobDescription) {
        setJobDescription(data.jobDescription);
        await handleGenerateResume(data.jobDescription);
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
    try {
      // Use the new section coordinator for complete resume generation
      const response = await fetch('/api/resume-agents/section-coordinator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'all',
          profile,
          jobDescription: description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate resume');
      }

      const { result, jobAnalysis, matchAnalysis } = await response.json();
      
      // Transform the result into the expected ResumeData format
      const resumeData: ResumeData = {
        header: {
          name: profile.name,
          title: profile.title || '',
          contact: {
            email: profile.email,
            phone: profile.phone || '',
            linkedin: profile.linkedinUrl || '',
            github: profile.githubUrl || '',
          }
        },
        summary: result.summary,
        skills: result.skills,
        experience: result.experience,
        projects: result.projects,
        education: profile.education?.filter(edu => edu.includeInResume !== false).map(edu => ({
          degree: edu.degree,
          school: edu.school,
          location: '',
          startDate: edu.startDate,
          endDate: edu.endDate,
          gpa: edu.cgpa
        })) || [],
        certificates: profile.certificates?.filter(cert => cert.includeInResume !== false).map(cert => ({
          name: cert.name,
          issuer: cert.issuer,
          date: cert.issueDate
        })) || []
      };

      setResumeData(resumeData);

      // Add success message with insights
      const successMessage = {
        text: `🎉 Your tailored resume is ready! I used a multi-agent system to optimize it:

✅ Job Description Analysis Complete
✅ Profile Matching Complete  
✅ Experience Optimization Complete
✅ Projects Filtering & Enhancement Complete
✅ Skills Strategic Organization Complete
✅ Professional Summary Generation Complete

The resume has been intelligently optimized with:
• ${matchAnalysis?.matchScore || 'High'}% job match score
• Only relevant experience and projects included
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
        <p class="content-indent">${data.summary}</p>
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
              ${exp.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
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
            <ul class="bullet-list">
              ${project.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
            </ul>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
        {/* Navbar */}
        <Navbar saveStatus={saveStatus} />

        <div className="grid grid-cols-2 h-[calc(100vh-4rem)] divide-x divide-slate-700/50">
          {/* Left Column - Chat Interface */}
          <div className="bg-gradient-to-b from-slate-900/50 to-slate-800/50 backdrop-blur-sm flex flex-col h-full overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-indigo-900/30 flex-shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center">
                <div className="relative mr-3">
                  <Zap className="h-6 w-6 text-yellow-400 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                Resume Assistant
                <span className="ml-2 text-sm font-normal text-blue-300">AI-Powered</span>
              </h2>
              
              {/* Save Status and Manual Save Button */}
              <div className="flex items-center space-x-3">
                {saveStatus === 'saving' && (
                  <div className="flex items-center text-blue-300 text-sm">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </div>
                )}
                {saveStatus === 'success' && (
                  <div className="flex items-center text-green-300 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Saved
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center text-red-300 text-sm">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                    Save Error
                  </div>
                )}
                
                <Button
                  onClick={() => resumeData && messages.length > 1 && saveResumeData(resumeData, messages)}
                  disabled={!resumeData || saveStatus === 'saving'}
                  variant="outline"
                  size="sm"
                  className="text-blue-300 border-blue-800/50 hover:text-blue-200 hover:bg-blue-900/20 disabled:opacity-50"
                >
                  💾 Save
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div 
              className="messages-container flex-1 overflow-y-scroll p-6 space-y-6 min-h-0"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#475569 #1e293b'
              }}
            >
              <style jsx>{`
                .messages-container::-webkit-scrollbar {
                  width: 8px;
                }
                .messages-container::-webkit-scrollbar-track {
                  background: #1e293b;
                  border-radius: 4px;
                }
                .messages-container::-webkit-scrollbar-thumb {
                  background: #475569;
                  border-radius: 4px;
                  border: 1px solid #1e293b;
                }
                .messages-container::-webkit-scrollbar-thumb:hover {
                  background: #64748b;
                }
              `}</style>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-lg backdrop-blur-sm border transition-all duration-200 hover:scale-[1.02] ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white border-blue-500/30 shadow-blue-500/20'
                        : 'bg-gradient-to-br from-slate-800 to-slate-700 text-slate-100 border-slate-600/30 shadow-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      {message.sender === 'bot' ? (
                        <Zap className="h-4 w-4 mr-2 text-yellow-400 animate-pulse" />
                      ) : (
                        <User className="h-4 w-4 mr-2 text-blue-200" />
                      )}
                      <span className="text-xs font-medium opacity-75">
                        {message.sender === 'user' ? 'You' : 'Resume Assistant'} •{' '}
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-700 text-white rounded-2xl p-4 shadow-lg border border-slate-600/30 backdrop-blur-sm">
                    <div className="flex items-center space-x-1">
                      <Zap className="h-4 w-4 text-yellow-400 mr-2" />
                      <span className="text-xs text-slate-400 mr-3">Resume Assistant is working...</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-slate-700/50 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Paste the job description here, or tell me about the role you're applying for..."
                    className="w-full px-4 py-3 bg-slate-800/70 backdrop-blur-sm border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-slate-400 resize-none transition-all duration-200 min-h-[48px] max-h-[120px]"
                    rows={1}
                    style={{ 
                      height: 'auto',
                      minHeight: '48px'
                    }}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl px-6 py-3 h-12 shadow-lg transition-all duration-200 disabled:opacity-50 hover:scale-105 disabled:hover:scale-100"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Right Column - Resume Preview */}
          <div className="bg-slate-900/80 backdrop-blur-sm overflow-hidden flex flex-col h-[calc(100vh-5rem)]">
            {!resumeData ? (
              <div className="h-full flex flex-col items-center justify-center p-8">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <FileText className="h-24 w-24 text-slate-600 mx-auto" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Zap className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-300">AI Resume Generator Ready</h3>
                  <p className="text-center text-slate-400 max-w-md">
                    Share a job description with the Resume Assistant, and I'll create a perfectly tailored resume based on your profile in seconds.
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
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
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50 bg-gradient-to-r from-slate-900/50 to-slate-800/50 flex-shrink-0">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-emerald-400" />
                    Resume Preview
                    {resumeData && (
                      <span className="ml-3 text-xs bg-emerald-900/30 text-emerald-300 px-2 py-1 rounded-full border border-emerald-700/50">
                        Auto-Saved
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={async () => {
                        try {
                          await generatePDFWithText(resumeData);
                        } catch (error) {
                          console.error('Failed to generate PDF:', error);
                          alert('Failed to generate PDF. Please try again.');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="text-blue-400 border-blue-800/50 hover:text-blue-300 hover:bg-blue-900/20 backdrop-blur-sm transition-all duration-200"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download Resume
                    </Button>
                    <Button
                      onClick={handlePrint}
                      variant="outline"
                      size="sm"
                      className="text-emerald-400 border-emerald-800/50 hover:text-emerald-300 hover:bg-emerald-900/20 backdrop-blur-sm transition-all duration-200"
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Print
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 