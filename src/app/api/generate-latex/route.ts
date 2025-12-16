import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type TemplateType = 'classic' | 'modern';

interface ResumeData {
  header: {
    name: string;
    title: string;
    location?: string;
    contact: {
      email: string;
      phone: string;
      linkedin: string;
      github: string;
      portfolio?: string;
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
    showDatesInResume?: boolean;
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
  certificates?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

// Helper function to escape LaTeX special characters
function convertToLatex(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/#/g, '\\#')
    .replace(/\$/g, '\\$')
    .replace(/%/g, '\\%')
    .replace(/&/g, '\\&')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}'); // Bold markdown
}

// Format URL for LaTeX
function formatUrlForLatex(url: string): string {
  if (!url) return '';
  return url.replace(/#/g, '\\#').replace(/%/g, '\\%').replace(/&/g, '\\&');
}

// Format date for LaTeX
function formatDateForLatex(dateString?: string): string {
  if (!dateString || dateString.trim() === '') {
    return 'Present';
  }
  if (dateString.toLowerCase().trim() === 'present') {
    return 'Present';
  }
  return convertToLatex(dateString);
}

// Format date range for LaTeX
function formatDateRangeForLatex(startDate?: string, endDate?: string): string {
  const start = formatDateForLatex(startDate);
  const end = formatDateForLatex(endDate);
  return `${start} -- ${end}`;
}

// Extract username from URL
function extractUsername(url: string, platform: 'linkedin' | 'github'): string {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/').filter(p => p);
    if (platform === 'linkedin' && parts[0] === 'in' && parts[1]) {
      return parts[1];
    }
    if (platform === 'github' && parts[0]) {
      return parts[0];
    }
  } catch (e) {
    // If not a valid URL, might be just username
    return url;
  }
  return '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const resumeData: ResumeData = body.resumeData || body;
    const template: TemplateType = body.template || 'classic';

    if (!resumeData || !resumeData.header) {
      return NextResponse.json({ error: 'Invalid resume data' }, { status: 400 });
    }

    // Generate LaTeX based on template choice
    let latexCode: string;
    if (template === 'modern') {
      latexCode = generateModernTemplate(resumeData);
    } else {
      latexCode = generateClassicTemplate(resumeData);
    }

    return NextResponse.json({ latex: latexCode });
  } catch (error) {
    console.error('Error generating LaTeX:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate LaTeX' },
      { status: 500 }
    );
  }
}

