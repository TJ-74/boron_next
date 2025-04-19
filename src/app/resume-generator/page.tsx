'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { Button } from "@/app/components/ui/button";
import { Loader2, FileText, RefreshCw, X, Printer, User } from 'lucide-react';
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

// Add this helper function before the ResumeGenerator component
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Present';
  
  try {
    // Handle YYYY-MM format
    if (dateString.includes('-')) {
      const [year, month] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    }
    // Handle existing date strings
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  } catch (e) {
    return dateString;
  }
};

export default function ResumeGenerator() {
  const { user, logout } = useAuth();
  const [jobDescription, setJobDescription] = useState('');
  const [resumeContent, setResumeContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);

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
      }

      @media print {
        @page {
          size: letter;
          margin: 0.4in;
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

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      
      try {
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
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleGenerateResume = async () => {
    if (!jobDescription.trim() || !user?.uid || !profile) {
      return;
    }

    setIsGenerating(true);
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/resume-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile,
          jobDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate resume');
      }

      const { resumeData } = await response.json();
      setResumeData(resumeData);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error generating resume:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      alert('Failed to generate resume. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderResume = (data: ResumeData): string => {
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
            <span class="date-text">${exp.startDate} — ${exp.endDate}</span>
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
            <span class="date-text">${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}</span><br>
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
            <span class="date-text">${project.startDate} — ${project.endDate || 'Present'}</span>
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
            <span class="date-text">${cert.date}</span></p>
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
              <div class="contact-item">
                <span class="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </span>
                <span>${data.header.contact.phone}</span>
              </div>
              <div class="contact-item">
                <span class="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                <a href="mailto:${data.header.contact.email}">${data.header.contact.email}</a>
              </div>
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
                    ${data.header.contact.linkedin.replace('https://www.linkedin.com/in/', '')}
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
                    ${data.header.contact.github.replace('https://github.com/', '')}
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
            <title>Resume - ${resumeData.header.name}</title>
            ${resumeStyles}
            <style>
              @page {
                size: letter;
                margin: 0.4in;
              }
              body {
                width: 8.5in;
                max-width: 8.5in;
                margin: 0 auto;
                padding: 0;
              }
              #print-wrapper {
                width: 100%;
                max-width: 8.5in;
                margin: 0 auto;
                padding: 0;
                box-sizing: border-box;
              }
              .resume-container {
                width: 100%;
                max-width: 7.7in;
                margin: 0 auto;
                padding: 0 0.1in;
                box-sizing: border-box;
              }
            </style>
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
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      }, 250);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        {/* Header */}
        <header className="w-full py-6 px-4 sm:px-6 lg:px-8 border-b border-gray-800">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <Image 
                src={logo} 
                alt="Logo" 
                width={150} 
                height={40} 
                className="h-8 w-auto"
              />
            </Link>
            <div className="flex items-center gap-4">
              {saveStatus === 'saving' && (
                <span className="text-sm text-yellow-400 flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </span>
              )}
              {saveStatus === 'success' && (
                <span className="text-sm text-green-400">
                  Resume generated successfully
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-sm text-red-400">
                  Error generating resume
                </span>
              )}
              <Link href="/profile">
                <Button
                  variant="outline"
                  className="text-gray-300 border-gray-700 hover:bg-gray-800 flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Button>
              </Link>
              <Link href="/resume-generator">
                <Button
                  variant="outline"
                  className="text-gray-300 border-gray-700 hover:bg-gray-800 flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Resume Generator
                </Button>
              </Link>
              <Button
                onClick={logout}
                variant="outline"
                className="text-gray-300 border-gray-700 hover:bg-gray-800"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 h-[calc(100vh-5rem)] divide-x divide-gray-800">
          {/* Left Column - Job Description Input */}
          <div className="p-8 bg-gray-800/50 backdrop-blur-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-400">
              <FileText className="h-5 w-5 mr-2" />
              Job Description
            </h2>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full h-[calc(100vh-16rem)] p-4 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-300 placeholder-gray-600 resize-none"
              placeholder="Paste job description here..."
            />
            <div className="mt-4">
              <Button
                onClick={handleGenerateResume}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl"
                disabled={!jobDescription.trim() || isGenerating || !profile}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Resume...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Resume
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Right Column - Resume Preview */}
          <div className="bg-gray-900 overflow-hidden flex flex-col h-[calc(100vh-5rem)]">
            {!resumeData ? (
              <div className="h-full flex flex-col items-center justify-center p-8">
                <FileText className="h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-medium text-gray-400 mb-2">No Resume Generated Yet</h3>
                <p className="text-center text-gray-500">
                  Fill in the job description and click "Generate Resume" to create a tailored resume based on your profile.
                </p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                  <h2 className="text-xl font-semibold text-white">Resume Preview</h2>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => {
                        const htmlContent = `
                          <!DOCTYPE html>
                          <html>
                            <head>
                              <meta charset="UTF-8">
                              <meta name="viewport" content="width=device-width, initial-scale=1.0">
                              <title>Resume - ${resumeData.header.name}</title>
                              ${resumeStyles}
                            </head>
                            <body>
                              <div id="print-wrapper">
                                ${renderResume(resumeData)}
                              </div>
                            </body>
                          </html>
                        `;
                        const blob = new Blob([htmlContent], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                        setTimeout(() => URL.revokeObjectURL(url), 100);
                      }}
                      variant="outline"
                      size="sm"
                      className="text-blue-400 border-blue-800 hover:text-blue-300 hover:bg-blue-900/20"
                    >
                      View as PDF
                    </Button>
                    <Button
                      onClick={handlePrint}
                      variant="outline"
                      size="sm"
                      className="text-green-400 border-green-800 hover:text-green-300 hover:bg-green-900/20"
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Print
                    </Button>
                  </div>
                </div>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 