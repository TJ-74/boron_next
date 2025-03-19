import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

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

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  about: string;
  profileImage?: string;
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
    
    // Return the LaTeX content as plain text
    return new NextResponse(latexContent, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error generating LaTeX resume:', error);
    return NextResponse.json({ error: 'Failed to generate LaTeX resume' }, { status: 500 });
  }
}

// Helper function to format dates for LaTeX
const formatDateForLatex = (dateString?: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (e) {
    return dateString;
  }
};

// Helper function to convert text to LaTeX-safe format
const convertToLatex = (text: string): string => {
  return text
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/</g, '\\textless{}')
    .replace(/>/g, '\\textgreater{}');
};

// Function to generate a LaTeX resume from the user's profile data
const generateLatexResume = (profile: UserProfile): string => {
  // Filter items that should be included in the resume
  const includedExperiences = profile.experiences.filter(exp => exp.includeInResume !== false);
  const includedEducations = profile.education.filter(edu => edu.includeInResume !== false);
  const includedSkills = profile.skills.filter(skill => skill.includeInResume !== false);
  const includedProjects = profile.projects.filter(project => project.includeInResume !== false);
  
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
${includedExperiences.map(experience => {
  const startDateStr = formatDateForLatex(experience.startDate);
  const endDateStr = formatDateForLatex(experience.endDate);
  
  // Process description to create bullet points from each line
  const descriptionBulletPoints = experience.description
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => `\\item ${convertToLatex(line.trim())}`)
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

  // Create projects section
  const projectSection = includedProjects.length > 0 ? `
\\header{Projects}
${includedProjects.map(project => {
  const startDateStr = formatDateForLatex(project.startDate);
  const endDateStr = formatDateForLatex(project.endDate);
  
  // Process description to create bullet points from each line
  const descriptionBulletPoints = project.description
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => `\\item ${convertToLatex(line.trim())}`)
    .join('\n');
  
  return `
    \\project{${convertToLatex(project.title)}}{${convertToLatex(project.technologies)}}{
      ${startDateStr} -- ${endDateStr}
    }{
      \\begin{bullet-list-minor}
        ${descriptionBulletPoints}
        ${project.githubUrl ? `\\item \\textbf{GitHub:} \\href{${project.githubUrl}}{${project.githubUrl}}` : ''}
        ${project.projectUrl ? `\\item \\textbf{Project Link:} \\href{${project.projectUrl}}{${project.projectUrl}}` : ''}
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

  // Construct the complete LaTeX document
  const latexCode = `\\documentclass{article}
\\usepackage{geometry}
\\usepackage{lipsum}
% Set margins for the first page
\\newgeometry{top=0.5in, bottom=1in, left=1in, right=1in}
\\usepackage{enumitem}
\\setlist{nosep}
\\usepackage{hyperref}
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

\\newcommand{\\contact}[3]{
  \\vspace*{5pt}
  \\begin{center}
    {\\LARGE \\scshape {#1}}\\\\
    \\vspace{3pt}
    #2 
    \\vspace{2pt}
    #3
  \\end{center}
  \\vspace*{-8pt}
}
\\newcommand{\\school}[4]{
  \\textbf{#1} \\labelitemi #2 \\hfill #3 \\\\ #4 \\vspace*{5pt}
}
\\newcommand{\\employer}[4]{{
  \\vspace*{2pt}%
  \\textbf{#1} #2 \\hfill #3\\\\ #4 \\vspace*{2pt}}
}
\\newcommand{\\project}[4]{{
  \\vspace*{2pt}% 
  \\textbf{#1} #2 \\hfill #3\\\\ #4 \\vspace*{2pt}}
}
\\newcommand{\\lineunder}{
  \\vspace*{-8pt} \\\\ \\hspace*{-18pt} 
  \\hrulefill \\\\
}
\\newcommand{\\header}[1]{{
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
  {\\LARGE \\textbf{${convertToLatex(profile.name)}}} \\\\
  \\faPhone\\ ${profile.phone || 'N/A'} \\quad
  \\faEnvelope\\ \\href{mailto:${profile.email}}{${profile.email}} \\quad
  ${profile.linkedinUrl ? `\\faLinkedin\\ \\url{${profile.linkedinUrl}}` : ''}
  ${profile.githubUrl ? `\\quad \\faGithub\\ \\url{${profile.githubUrl}}` : ''}
  ${profile.portfolioUrl ? `\\quad \\faGlobe\\ \\url{${profile.portfolioUrl}}` : ''}
\\end{center}
${summarySection}
${educationSection}
${experienceSection}
${skillSection}
${projectSection}
\\end{document}`;

  return latexCode;
}; 