function generateClassicTemplate(resumeData: ResumeData): string {

    // Extract usernames
    const linkedinUsername = extractUsername(resumeData.header.contact.linkedin, 'linkedin');
    const githubUsername = extractUsername(resumeData.header.contact.github, 'github');

    // Create summary section
    const summarySection = resumeData.summary ? `
\\header{Summary}
${convertToLatex(resumeData.summary)}
\\vspace*{4pt}
` : '';

    // Create skills section
    const skillSection = resumeData.skills && Object.keys(resumeData.skills).length > 0 ? `
\\header{Skills}
\\begin{bullet-list-major}
${Object.entries(resumeData.skills).map(([domain, skills]) => {
  return `  \\item \\textbf{${convertToLatex(domain)}:} ${skills.map(s => convertToLatex(s)).join(', ')}`;
}).join('\n')}
\\end{bullet-list-major}
` : '';

    // Create experience section
    const experienceSection = resumeData.experience && resumeData.experience.length > 0 ? `
\\header{Experience}
${resumeData.experience.map(exp => {
  const dateRange = formatDateRangeForLatex(exp.startDate, exp.endDate);
  const highlights = exp.highlights.filter(h => h && h.trim()).map(h => 
    `  \\item ${convertToLatex(h.replace(/^[•\-*]\s*/, ''))}`
  ).join('\n');
  
  return `
\\employer{${convertToLatex(exp.company)}}{}{${dateRange}}{}
\\begin{bullet-list-minor}
${highlights}
\\end{bullet-list-minor}
\\vspace*{-2pt}
`;
}).join('\n')}
` : '';

    // Create education section
    const educationSection = resumeData.education && resumeData.education.length > 0 ? `
\\header{Education}
${resumeData.education.map(edu => {
  const showDates = edu.showDatesInResume !== false;
  const endDateStr = showDates ? formatDateForLatex(edu.endDate) : '';
  const gpaText = edu.gpa ? `\\labelitemi GPA: ${convertToLatex(edu.gpa)}` : '';
  
  return `
\\school{${convertToLatex(edu.school)}}{${convertToLatex(edu.degree)}}{${endDateStr}}{${gpaText}}
`;
}).join('\n')}
` : '';

    // Create projects section
    const projectSection = resumeData.projects && resumeData.projects.length > 0 ? `
\\header{Projects}
${resumeData.projects.map(proj => {
  const dateRange = formatDateRangeForLatex(proj.startDate, proj.endDate);
  const highlights = proj.highlights.filter(h => h && h.trim()).map(h => 
    `  \\item ${convertToLatex(h.replace(/^[•\-*]\s*/, ''))}`
  ).join('\n');
  
  return `
\\project{${convertToLatex(proj.title)}}{}{${dateRange}}{
\\begin{bullet-list-minor}
${highlights}
\\end{bullet-list-minor}
}
\\vspace*{-2pt}
`;
}).join('\n')}
` : '';

    // Create certificates section
    const certificatesSection = resumeData.certificates && resumeData.certificates.length > 0 ? `
\\header{Certifications}
\\begin{bullet-list-major}
${resumeData.certificates.map(cert => 
  `  \\item \\textbf{${convertToLatex(cert.name)}} -- ${convertToLatex(cert.issuer)} (${formatDateForLatex(cert.date)})`
).join('\n')}
\\end{bullet-list-major}
` : '';

    // Generate full LaTeX document
    const latexCode = `\\documentclass{article}
\\usepackage{geometry}
\\usepackage{lipsum}
% Set margins for the first page
\\newgeometry{top=0.5in, bottom=1in, left=0.2in, right=0.2in}
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
  {\\LARGE \\textbf{${convertToLatex(resumeData.header.name)}}} ${resumeData.header.title ? `{\\LARGE\\textbf{$\\vert$}} {\\large \\textbf{${convertToLatex(resumeData.header.title)}}}` : ''}\\\\
  \\vspace{3pt}
  ${resumeData.header.location ? `\\faMapMarker\\ ${convertToLatex(resumeData.header.location)} \\quad` : ''}
  \\faPhone\\ ${resumeData.header.contact.phone ? convertToLatex(resumeData.header.contact.phone) : 'N/A'} \\quad
  \\faEnvelope\\ \\href[pdfnewwindow=true]{mailto:${resumeData.header.contact.email}}{${convertToLatex(resumeData.header.contact.email)}} \\quad
  ${resumeData.header.contact.linkedin ? `\\href[pdfnewwindow=true]{${formatUrlForLatex(resumeData.header.contact.linkedin)}}{\\faLinkedin\\ ${convertToLatex(linkedinUsername)}}` : ''}
  ${resumeData.header.contact.github ? `\\quad \\href[pdfnewwindow=true]{${formatUrlForLatex(resumeData.header.contact.github)}}{\\faGithub\\ ${convertToLatex(githubUsername)}}` : ''}
  ${resumeData.header.contact.portfolio ? `\\quad \\href[pdfnewwindow=true]{${formatUrlForLatex(resumeData.header.contact.portfolio)}}{\\faGlobe\\ Portfolio}` : ''}
\\end{center}
${summarySection}
${skillSection}
${experienceSection}
${educationSection}
${projectSection}
${certificatesSection}
\\end{document}`;

  return latexCode;
}

