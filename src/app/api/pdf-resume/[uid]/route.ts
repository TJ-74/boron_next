import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { convertToLatex, formatDateForLatex } from '@/app/lib/latexUtils';
import path from 'path';
import os from 'os';

// Define interfaces from profile page
interface ProfileInfo {
  name: string;
  email: string;
  profileImage?: string;
  phone?: string;
  location?: string;
  title?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  includeInResume?: boolean;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  cgpa: string;
  includeInResume?: boolean;
}

interface Skill {
  id: string;
  name: string;
  domain: string;
  includeInResume?: boolean;
}

interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string;
  startDate: string;
  endDate: string;
  projectUrl?: string;
  githubUrl?: string;
  includeInResume?: boolean;
}

interface Certificate {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialUrl?: string;
  includeInResume?: boolean;
}

interface UserProfile extends ProfileInfo {
  about: string;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certificates: Certificate[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const { uid } = params;
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('userProfiles');
    
    const profile = await collection.findOne({ uid });
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Generate LaTeX content
    const latexContent = generateLatexResume(profile as unknown as UserProfile);
    
    // For development/demo purposes, we'll return an HTML representation of the resume
    // instead of trying to generate a PDF with pdflatex
    const htmlContent = generateHtmlResume(profile as unknown as UserProfile);
    
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
    
  } catch (error) {
    console.error('Error generating resume:', error);
    return NextResponse.json({ error: 'Failed to generate resume' }, { status: 500 });
  }
}

