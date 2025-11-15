import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { convertToLatex, formatDateForLatex, formatDateRangeForLatex, formatUrlForLatex } from '@/app/lib/latexUtils';

export const dynamic = 'force-dynamic';

// Interface definitions
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

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  about: string;
  profileImage?: string;
  profileImageBase64?: string;
  profileImageMimeType?: string;
  profileImageName?: string;
  phone?: string;
  location?: string;
  title?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certificates: Certificate[];
}

// Add helper function to get the last path segment of a URL
const getLastPathSegment = (url: string): string => {
  try {
    return url.split('/').filter(Boolean).pop() || '';
  } catch (e) {
    return '';
  }
};

// Helper function to ensure URL has protocol
const ensureFullUrl = (url: string): string => {
  if (!url) return '';
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    let { uid } = params;
    
    // Remove .tex extension if present (e.g., "abc123.tex" -> "abc123")
    if (uid.endsWith('.tex')) {
      uid = uid.slice(0, -4);
    }
    
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
    
    // Return the LaTeX content with appropriate headers
    return new NextResponse(latexContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `inline; filename="resume.tex"`,
      },
    });
  } catch (error) {
    console.error('Error generating LaTeX resume:', error);
    return NextResponse.json({ error: 'Failed to generate LaTeX resume' }, { status: 500 });
  }
}