function generateModernTemplate(resumeData: ResumeData): string {
  // Extract usernames
  const linkedinUsername = extractUsername(resumeData.header.contact.linkedin, 'linkedin');
  const githubUsername = extractUsername(resumeData.header.contact.github, 'github');

  // Create summary section
  const summarySection = resumeData.summary ? `
\\heading{Summary}
\\vspace{-1pt}${convertToLatex(resumeData.summary)}
` : '';

  // Create skills section
  const skillSection = resumeData.skills && Object.keys(resumeData.skills).length > 0 ? `
\\heading{Technical Skills}
${Object.entries(resumeData.skills).map(([domain, skills]) => {
  return `\\textbf{${convertToLatex(domain)}:} ${skills.map(s => convertToLatex(s)).join(', ')} \\\\`;
}).join('\n')}
` : '';

  // Create experience section
  const experienceSection = resumeData.experience && resumeData.experience.length > 0 ? `
\\heading{Professional Experience}
${resumeData.experience.map(exp => {
  const dateRange = formatDateRangeForLatex(exp.startDate, exp.endDate);
  const highlights = exp.highlights.filter(h => h && h.trim()).map(h => 
    `  \\item ${convertToLatex(h.replace(/^[•\-*]\s*/, ''))}`
  ).join('\n');
  
  return `\\textbf{${convertToLatex(exp.company)}}, {\\textbf{${convertToLatex(exp.title)}}} \\hfill \\textbf{${dateRange}}
\\begin{itemize}[leftmargin=*]
${highlights}
\\end{itemize}
\\vspace{2pt}`;
}).join('\n')}
` : '';

  // Create education section
  const educationSection = resumeData.education && resumeData.education.length > 0 ? `
\\heading{Education}
${resumeData.education.map(edu => {
  const showDates = edu.showDatesInResume !== false;
  const gpaText = edu.gpa ? ` $\\vert$ GPA: ${convertToLatex(edu.gpa)}` : '';
  
  return `\\textbf{${convertToLatex(edu.degree)}} $\\vert$ ${convertToLatex(edu.school)}${showDates && edu.location ? `, ${convertToLatex(edu.location)}` : ''}${gpaText} \\\\`;
}).join('\n')}
` : '';

  // Create projects section
  const projectSection = resumeData.projects && resumeData.projects.length > 0 ? `
\\heading{Project}
${resumeData.projects.map(proj => {
  const dateRange = formatDateRangeForLatex(proj.startDate, proj.endDate);
  const highlights = proj.highlights.filter(h => h && h.trim()).map(h => 
    `  \\item ${convertToLatex(h.replace(/^[•\-*]\s*/, ''))}`
  ).join('\n');
  
  return `\\textbf{${convertToLatex(proj.title)}} \\hfill \\textbf{${dateRange}}
\\begin{itemize}[leftmargin=*]
${highlights}
\\end{itemize}`;
}).join('\n\n')}
` : '';

  // Create certificates section
  const certificatesSection = resumeData.certificates && resumeData.certificates.length > 0 ? `
\\heading{Certifications}
${resumeData.certificates.map(cert => 
  `\\textbf{${convertToLatex(cert.name)}} $\\vert$ ${convertToLatex(cert.issuer)}, ${formatDateForLatex(cert.date)} \\\\`
).join('\n')}
` : '';

  // Build contact line
  const contactParts = [];
  if (resumeData.header.location) contactParts.push(convertToLatex(resumeData.header.location));
  if (resumeData.header.contact.phone) contactParts.push(convertToLatex(resumeData.header.contact.phone));
  if (resumeData.header.contact.email) contactParts.push(`\\href{mailto:${resumeData.header.contact.email}}{${convertToLatex(resumeData.header.contact.email)}}`);
  const contactLine = contactParts.join(' $\\vert$ ');

  const linkedinLine = resumeData.header.contact.linkedin ? 
    `\\href{${formatUrlForLatex(resumeData.header.contact.linkedin)}}{\\underline{${formatUrlForLatex(resumeData.header.contact.linkedin)}}}` : '';

  // Generate full LaTeX document
  const latexCode = `\\documentclass[letterpaper,10pt]{article}

\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage{fontawesome5}
\\usepackage{multicol}
\\usepackage{bookmark}
\\usepackage{lastpage}
\\usepackage{CormorantGaramond}
\\usepackage{charter}
\\usepackage[left=0.3in, right=0.25in, top=0.3in, bottom=0.3in]{geometry}

% Accent Colours
\\definecolor{accentTitle}{HTML}{0e6e55}
\\definecolor{accentText}{HTML}{0e6e55}
\\definecolor{accentLine}{HTML}{0e6e55}

% Page Geometry & Fonts
\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\urlstyle{same}

% Sections formatting - COMPACT SPACING
\\titleformat{\\section}{\\color{accentTitle}\\bfseries\\normalsize\\noindent\\MakeUppercase}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{5pt}{3pt}

% Itemize spacing - more compact
\\setlist[itemize]{noitemsep, topsep=1pt, partopsep=0pt, parsep=0pt, left=0pt, label=\\textbullet}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}
\\setlength{\\parskip}{1pt}

\\begin{document}

\\begin{center}
    {\\Large \\textbf{${convertToLatex(resumeData.header.name)}}} ${resumeData.header.title ? `{\\Large\\textbf{$\\vert$}} {\\normalsize \\textbf{${convertToLatex(resumeData.header.title)}}}` : ''} \\\\
    \\vspace{1pt}
    {\\small ${contactLine}} \\\\
    {\\small ${linkedinLine}}
\\end{center}

% --- Section format with colored line ---
\\newcommand{\\heading}[1]{
  \\vspace{4pt}
  \\textcolor{accentTitle}{\\normalsize\\bfseries\\MakeUppercase{#1}} \\\\[-2pt]
  \\textcolor{accentLine}{\\rule{\\linewidth}{1pt}} \\vspace{1pt}
}

${summarySection}
${skillSection}
${experienceSection}
${educationSection}
${projectSection}
${certificatesSection}

\\end{document}`;

  return latexCode;
}