const generateHtmlResume = (profile: UserProfile): string => {
  // Filter items that should be included in the resume
  const includedExperiences = profile.experiences ? profile.experiences.filter((exp: Experience) => exp.includeInResume !== false) : [];
  const includedEducations = profile.education ? profile.education.filter((edu: Education) => edu.includeInResume !== false) : [];
  const includedSkills = profile.skills ? profile.skills.filter((skill: Skill) => skill.includeInResume !== false) : [];
  const includedProjects = profile.projects ? profile.projects.filter((project: Project) => project.includeInResume !== false) : [];
  const includedCertificates = profile.certificates ? profile.certificates.filter((cert: Certificate) => cert.includeInResume !== false) : [];
  
  // Group skills by domain
  const skillsByDomain: Record<string, string[]> = {};
  includedSkills.forEach((skill: Skill) => {
    if (!skillsByDomain[skill.domain]) {
      skillsByDomain[skill.domain] = [];
    }
    skillsByDomain[skill.domain].push(skill.name);
  });

  // Create about/summary section
  const summarySection = profile.about 
    ? `<div class="section">
        <h2 class="section-title">Summary</h2>
        <div class="section-divider"></div>
        <p class="content-indent">${profile.about}</p>
      </div>`
    : '';
  
  // Create education section
  const educationSection = includedEducations.length > 0 
    ? `<div class="section">
        <h2 class="section-title">Education</h2>
        <div class="section-divider"></div>
        ${includedEducations.map((education: Education) => `
          <p class="content-indent">
            <strong>${education.school}</strong> • ${education.degree}
            <span class="date-text">${formatDateForDisplay(education.endDate)}</span><br>
            GPA: ${education.cgpa}
          </p>
        `).join('')}
      </div>`
    : '';

  // Create experience section
  const experienceSection = includedExperiences.length > 0 
    ? `<div class="section">
        <h2 class="section-title">Experience</h2>
        <div class="section-divider"></div>
        ${includedExperiences.map((experience: Experience) => {
          const descriptionItems = experience.description
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => `<li>${line}</li>`)
            .join('');
            
          return `
            <div class="content-indent">
              <p class="entry-title"><strong>${experience.position}</strong> - ${experience.company}</p>
              <span class="date-text">${formatDateForDisplay(experience.startDate)} — ${formatDateForDisplay(experience.endDate)}</span>
              <ul class="bullet-list">
                ${descriptionItems}
              </ul>
            </div>
          `;
        }).join('')}
      </div>`
    : '';

  // Create skills section
  const skillsSection = Object.keys(skillsByDomain).length > 0 
    ? `<div class="section">
        <h2 class="section-title">Skills</h2>
        <div class="section-divider"></div>
        <div class="content-indent">
          ${Object.entries(skillsByDomain).map(([domain, skills]) => `
            <p class="skill-item"><strong>${domain}</strong>: ${skills.join(', ')}</p>
          `).join('')}
        </div>
      </div>`
    : '';

  // Create projects section
  const projectsSection = includedProjects.length > 0 
    ? `<div class="section">
        <h2 class="section-title">Projects</h2>
        <div class="section-divider"></div>
        ${includedProjects.map((project: Project) => {
          const descriptionItems = project.description
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => `<li>${line}</li>`)
            .join('');
            
          const links = [];
          if (project.githubUrl) links.push(`<li><strong>GitHub:</strong> <a href="${project.githubUrl}" target="_blank">${project.githubUrl}</a></li>`);
          if (project.projectUrl) links.push(`<li><strong>Project Link:</strong> <a href="${project.projectUrl}" target="_blank">${project.projectUrl}</a></li>`);
          
          return `
            <div class="content-indent">
              <p class="entry-title"><strong>${project.title}</strong></p>
              <span class="date-text">${formatDateForDisplay(project.startDate)} — ${formatDateForDisplay(project.endDate)}</span>
              <ul class="bullet-list">
                ${descriptionItems}
                ${links.join('')}
              </ul>
            </div>
          `;
        }).join('')}
      </div>`
    : '';

  // Create certificates section
  const certificatesSection = includedCertificates.length > 0 
    ? `<div class="section">
        <h2 class="section-title">Certifications</h2>
        <div class="section-divider"></div>
        ${includedCertificates.map((certificate: Certificate) => {
          const certUrl = certificate.credentialUrl 
            ? `<a href="${certificate.credentialUrl}" target="_blank">${certificate.name}</a>` 
            : certificate.name;
            
          return `
            <div class="content-indent">
              <p class="entry-title"><strong>${certUrl}</strong> <em>by ${certificate.issuer}</em>
              <span class="date-text">${formatDateForDisplay(certificate.issueDate)}</span></p>
            </div>
          `;
        }).join('')}
      </div>`
    : '';

  // Construct the complete HTML document
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume - ${profile.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    /* Multi-page specific styles */
    body.multi-page .resume-container {
      overflow: visible;
      height: auto;
    }
    
    /* Each section should have proper spacing for multi-page layout */
    .section {
      margin-bottom: 0.75rem;
      padding-bottom: 0.25rem;
      width: 100%;
      break-inside: avoid;
    }
    
    html, body {
      width: 100%;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.2;
      color: #333;
      width: 100%;
      max-width: 100%;
      padding: 0.5in 0.5in;
      background-color: white;
    }
    
    h1 {
      font-size: 1.5rem;
      font-weight: bold;
      text-align: center;
      margin-bottom: 0.5rem;
      color: #000;
    }
    
    h2 {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 1rem;
      color: #4B4B4B;
      letter-spacing: 0.05em;
      margin-bottom: 0.1rem;
      text-align: left;
    }
    
    a {
      color: #333;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    .header {
      text-align: center;
      margin-bottom: 1rem;
      width: 100%;
    }
    
    .contact-info {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.75rem;
      color: #666;
      margin-bottom: 1rem;
      width: 100%;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    
    .section-title {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 1rem;
      color: #4B4B4B;
      letter-spacing: 0.05em;
      margin-bottom: 0.1rem;
      width: 100%;
    }
    
    .section-divider {
      border-bottom: 1px solid #000;
      margin: 0.1rem 0 0.2rem 0;
      width: 100%;
    }
    
    .content-indent {
      margin-left: 0.3rem;
      font-size: 0.8rem;
      line-height: 1.2;
      margin-bottom: 0.15rem;
      color: #000;
      width: 100%;
      break-inside: avoid;
    }
    
    .date-text {
      float: right;
      font-size: 0.75rem;
      color: #000;
    }
    
    .bullet-list {
      padding-left: 1.2rem;
      list-style-type: disc;
      margin-top: 0.1rem;
      line-height: 1.2;
      font-size: 0.8rem;
      width: 100%;
    }
    
    .entry-title {
      font-weight: normal;
      display: inline-block;
      margin-bottom: 0.1rem;
      font-size: 0.8rem;
      color: #000;
      width: 70%;
    }
    
    .skill-item {
      font-size: 0.75rem;
      margin-bottom: 0.1rem;
      color: #000;
    }
    
    .icon {
      font-size: 0.7rem;
      margin-right: 0.2rem;
    }
    
    .resume-container {
      width: 100%;
      max-width: 100%;
      padding: 0;
      margin: 0 auto;
    }
    
    .no-print {
      display: block;
    }
    
    /* Each entry in experience, projects, etc. should avoid breaking across pages */
    .content-indent {
      break-inside: avoid;
    }
    
    @media print {
      /* Reset all styles for printing */
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      html, body {
        width: 100%;
        height: auto;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible;
      }
      
      body {
        margin: 0;
        padding: 0.5in !important;
        width: 100%;
        max-width: 100%;
        background-color: white !important;
      }
      
      .resume-container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* Support proper page breaks */
      .section {
        page-break-inside: avoid;
      }
      
      /* Allow content to flow to multiple pages */
      .resume-container {
        page-break-after: always;
        page-break-before: avoid;
      }
      
      /* Keep headers with their content */
      h2, .section-title, .section-divider {
        page-break-after: avoid;
      }
      
      /* Keep list items together */
      li {
        page-break-inside: avoid;
      }
      
      /* Keep the title block on the first page */
      .header {
        page-break-after: avoid;
      }
      
      /* Hide all non-printable elements */
      .no-print, 
      button, 
      [onclick],
      *[style*="margin-top: 30pt"] {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        width: 0 !important;
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
        opacity: 0 !important;
      }
      
      @page {
        margin: 0.5in;
        size: letter;
      }
    }
  </style>
</head>
<body>
  <div class="resume-container">
    <div class="header">
      <h1>${profile.name}</h1>
      <div class="contact-info">
        <div class="contact-item">
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </span>
          <span>${profile.phone || 'N/A'}</span>
        </div>
        <div class="contact-item">
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </span>
          <a href="mailto:${profile.email}">${profile.email}</a>
        </div>
        ${profile.linkedinUrl ? `
          <div class="contact-item">
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </span>
            <a href="${profile.linkedinUrl}" target="_blank">
              ${profile.linkedinUrl.replace('https://www.linkedin.com/in/', '')}
            </a>
          </div>
        ` : ''}
        ${profile.githubUrl ? `
          <div class="contact-item">
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            </span>
            <a href="${profile.githubUrl}" target="_blank">GitHub</a>
          </div>
        ` : ''}
        ${profile.portfolioUrl ? `
          <div class="contact-item">
            <span class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            </span>
            <a href="${profile.portfolioUrl}" target="_blank">Portfolio</a>
          </div>
        ` : ''}
      </div>
    </div>
    
    ${summarySection}
    ${educationSection}
    ${experienceSection}
    ${skillsSection}
    ${projectsSection}
    ${certificatesSection}

    <div class="no-print" style="margin-top: 30pt; text-align: center;">
      <button onclick="window.print();" style="padding: 10px 20px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 5px;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Print Resume (Ctrl+P)
      </button>
    </div>
  </div>
  
  <script>
    // Add keyboard shortcut for printing
    document.addEventListener('keydown', function(event) {
      // Check if Ctrl+P is pressed
      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        window.print();
      }
    });
    
    // Auto-scale the resume to fit the page when printing
    window.onbeforeprint = function() {
      // Add printing class to body
      document.body.classList.add('printing');
      
      // Remove all non-printable elements
      const noPrintElements = document.querySelectorAll('.no-print, button, [onclick]');
      noPrintElements.forEach(function(element) {
        element.style.display = 'none';
        element.style.visibility = 'hidden';
        element.style.position = 'absolute';
        element.style.left = '-9999px';
      });

      // Check if content requires multiple pages
      const contentHeight = document.querySelector('.resume-container').scrollHeight;
      const pageHeight = 11 * 96; // Letter paper height in pixels (11 inches * 96 DPI)
      
      // If content exceeds one page, add a class to enable multi-page layout
      if (contentHeight > pageHeight) {
        document.body.classList.add('multi-page');
      }
    };
    
    window.onafterprint = function() {
      // Remove printing class from body
      document.body.classList.remove('printing');
      document.body.classList.remove('multi-page');
      
      // Restore non-printable elements
      const noPrintElements = document.querySelectorAll('.no-print, button');
      noPrintElements.forEach(function(element) {
        element.style.display = '';
        element.style.visibility = '';
        element.style.position = '';
        element.style.left = '';
      });
    };
    
    // Hide print UI elements on load when in print preview
    if (window.matchMedia('print').matches || 
        window.location.search.includes('print=true')) {
      document.querySelectorAll('.no-print, button, [onclick]').forEach(el => {
        el.style.display = 'none';
      });
    }

    // Add page break suggestions based on content
    window.addEventListener('load', function() {
      const contentSections = document.querySelectorAll('.section');
      const pageHeight = 9.5 * 96; // Usable page height in pixels (11 inches - margins * 96 DPI)
      let currentHeight = document.querySelector('.header').offsetHeight;
      
      contentSections.forEach(function(section) {
        const sectionHeight = section.offsetHeight;
        
        // If adding this section would exceed page height, suggest a page break
        if (currentHeight + sectionHeight > pageHeight) {
          section.style.pageBreakBefore = 'always';
          currentHeight = sectionHeight;
        } else {
          currentHeight += sectionHeight;
        }
      });
    });
  </script>
</body>
</html>
`;

  return htmlContent;
};

// Helper for date formatting
const formatDateForDisplay = (dateString?: string): string => {
  if (!dateString) return 'Present';
  
  try {
    // Handle YYYY-MM format from month input type
    if (dateString.includes('-')) {
      const [year, month] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } 
    // Handle existing date strings
    else {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  } catch (e) {
    return dateString;
  }
};

// This is a backup in case we need LaTeX generation in the future
const generateLatexResume = (profile: UserProfile): string => {
  // Filter items that should be included in the resume
  const includedExperiences = profile.experiences ? profile.experiences.filter((exp: Experience) => exp.includeInResume !== false) : [];
  const includedEducations = profile.education ? profile.education.filter((edu: Education) => edu.includeInResume !== false) : [];
  const includedSkills = profile.skills ? profile.skills.filter((skill: Skill) => skill.includeInResume !== false) : [];
  const includedProjects = profile.projects ? profile.projects.filter((project: Project) => project.includeInResume !== false) : [];
  const includedCertificates = profile.certificates ? profile.certificates.filter((cert: Certificate) => cert.includeInResume !== false) : [];
  
  // Group skills by domain
  const skillsByDomain: Record<string, string[]> = {};
  includedSkills.forEach((skill: Skill) => {
    if (!skillsByDomain[skill.domain]) {
      skillsByDomain[skill.domain] = [];
    }
    skillsByDomain[skill.domain].push(skill.name);
  });
  
  // Create education section
  const educationSection = includedEducations.length > 0 ? `
\\header{Education}
${includedEducations.map((education: Education) => {
  const endDateStr = formatDateForLatex(education.endDate);
  
  return `
    \\school{${convertToLatex(education.school)}}{${convertToLatex(education.degree)}}{
      Graduation: ${endDateStr}
    }{\\textit{${education.degree} \\labelitemi GPA: ${education.cgpa}}}
  `;
}).join("\n")}
` : '';

  // Create experience section
  const experienceSection = includedExperiences.length > 0 ? `
\\header{Experience}
${includedExperiences.map((experience: Experience) => {
  const startDateStr = formatDateForLatex(experience.startDate);
  const endDateStr = formatDateForLatex(experience.endDate);
  
  // Process description to create bullet points from each line
  const descriptionBulletPoints = experience.description
    .split('\n')
    .filter((line: string) => line.trim().length > 0)
    .map((line: string) => `\\item ${convertToLatex(line.trim())}`)
    .join('\n');
  
  return `
    \\employer{${convertToLatex(experience.position)}}{--${convertToLatex(experience.company)}}{
      ${startDateStr} -- ${endDateStr}
    }{${convertToLatex(experience.location)}}
    ${experience.description ? `
      \\begin{bullet-list-minor}
        ${descriptionBulletPoints}
      \\end{bullet-list-minor}
    ` : ''}
  `;
}).join('\n')}
` : '';

  // Create certificates section
  const certificatesSection = includedCertificates.length > 0 ? `
\\header{Certifications}
${includedCertificates.map((certificate: Certificate) => {
  const issueDate = formatDateForLatex(certificate.issueDate);
  const certTitle = certificate.credentialUrl 
    ? `\\href[pdfnewwindow=true]{${certificate.credentialUrl}}{${convertToLatex(certificate.name)}}` 
    : convertToLatex(certificate.name);
  
  return `
  \\begin{bullet-list-major}
    \\item \\textbf{${certTitle}} \\textit{by ${convertToLatex(certificate.issuer)}} \\hfill ${issueDate}
  \\end{bullet-list-major}
  `;
}).join("\n")}
` : '';

  // LaTeX template (truncated for brevity)
  return "LaTeX template removed for brevity";
}; 