// Function to generate a LaTeX resume from the user's profile data
const generateLatexResume = (profile: UserProfile): string => {
  // Filter items that should be included in the resume
  const includedExperiences = profile.experiences.filter(exp => exp.includeInResume !== false);
  const includedEducations = profile.education.filter(edu => edu.includeInResume !== false);
  const includedSkills = profile.skills.filter(skill => skill.includeInResume !== false);
  const includedProjects = profile.projects.filter(project => project.includeInResume !== false);
  const includedCertificates = profile.certificates?.filter(cert => cert.includeInResume !== false) || [];
  
  // Group skills by domain
  const skillsByDomain: Record<string, string[]> = {};
  includedSkills.forEach(skill => {
    if (!skillsByDomain[skill.domain]) {
      skillsByDomain[skill.domain] = [];
    }
    skillsByDomain[skill.domain].push(skill.name);
  });
  
  // Create education section
  const educationSection = includedEducations.length > 0 ? `
\\header{Education}
${includedEducations.map(education => {
  const endDateStr = formatDateForLatex(education.endDate);
  const cgpaText = education.cgpa ? `\\labelitemi GPA: ${convertToLatex(education.cgpa)}` : '';
  
  return `
    \\school{${convertToLatex(education.school)}}{${convertToLatex(education.degree)}}{${endDateStr}}{${cgpaText}}
  `;
}).join("\n")}
` : '';

  // Create experience section
  const experienceSection = includedExperiences.length > 0 ? `
\\header{Experience}
${includedExperiences.map(experience => {
  const dateRange = formatDateRangeForLatex(experience.startDate, experience.endDate);
  
  // Process description to create bullet points from each line
  const descriptionBulletPoints = experience.description
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => `\\item ${convertToLatex(line.trim())}`)
    .join('\n');
  
  return `
    \\employer{${convertToLatex(experience.position)}}{--${convertToLatex(experience.company)}}{
      ${dateRange}
    }{${convertToLatex(experience.location)}}
    ${experience.description ? `
      \\begin{bullet-list-minor}
        ${descriptionBulletPoints}
      \\end{bullet-list-minor}
    ` : ''}
  `;
}).join('\n')}
` : '';

  // Create projects section
  const projectSection = includedProjects.length > 0 ? `
\\header{Projects}
${includedProjects.map(project => {
  const dateRange = formatDateRangeForLatex(project.startDate, project.endDate);
  
  // Process description to create bullet points from each line
  const descriptionBulletPoints = project.description
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => `\\item ${convertToLatex(line.trim())}`)
    .join('\n');
  
  // Create project title with optional link and GitHub icon
  const projectTitle = project.projectUrl 
    ? `\\href[pdfnewwindow=true]{${formatUrlForLatex(ensureFullUrl(project.projectUrl))}}{${convertToLatex(project.title)}}` 
    : convertToLatex(project.title);
  const githubLink = project.githubUrl 
    ? `\\hspace{1em}\\href[pdfnewwindow=true]{${formatUrlForLatex(ensureFullUrl(project.githubUrl))}}{\\faGithub}` 
    : '';
  
  return `
    \\project{${projectTitle}${githubLink}}{}{
      ${dateRange}
    }{
      \\begin{bullet-list-minor}
        ${descriptionBulletPoints}
      \\end{bullet-list-minor}
    }
  `;
}).join("\n")}
` : '';

  // Create skills section
  const skillSection = Object.keys(skillsByDomain).length > 0 ? `
\\header{Skills}
${Object.entries(skillsByDomain).map(([domain, skills]) => `
  \\begin{bullet-list-major}
    \\item \\textbf{${convertToLatex(domain)}:} ${convertToLatex(skills.join(', '))}
  \\end{bullet-list-major}
`).join("\n")}
` : '';

  // Create about/summary section
  const summarySection = profile.about ? `
\\header{Summary}
\\textit{${convertToLatex(profile.about)}}
` : '';

  // In the contact section, update to show usernames
  const linkedinUsername = profile.linkedinUrl ? getLastPathSegment(profile.linkedinUrl) : '';
  const githubUsername = profile.githubUrl ? getLastPathSegment(profile.githubUrl) : '';

  // Create certificates section
  const certificatesSection = includedCertificates.length > 0 ? `
\\header{Certifications}
${includedCertificates.map(certificate => {
  const issueDate = formatDateForLatex(certificate.issueDate);
  const certTitle = certificate.credentialUrl 
    ? `\\href[pdfnewwindow=true]{${formatUrlForLatex(ensureFullUrl(certificate.credentialUrl))}}{${convertToLatex(certificate.name)}}` 
    : convertToLatex(certificate.name);
  
  return `
  \\begin{bullet-list-major}
    \\item \\textbf{${certTitle}} \\textit{by ${convertToLatex(certificate.issuer)}} \\hfill ${issueDate}
  \\end{bullet-list-major}
  `;
}).join("\n")}
` : '';

  // Construct the complete LaTeX document
  const latexCode = `\\documentclass{article}
\\usepackage{geometry}
\\usepackage{lipsum}
% Set margins for the first page
\\newgeometry{top=0.5in, bottom=1in, left=1in, right=1in}
\\usepackage{enumitem}
\\setlist{nosep}
\\usepackage[hidelinks,pdfnewwindow=true]{hyperref}
\\usepackage{fancyhdr}
\\pagestyle{fancy}
\\renewcommand{\\headrulewidth}{0pt}
\\rfoot{Page \\thepage}
\\usepackage{fontawesome}
\\setlength{\\textheight}{9.5in}
\\setlength{\\footskip}{30pt} 
\\pagestyle{fancy}
\\raggedright
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\setlength{\\hoffset}{-2pt}
\\setlength{\\footskip}{30pt}
\\def\\bull{\\vrule height 0.8ex width .7ex depth -.1ex }

% Improve page breaks
\\usepackage{needspace}
\\usepackage{placeins}

\\newcommand{\\contact}[3]{%
  \\vspace*{5pt}%
  \\begin{center}%
    {\\LARGE \\scshape {#1}}\\\\%
    \\vspace{3pt}%
    #2%
    \\vspace{2pt}%
    #3%
  \\end{center}%
  \\vspace*{-8pt}%
}

\\newcommand{\\school}[4]{%
  \\needspace{2\\baselineskip}%
  \\textbf{#1} \\labelitemi #2 \\hfill #3%
  \\\\%
  \\ifx\\empty#4\\empty\\else{\\textit{#4}}\\fi%
  \\vspace*{5pt}%
}

\\newcommand{\\employer}[4]{{%
  \\needspace{3\\baselineskip}%
  \\vspace*{2pt}%
  \\textbf{#1} #2 \\hfill #3\\\\%
  #4%
  \\vspace*{2pt}%
}}

\\newcommand{\\project}[4]{{%
  \\needspace{3\\baselineskip}%
  \\vspace*{2pt}%
  \\textbf{#1}\\hfill #3\\\\%
  #4%
  \\vspace*{2pt}%
}}

\\newcommand{\\lineunder}{
  \\vspace*{-8pt} \\\\ \\hspace*{-18pt} 
  \\hrulefill \\\\
}
\\newcommand{\\header}[1]{{
  \\needspace{4\\baselineskip}
  \\FloatBarrier
  \\hspace*{-15pt}\\vspace*{6pt} \\textsc{#1}} \\vspace*{-6pt} 
  \\lineunder
}
\\newcommand{\\content}{
  \\vspace*{2pt}%
}
\\renewcommand{\\labelitemi}{
  $\\vcenter{\\hbox{\\tiny$\\bullet$}}$\\hspace*{3pt}
}
\\renewcommand{\\labelitemii}{
  $\\vcenter{\\hbox{\\tiny$\\bullet$}}$\\hspace*{-3pt}
}
\\newenvironment{bullet-list-major}{
  \\begin{list}{\\labelitemii}{\\setlength\\leftmargin{3pt} 
  \\topsep 0pt \\itemsep -2pt}}{\\vspace*{4pt}\\end{list}
}
\\newenvironment{bullet-list-minor}{
  \\begin{list}{\\labelitemii}{\\setlength\\leftmargin{15pt} 
  \\topsep 0pt \\itemsep -2pt}}{\\vspace*{4pt}\\end{list}
}
\\begin{document}
\\small
\\smallskip
\\vspace*{-44pt}
\\begin{center}
  {\\LARGE \\textbf{${convertToLatex(profile.name)}}}\\\\
  \\vspace{3pt}
  \\faPhone\\ ${profile.phone ? convertToLatex(profile.phone) : 'N/A'} \\quad
  \\faEnvelope\\ \\href[pdfnewwindow=true]{mailto:${profile.email}}{${convertToLatex(profile.email)}} \\quad
  ${profile.linkedinUrl ? `\\href[pdfnewwindow=true]{${formatUrlForLatex(ensureFullUrl(profile.linkedinUrl))}}{\\faLinkedin\\ ${convertToLatex(linkedinUsername)}}` : ''}
  ${profile.githubUrl ? `\\quad \\href[pdfnewwindow=true]{${formatUrlForLatex(ensureFullUrl(profile.githubUrl))}}{\\faGithub\\ ${convertToLatex(githubUsername)}}` : ''}
  ${profile.portfolioUrl ? `\\quad \\href[pdfnewwindow=true]{${formatUrlForLatex(ensureFullUrl(profile.portfolioUrl))}}{\\faGlobe\\ Portfolio}` : ''}
\\end{center}
${summarySection}
${educationSection}
${experienceSection}
${skillSection}
${projectSection}
${certificatesSection}
\\end{document}`;

  return latexCode;
}; 