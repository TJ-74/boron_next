'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Loader2, MessageCircle, Zap, X, MessageSquare, FileText, User, UserCircle, Briefcase, GraduationCap, Award, Code, FolderKanban } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/app/components/ui/button";
import { v4 as uuidv4 } from 'uuid';
import Navbar from "@/app/components/ui/navbar";
import { 
  saveUserProfileSummary, 
  getUserProfileSummary, 
  addExperienceItem, 
  addEducationItem, 
  addSkillItem, 
  addProjectItem,
  addCertificateItem,
  UserProfileSummary
} from '@/app/lib/userProfileService';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import type { 
  UserProfile as ProfileType,
  ProfileInfo,
  Experience,
  Education,
  Skill,
  Project,
  Certificate
} from '@/app/types/profile';

// Import profile section components
import ProfileHeader from '@/app/components/profile/ProfileHeader';
import AboutSection from '@/app/components/profile/AboutSection';
import ExperienceSection from '@/app/components/profile/ExperienceSection';
import EducationSection from '@/app/components/profile/EducationSection';
import SkillsSection from '@/app/components/profile/SkillsSection';
import ProjectsSection from '@/app/components/profile/ProjectsSection';
import CertificatesSection from '@/app/components/profile/CertificatesSection';
import PdfViewer from '../components/profile/PdfViewer';
import BoronBot from '../components/profile/ChatBot';

// Define interfaces for profile data
interface UserProfile extends ProfileInfo {
  about: string;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certificates: Certificate[];
}

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'modern'>('classic');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user?.uid) {
          throw new Error('User not authenticated');
        }

        // Try to fetch profile from MongoDB
        const savedProfile = await getUserProfileSummary(user.uid);
        
        if (savedProfile) {
          // Use the saved profile data
          setProfile({
            name: savedProfile.name,
            email: savedProfile.email,
            profileImage: savedProfile.profileImage || user?.photoURL || 'https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg?t=st=1744854995~exp=1744858595~hmac=bcb9142a464b4b807e13a8a4b8479b29d1ba1154f80c9b02091ab4a462a3c5fe&w=826',
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
        } else {
          // Create a minimal profile with user info from Firebase
          const defaultProfile: UserProfile = {
            name: user?.displayName || 'Your Name',
            email: user?.email || 'john@example.com',
            profileImage: user?.photoURL || 'https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg?t=st=1744854995~exp=1744858595~hmac=bcb9142a464b4b807e13a8a4b8479b29d1ba1154f80c9b02091ab4a462a3c5fe&w=826',
            phone: '',
            location: '',
            title: '',
            linkedinUrl: '',
            githubUrl: '',
            portfolioUrl: '',
            about: '',
            experiences: [],
            education: [],
            skills: [],
            projects: [],
            certificates: []
          };
          
          setProfile(defaultProfile);
          
          // Save the default profile to MongoDB
          await saveProfileToMongoDB(defaultProfile);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Function to save profile to MongoDB
  const saveProfileToMongoDB = async (profileData: UserProfile, deferSave: boolean = false) => {
    console.log("MONGODB: saveProfileToMongoDB called with profile data:", {
      ...profileData,
      // Abbreviate large arrays to keep log readable
      experiences: `[${profileData.experiences.length} items]`,
      education: `[${profileData.education.length} items]`,
      skills: `[${profileData.skills.length} items]`,
      projects: `[${profileData.projects.length} items]`
    });
    console.log("MONGODB: deferSave =", deferSave);
    
    if (!user?.uid) return;
    
    try {
      if (!deferSave) {
        setSaveStatus('saving');
      }
      
      // Create a summary object with all profile data to store in MongoDB
      const profileSummary: UserProfileSummary = {
        uid: user.uid,
        name: profileData.name,
        email: profileData.email,
        about: profileData.about,
        profileImage: profileData.profileImage,
        phone: profileData.phone,
        location: profileData.location,
        title: profileData.title,
        linkedinUrl: profileData.linkedinUrl,
        githubUrl: profileData.githubUrl,
        portfolioUrl: profileData.portfolioUrl,
        experiences: profileData.experiences,
        education: profileData.education,
        skills: profileData.skills,
        projects: profileData.projects,
        certificates: profileData.certificates
      };
      
      console.log("MONGODB: Saving profile to MongoDB API...");
      await saveUserProfileSummary(profileSummary);
      console.log("MONGODB: Profile saved successfully to MongoDB");
      
      if (!deferSave) {
        setSaveStatus('success');
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      }
    } catch (error) {
      console.error('MONGODB ERROR: Failed to save profile to MongoDB:', error);
      
      if (!deferSave) {
        setSaveStatus('error');
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      }
    }
  };

  // Function to refresh the PDF viewer if it's open
  const refreshPdfIfOpen = () => {
    if (isPdfViewerOpen && user?.uid) {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/api/pdf-resume/${user.uid}?t=${new Date().getTime()}`;
      setPdfUrl(apiUrl);
    }
  };

  // Profile update handlers
  const handleUpdateProfile = async (updatedInfo: Partial<ProfileInfo>) => {
    // Update local state
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        const updatedProfile = profile ? { ...profile, ...updatedInfo } : null;
        setProfile(updatedProfile);
        
        // Save to MongoDB
        if (updatedProfile) {
          await saveProfileToMongoDB(updatedProfile);
          refreshPdfIfOpen(); // Refresh PDF after profile update
        }
        
        resolve();
      }, 1000);
    });
  };

  const handleUploadImage = async (file: File) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        if (!user?.uid) {
          throw new Error('User not authenticated');
        }
        
        // Create form data for the image upload
        const formData = new FormData();
        formData.append('image', file);
        formData.append('uid', user.uid);
        
        // Upload the image to our API as binary data
        const uploadResponse = await fetch('/api/profile/image', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }
        
        // Generate the image URL from our image API endpoint
        const imageUrl = `/api/profile/image/${user.uid}?t=${new Date().getTime()}`; // Add timestamp to prevent caching
        
        const updatedProfile = profile ? { ...profile, profileImage: imageUrl } : null;
        setProfile(updatedProfile);
        
        // Save image URL to MongoDB profile
        if (updatedProfile) {
          await saveProfileToMongoDB(updatedProfile);
        }
        
        resolve();
      } catch (error) {
        console.error('Failed to upload profile image:', error);
        reject(error);
      }
    });
  };

  const handleUploadResume = async (file: File) => {
    // TODO: Replace with actual resume upload API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('Resume uploaded:', file.name);
        resolve();
      }, 1500);
    });
  };

  const handleUpdateAbout = async (about: string) => {
    console.log("HANDLER: handleUpdateAbout called with:", about);
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        const updatedProfile = profile ? { ...profile, about } : null;
        setProfile(updatedProfile);
        
        // Save to MongoDB
        if (updatedProfile) {
          console.log("HANDLER: Saving updated about to MongoDB");
          await saveProfileToMongoDB(updatedProfile);
          console.log("HANDLER: About section saved to MongoDB");
          refreshPdfIfOpen(); // Refresh PDF after about update
        }
        
        resolve();
      }, 1000);
    });
  };

  const handlePreviewInOverleaf = async () => {
    // Show template selection modal
    if (!profile || !user?.uid) return;
    setShowTemplateModal(true);
  };

  const handleOpenOverleafWithTemplate = async (template: 'classic' | 'modern') => {
    // This function generates a LaTeX document based on the user's profile
    // and opens it in Overleaf with the selected template
    
    if (!profile || !user?.uid) return;
    
    try {
      // First, fetch the LaTeX content with the selected template
      const response = await fetch(`/api/latex-resume/${user.uid}?template=${template}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate LaTeX');
      }
      
      const latexContent = await response.text();
      
      // Create a unique session ID for this preview
      const sessionId = `profile_${user.uid}_${Date.now()}`;
      
      // Store the LaTeX content in the session endpoint
      const storeResponse = await fetch(`/api/profile-latex/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latexContent }),
      });
      
      if (!storeResponse.ok) {
        throw new Error('Failed to store LaTeX content');
      }
      
      // Create the Overleaf URL using the session endpoint
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/api/profile-latex/${sessionId}.tex`;
      const encodedUri = encodeURIComponent(apiUrl);
      const overleafUrl = `https://www.overleaf.com/docs?snip_uri=${encodedUri}`;
      
      // Open the Overleaf link in a new window
      window.open(overleafUrl, '_blank');
      
      // Close the modal
      setShowTemplateModal(false);
      
      console.log('Opening LaTeX resume in Overleaf with template:', template);
    } catch (error) {
      console.error('Error generating LaTeX resume:', error);
    }
  };
  
  const handleViewRawLatex = async () => {
    if (!profile || !user?.uid) return;
    
    try {
      // Directly open the LaTeX API URL in a new tab with .tex extension
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/api/latex-resume/${user.uid}.tex`;
      window.open(apiUrl, '_blank');
    } catch (error) {
      console.error('Error opening LaTeX:', error);
    }
  };

  const handleViewPdf = async () => {
    if (!profile || !user?.uid) return;
    
    try {
      // Create the PDF URL but don't open a new tab
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/api/pdf-resume/${user.uid}`;
      setPdfUrl(apiUrl);
      setIsPdfViewerOpen(true);
    } catch (error) {
      console.error('Error opening PDF resume:', error);
    }
  };
  
  // Helper function to format dates for LaTeX
  const formatDateForLatex = (dateString?: string, isPresent?: boolean): string => {
    if (isPresent) return 'Present';
    if (!dateString) return '';
    
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
    const latexCode = `
\\documentclass{article}
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
\\end{document}
`;

    return latexCode;
  };

  // Experience CRUD handlers
  const handleAddExperience = async (experience: Omit<Experience, 'id'>) => {
    console.log("HANDLER: handleAddExperience called with:", JSON.stringify(experience, null, 2));
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        // Create new experience object with ID
        const newExperience = { ...experience, id: uuidv4() };
        
        // Update local state immediately
        const updatedProfile = profile ? {
          ...profile,
          experiences: [...profile.experiences, newExperience]
        } : null;
        
        setProfile(updatedProfile);
        
        try {
          // Do the save
          if (updatedProfile && user?.uid) {
            console.log("HANDLER: Saving new experience to MongoDB");
            
            try {
              // Use the individual item API if called from resume parser
              const callerStack = new Error().stack || '';
              const isFromParser = callerStack.includes('handleApplyParsedData');
              
              if (isFromParser) {
                console.log("HANDLER: Called from resume parser, using direct API");
                const refreshedProfile = await addExperienceItem(user.uid, newExperience);
                
                // Update local state with refreshed data from MongoDB
                if (refreshedProfile) {
                  console.log("HANDLER: Updating local state with refreshed profile from MongoDB");
                  setProfile(prevProfile => {
                    if (!prevProfile) return null;
                    return {
                      ...prevProfile,
                      experiences: refreshedProfile.experiences || prevProfile.experiences
                    };
                  });
                }
              } else {
                console.log("HANDLER: Standard call, saving full profile");
                await saveProfileToMongoDB(updatedProfile);
              }
              
              console.log("HANDLER: Experience saved to MongoDB");
              refreshPdfIfOpen(); // Refresh PDF after adding experience
            } catch (saveError) {
              console.error("HANDLER: Error saving experience:", saveError);
            }
          }
        } finally {
          resolve();
        }
      }, 1000);
    });
  };

  const handleUpdateExperience = async (experience: Experience) => {
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        const updatedProfile = profile ? {
          ...profile,
          experiences: profile.experiences.map(exp => 
              exp.id === experience.id ? experience : exp
            )
        } : null;
        
        setProfile(updatedProfile);
        
        // Save to MongoDB
        if (updatedProfile) {
          await saveProfileToMongoDB(updatedProfile);
          refreshPdfIfOpen(); // Refresh PDF after updating experience
        }
        
        resolve();
      }, 1000);
    });
  };

  const handleDeleteExperience = async (id: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        const updatedProfile = profile ? {
          ...profile,
          experiences: profile.experiences.filter(exp => exp.id !== id)
        } : null;
        
        setProfile(updatedProfile);
        
        // Save to MongoDB
        if (updatedProfile) {
          await saveProfileToMongoDB(updatedProfile);
          refreshPdfIfOpen(); // Refresh PDF after deleting experience
        }
        
        resolve();
      }, 1000);
    });
  };

  const handleReorderExperiences = async (reorderedExperiences: Experience[]) => {
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        const updatedProfile = profile ? {
          ...profile,
          experiences: reorderedExperiences
        } : null;
        
        setProfile(updatedProfile);
        
        // Save to MongoDB
        if (updatedProfile) {
          await saveProfileToMongoDB(updatedProfile);
          refreshPdfIfOpen(); // Refresh PDF after reordering experiences
        }
        
        resolve();
      }, 1000);
    });
  };

  // Education CRUD handlers
  const handleAddEducation = async (education: Omit<Education, 'id'>) => {
    console.log("HANDLER: handleAddEducation called with:", JSON.stringify(education, null, 2));
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        // Create new education object with ID
        const newEducation = { ...education, id: uuidv4() };
        
        // Update local state immediately
        const updatedProfile = profile ? {
          ...profile,
          education: [...profile.education, newEducation]
        } : null;
        
        setProfile(updatedProfile);
        
        try {
          // Do the save
          if (updatedProfile && user?.uid) {
            console.log("HANDLER: Saving new education to MongoDB");
            
            try {
              // Use the individual item API if called from resume parser
              const callerStack = new Error().stack || '';
              const isFromParser = callerStack.includes('handleApplyParsedData');
              
              if (isFromParser) {
                console.log("HANDLER: Called from resume parser, using direct API");
                const refreshedProfile = await addEducationItem(user.uid, newEducation);
                
                // Update local state with refreshed data from MongoDB
                if (refreshedProfile) {
                  console.log("HANDLER: Updating local state with refreshed profile from MongoDB");
                  setProfile(prevProfile => {
                    if (!prevProfile) return null;
                    return {
                      ...prevProfile,
                      education: refreshedProfile.education || prevProfile.education
                    };
                  });
                }
              } else {
                console.log("HANDLER: Standard call, saving full profile");
                await saveProfileToMongoDB(updatedProfile);
              }
              
              console.log("HANDLER: Education saved to MongoDB");
              refreshPdfIfOpen(); // Refresh PDF after adding education
            } catch (saveError) {
              console.error("HANDLER: Error saving education:", saveError);
            }
          }
        } finally {
          resolve();
        }
      }, 1000);
    });
  };

  const handleUpdateEducation = async (education: Education) => {
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        const updatedProfile = profile ? {
          ...profile,
          education: profile.education.map(edu => 
              edu.id === education.id ? education : edu
            )
        } : null;
        
        setProfile(updatedProfile);
        
        // Save to MongoDB
        if (updatedProfile) {
          await saveProfileToMongoDB(updatedProfile);
          refreshPdfIfOpen(); // Refresh PDF after updating education
        }
        
        resolve();
      }, 1000);
    });
  };

  const handleDeleteEducation = async (id: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        const updatedProfile = profile ? {
          ...profile,
          education: profile.education.filter(edu => edu.id !== id)
        } : null;
        
        setProfile(updatedProfile);
        
        // Save to MongoDB
        if (updatedProfile) {
          await saveProfileToMongoDB(updatedProfile);
          refreshPdfIfOpen(); // Refresh PDF after deleting education
        }
        
        resolve();
      }, 1000);
    });
  };

  // Skills CRUD handlers
  const handleAddSkill = async (skill: Omit<Skill, 'id'>, isBatchOperation: boolean = false) => {
    console.log("HANDLER: handleAddSkill called with:", JSON.stringify(skill, null, 2), "isBatch:", isBatchOperation);
    try {
      // Create new skill object with ID
      const newSkill = { ...skill, id: uuidv4() };
      
      if (!profile) {
        console.error("Cannot add skill: Profile not loaded");
        return Promise.reject(new Error("Profile not loaded"));
      }
      
      // Create updated profile with new skill
      const updatedProfile = {
        ...profile,
        skills: [...profile.skills, newSkill]
      };
      
      // Update local state immediately
      setProfile(updatedProfile);
      
      // Save to MongoDB
      if (user?.uid) {
        console.log("HANDLER: Saving new skill to MongoDB, deferred:", isBatchOperation);
        
        try {
          // Use the individual item API if called from resume parser
          const callerStack = new Error().stack || '';
          const isFromParser = callerStack.includes('handleApplyParsedData');
          
          if (isFromParser) {
            console.log("HANDLER: Called from resume parser, using direct API");
            const refreshedProfile = await addSkillItem(user.uid, newSkill);
            
            // Update local state with refreshed data from MongoDB
            if (refreshedProfile) {
              console.log("HANDLER: Updating local state with refreshed profile from MongoDB");
              setProfile(prevProfile => {
                if (!prevProfile) return null;
                return {
                  ...prevProfile,
                  skills: refreshedProfile.skills || prevProfile.skills
                };
              });
            }
          } else {
            console.log("HANDLER: Standard call, saving full profile");
            await saveProfileToMongoDB(updatedProfile, isBatchOperation);
          }
          
          console.log("HANDLER: Skill saved to MongoDB");
          
          if (!isBatchOperation) {
            refreshPdfIfOpen(); // Refresh PDF after adding skill
          }
        } catch (saveError) {
          console.error("HANDLER: Error saving skill:", saveError);
          return Promise.reject(saveError);
        }
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error adding skill:", error);
      return Promise.reject(error);
    }
  };

  const handleUpdateSkill = async (skill: Skill) => {
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        const updatedProfile = profile ? {
          ...profile,
          skills: profile.skills.map(s => 
            s.id === skill.id ? skill : s
          )
        } : null;
        
        setProfile(updatedProfile);
        
        // Save to MongoDB
        if (updatedProfile) {
          await saveProfileToMongoDB(updatedProfile);
          refreshPdfIfOpen(); // Refresh PDF after updating skill
        }
        
        resolve();
      }, 1000);
    });
  };

  const handleDeleteSkill = async (id: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        const updatedProfile = profile ? {
          ...profile,
          skills: profile.skills.filter(skill => skill.id !== id)
        } : null;
        
        setProfile(updatedProfile);
        
        // Save to MongoDB
        if (updatedProfile) {
          await saveProfileToMongoDB(updatedProfile);
          refreshPdfIfOpen(); // Refresh PDF after deleting skill
        }
        
        resolve();
      }, 1000);
    });
  };

  // Projects CRUD handlers
  const handleAddProject = async (project: Omit<Project, 'id'>) => {
    console.log("HANDLER: handleAddProject called with:", JSON.stringify(project, null, 2));
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        // Create new project object with ID
        const newProject = { ...project, id: uuidv4() };
        
        // Update local state immediately
        const updatedProfile = profile ? {
          ...profile,
          projects: [...profile.projects, newProject]
        } : null;
        
        setProfile(updatedProfile);
        
        try {
          // Do the save
          if (updatedProfile && user?.uid) {
            console.log("HANDLER: Saving new project to MongoDB");
            
            try {
              // Use the individual item API if called from resume parser
              const callerStack = new Error().stack || '';
              const isFromParser = callerStack.includes('handleApplyParsedData');
              
              if (isFromParser) {
                console.log("HANDLER: Called from resume parser, using direct API");
                const refreshedProfile = await addProjectItem(user.uid, newProject);
                
                // Update local state with refreshed data from MongoDB
                if (refreshedProfile) {
                  console.log("HANDLER: Updating local state with refreshed profile from MongoDB");
                  setProfile(prevProfile => {
                    if (!prevProfile) return null;
                    return {
                      ...prevProfile,
                      projects: refreshedProfile.projects || prevProfile.projects
                    };
                  });
                }
              } else {
                console.log("HANDLER: Standard call, saving full profile");
                await saveProfileToMongoDB(updatedProfile);
              }
              
              console.log("HANDLER: Project saved to MongoDB");
              refreshPdfIfOpen(); // Refresh PDF after adding project
            } catch (saveError) {
              console.error("HANDLER: Error saving project:", saveError);
            }
          }
        } finally {
          resolve();
        }
      }, 1000);
    });
  };

  const handleUpdateProject = async (project: Project) => {
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        const updatedProfile = profile ? {
          ...profile,
          projects: profile.projects.map(p => 
            p.id === project.id ? project : p
          )
        } : null;
        
        setProfile(updatedProfile);
        
        // Save to MongoDB
        if (updatedProfile) {
          await saveProfileToMongoDB(updatedProfile);
          refreshPdfIfOpen(); // Refresh PDF after updating project
        }
        
        resolve();
      }, 1000);
    });
  };

  const handleDeleteProject = async (id: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        const updatedProfile = profile ? {
          ...profile,
          projects: profile.projects.filter(project => project.id !== id)
        } : null;
        
        setProfile(updatedProfile);
        
        // Save to MongoDB
        if (updatedProfile) {
          await saveProfileToMongoDB(updatedProfile);
          refreshPdfIfOpen(); // Refresh PDF after deleting project
        }
        
        resolve();
      }, 1000);
    });
  };

  const handleReorderProjects = async (reorderedProjects: Project[]) => {
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        const updatedProfile = profile ? {
          ...profile,
          projects: reorderedProjects
        } : null;
        
        setProfile(updatedProfile);
        
        // Save to MongoDB
        if (updatedProfile) {
          await saveProfileToMongoDB(updatedProfile);
          refreshPdfIfOpen(); // Refresh PDF after reordering projects
        }
        
        resolve();
      }, 1000);
    });
  };

  // Create properly formatted data for AboutSection
  const formattedExperiences = profile?.experiences.map(exp => ({
    position: exp.position,
    company: exp.company,
    description: exp.description
  })) || [];

  // Extract skill names from the profile's skills structure
  const formattedSkills = profile?.skills ? 
    profile.skills.map(skill => skill.name) : 
    [];

  const formattedEducation = profile?.education.map(edu => ({
    school: edu.school,
    degree: edu.degree
  })) || [];

  // Add a method to handle batched skills
  const handleAddSkillsBatch = async (skills: Array<Omit<Skill, 'id'>>) => {
    console.log("HANDLER: handleAddSkillsBatch called with:", JSON.stringify(skills, null, 2));
    if (!profile || skills.length === 0) {
      return Promise.resolve();
    }
    
    setSaveStatus('saving');
    try {
      let updatedProfile = { ...profile };
      
      // Process skills one by one, updating the profile object each time
      for (let i = 0; i < skills.length; i++) {
        const skill = skills[i];
        const newSkill = { ...skill, id: uuidv4() };
        
        // Add to existing skills
        updatedProfile = {
          ...updatedProfile,
          skills: [...updatedProfile.skills, newSkill]
        };
        
        // Update local state immediately after each addition
        setProfile(updatedProfile);
      }
      
      // Save final state to MongoDB
      console.log("HANDLER: Saving batch of skills to MongoDB");
      await saveProfileToMongoDB(updatedProfile);
      console.log("HANDLER: Skills batch saved to MongoDB");
      refreshPdfIfOpen(); // Refresh PDF after adding batch of skills
      setSaveStatus('success');
      
      // Reset status after delay
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error adding skills batch:", error);
      setSaveStatus('error');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
      return Promise.reject(error);
    }
  };

  // First, add a refreshProfile function that fetches the latest data
  const refreshProfile = async () => {
    try {
      setLoading(true);
      if (user?.uid) {
        console.log("Refreshing profile data from MongoDB...");
        const refreshedProfile = await getUserProfileSummary(user.uid);
        
        if (refreshedProfile) {
          setProfile({
            name: refreshedProfile.name,
            email: refreshedProfile.email,
            profileImage: refreshedProfile.profileImage || user?.photoURL || 'https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg?t=st=1744854995~exp=1744858595~hmac=bcb9142a464b4b807e13a8a4b8479b29d1ba1154f80c9b02091ab4a462a3c5fe&w=826',
            phone: refreshedProfile.phone || '',
            location: refreshedProfile.location || '',
            title: refreshedProfile.title || '',
            linkedinUrl: refreshedProfile.linkedinUrl || '',
            githubUrl: refreshedProfile.githubUrl || '',
            portfolioUrl: refreshedProfile.portfolioUrl || '',
            about: refreshedProfile.about || '',
            experiences: refreshedProfile.experiences || [],
            education: refreshedProfile.education || [],
            skills: refreshedProfile.skills || [],
            projects: refreshedProfile.projects || [],
            certificates: refreshedProfile.certificates || []
          });
          console.log("Profile data refreshed successfully");
        }
      }
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle adding a new certificate
  const handleAddCertificate = async (certificate: Omit<Certificate, 'id'>): Promise<void> => {
    if (!user?.uid || !profile) return;
    
    try {
      // Generate a new ID
      const newCertificate: Certificate = {
        ...certificate,
        id: uuidv4()
      };
      
      // Optimistically update UI first
      setProfile(prevProfile => {
        if (!prevProfile) return null;
        
        return {
          ...prevProfile,
          certificates: [...prevProfile.certificates, newCertificate]
        };
      });
      
      // Save to database
      try {
        await addCertificateItem(user.uid, newCertificate);
      } catch (error) {
        console.error('Failed to add certificate to database:', error);
        
        // Rollback UI change if save fails
        setProfile(prevProfile => {
          if (!prevProfile) return null;
          
          return {
            ...prevProfile,
            certificates: prevProfile.certificates.filter(c => c.id !== newCertificate.id)
          };
        });
        
        throw error;
      }
      
      // Then update MongoDB for full profile consistency
      if (profile) {
        const updatedProfile = {
          ...profile,
          certificates: [...profile.certificates, newCertificate]
        };
        await saveProfileToMongoDB(updatedProfile, true);
      }
    } catch (error) {
      console.error('Error adding certificate:', error);
      throw new Error('Failed to add certificate');
    }
  };

  // Function to handle updating a certificate
  const handleUpdateCertificate = async (certificate: Certificate) => {
    if (!user?.uid || !profile) return;
    
    try {
      // Optimistically update UI first
      setProfile(prevProfile => {
        if (!prevProfile) return null;
        
        return {
          ...prevProfile,
          certificates: prevProfile.certificates.map(c => 
            c.id === certificate.id ? certificate : c
          )
        };
      });
      
      // Then update MongoDB
      if (profile) {
        const updatedProfile = {
          ...profile,
          certificates: profile.certificates.map(c => 
            c.id === certificate.id ? certificate : c
          )
        };
        await saveProfileToMongoDB(updatedProfile);
      }
    } catch (error) {
      console.error('Error updating certificate:', error);
      throw new Error('Failed to update certificate');
    }
  };

  // Function to handle deleting a certificate
  const handleDeleteCertificate = async (id: string) => {
    if (!user?.uid || !profile) return;
    
    try {
      // Optimistically update UI first
      setProfile(prevProfile => {
        if (!prevProfile) return null;
        
        return {
          ...prevProfile,
          certificates: prevProfile.certificates.filter(c => c.id !== id)
        };
      });
      
      // Then update MongoDB
      if (profile) {
        const updatedProfile = {
          ...profile,
          certificates: profile.certificates.filter(c => c.id !== id)
        };
        await saveProfileToMongoDB(updatedProfile);
      }
    } catch (error) {
      console.error('Error deleting certificate:', error);
      throw new Error('Failed to delete certificate');
    }
  };

  const handleReorderSkills = async (reorderedSkills: Skill[]) => {
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        const updatedProfile = profile ? {
          ...profile,
          skills: reorderedSkills
        } : null;
        
        setProfile(updatedProfile);
        
        // Save to MongoDB
        if (updatedProfile) {
          await saveProfileToMongoDB(updatedProfile);
          refreshPdfIfOpen(); // Refresh PDF after reordering skills
        }
        
        resolve();
      }, 1000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        {/* Grid Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>
        
        <div className="flex flex-col items-center relative z-10">
          <Loader2 className="h-16 w-16 text-purple-500 animate-spin mb-4" />
          <div className="text-2xl font-bold text-white mb-2">Loading your profile...</div>
          <div className="text-gray-400">Please wait a moment</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar saveStatus={saveStatus} isChatBotOpen={isChatBotOpen} />

        {/* Grid Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-32 pb-8 transition-all duration-300 ${isChatBotOpen ? 'lg:mr-[480px]' : ''}`}>
          {/* Profile Header Card */}
          <div className="mb-8">
            <ProfileHeader 
              profile={profile}
              userId={user?.uid}
              onUpdateProfile={handleUpdateProfile}
              onUploadImage={handleUploadImage}
              onUploadResume={handleUploadResume}
              onPreviewInOverleaf={handlePreviewInOverleaf}
              onViewPdf={handleViewPdf}
              onUpdateAbout={handleUpdateAbout}
              onAddExperience={handleAddExperience}
              onAddEducation={handleAddEducation}
              onAddSkill={handleAddSkill}
              onAddProject={handleAddProject}
              onAddSkillsBatch={handleAddSkillsBatch}
              onParsingComplete={refreshProfile}
              onJobScraper={() => router.push('/job-scraper')}
            />
          </div>
          
          {/* Save Status Floating Indicator */}
          {saveStatus !== 'idle' && (
            <div className="fixed top-16 sm:top-20 right-4 sm:right-6 z-50 animate-in slide-in-from-right duration-300 max-w-[calc(100vw-2rem)]">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-2xl border border-white/20">
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 animate-spin" />
                  <span className="text-xs sm:text-sm font-semibold text-white">Saving changes...</span>
                </div>
              )}
              {saveStatus === 'success' && (
                <div className="flex items-center gap-2 bg-green-500/10 backdrop-blur-xl px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-2xl border border-green-500/30">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs sm:text-sm font-semibold text-white">Saved successfully!</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 bg-red-500/10 backdrop-blur-xl px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-2xl border border-red-500/30">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-xs sm:text-sm font-semibold text-white">Error saving</span>
                </div>
              )}
            </div>
          )}
          
          {/* Modern Tabs Navigation */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-1.5 sm:p-2 mb-6">
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0 snap-x snap-mandatory">
              <button
                onClick={() => setActiveTab('about')}
                className={`relative flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2.5 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-[10px] sm:text-xs md:text-sm rounded-lg sm:rounded-xl whitespace-nowrap overflow-hidden transition-all duration-300 flex-shrink-0 snap-start min-w-fit ${
                  activeTab === 'about' 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === 'about' && (
                  <span 
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 rounded-lg sm:rounded-xl shadow-lg shadow-purple-500/50"
                    style={{
                      animation: 'slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                      transformOrigin: 'left center'
                    }}
                  />
                )}
                <UserCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 relative z-10 flex-shrink-0" />
                <span className="relative z-10">About</span>
              </button>
              <button
                onClick={() => setActiveTab('experience')}
                className={`relative flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2.5 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-[10px] sm:text-xs md:text-sm rounded-lg sm:rounded-xl whitespace-nowrap overflow-hidden transition-all duration-300 flex-shrink-0 snap-start min-w-fit ${
                  activeTab === 'experience' 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === 'experience' && (
                  <span 
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 rounded-lg sm:rounded-xl shadow-lg shadow-purple-500/50"
                    style={{
                      animation: 'slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                      transformOrigin: 'left center'
                    }}
                  />
                )}
                <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 relative z-10 flex-shrink-0" />
                <span className="relative z-10">Experience</span>
              </button>
              <button
                onClick={() => setActiveTab('education')}
                className={`relative flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2.5 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-[10px] sm:text-xs md:text-sm rounded-lg sm:rounded-xl whitespace-nowrap overflow-hidden transition-all duration-300 flex-shrink-0 snap-start min-w-fit ${
                  activeTab === 'education' 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === 'education' && (
                  <span 
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 rounded-lg sm:rounded-xl shadow-lg shadow-purple-500/50"
                    style={{
                      animation: 'slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                      transformOrigin: 'left center'
                    }}
                  />
                )}
                <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 relative z-10 flex-shrink-0" />
                <span className="relative z-10">Education</span>
              </button>
              <button
                onClick={() => setActiveTab('certificates')}
                className={`relative flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2.5 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-[10px] sm:text-xs md:text-sm rounded-lg sm:rounded-xl whitespace-nowrap overflow-hidden transition-all duration-300 flex-shrink-0 snap-start min-w-fit ${
                  activeTab === 'certificates' 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === 'certificates' && (
                  <span 
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 rounded-lg sm:rounded-xl shadow-lg shadow-purple-500/50"
                    style={{
                      animation: 'slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                      transformOrigin: 'left center'
                    }}
                  />
                )}
                <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 relative z-10 flex-shrink-0" />
                <span className="relative z-10">Certificates</span>
              </button>
              <button
                onClick={() => setActiveTab('skills')}
                className={`relative flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2.5 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-[10px] sm:text-xs md:text-sm rounded-lg sm:rounded-xl whitespace-nowrap overflow-hidden transition-all duration-300 flex-shrink-0 snap-start min-w-fit ${
                  activeTab === 'skills' 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === 'skills' && (
                  <span 
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 rounded-lg sm:rounded-xl shadow-lg shadow-purple-500/50"
                    style={{
                      animation: 'slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                      transformOrigin: 'left center'
                    }}
                  />
                )}
                <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 relative z-10 flex-shrink-0" />
                <span className="relative z-10">Skills</span>
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`relative flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2.5 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-[10px] sm:text-xs md:text-sm rounded-lg sm:rounded-xl whitespace-nowrap overflow-hidden transition-all duration-300 flex-shrink-0 snap-start min-w-fit ${
                  activeTab === 'projects' 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === 'projects' && (
                  <span 
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 rounded-lg sm:rounded-xl shadow-lg shadow-purple-500/50"
                    style={{
                      animation: 'slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                      transformOrigin: 'left center'
                    }}
                  />
                )}
                <FolderKanban className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 relative z-10 flex-shrink-0" />
                <span className="relative z-10">Projects</span>
              </button>
            </div>
          </div>
          
          {/* Keyframe Animation for Tab Slide-In */}
          <style jsx>{`
            @keyframes slide-in {
              from {
                opacity: 0;
                transform: scaleX(0);
              }
              to {
                opacity: 1;
                transform: scaleX(1);
              }
            }
          `}</style>
          
          {/* Tab Content Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-4 sm:p-6 lg:p-8 min-h-[400px] sm:min-h-[500px] overflow-hidden">
            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <AboutSection 
                  initialAbout={profile.about}
                  onSave={handleUpdateAbout}
                  experiences={formattedExperiences}
                  skills={formattedSkills}
                  education={formattedEducation}
                />
              </div>
            )}
            
            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ExperienceSection 
                  experiences={profile.experiences}
                  onAdd={handleAddExperience}
                  onUpdate={handleUpdateExperience}
                  onDelete={handleDeleteExperience}
                  onReorder={handleReorderExperiences}
                />
              </div>
            )}
            
            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <EducationSection 
                  educations={profile.education}
                  onAdd={handleAddEducation}
                  onUpdate={handleUpdateEducation}
                  onDelete={handleDeleteEducation}
                />
              </div>
            )}
            
            {/* Certificates Tab */}
            {activeTab === 'certificates' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CertificatesSection
                  certificates={profile.certificates}
                  onAdd={handleAddCertificate}
                  onUpdate={handleUpdateCertificate}
                  onDelete={handleDeleteCertificate}
                />
              </div>
            )}
            
            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SkillsSection 
                  skills={profile.skills}
                  onAdd={handleAddSkill}
                  onUpdate={handleUpdateSkill}
                  onDelete={handleDeleteSkill}
                  onAddBatch={handleAddSkillsBatch}
                  onReorder={handleReorderSkills}
                  experiences={formattedExperiences}
                />
              </div>
            )}
            
            {/* Projects Tab */}
            {activeTab === 'projects' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ProjectsSection 
                  projects={profile.projects}
                  onAdd={handleAddProject}
                  onUpdate={handleUpdateProject}
                  onDelete={handleDeleteProject}
                  onReorder={handleReorderProjects}
                />
              </div>
            )}
          </div>
        </div>

        {/* Floating ChatBot Button */}
        <button
          onClick={() => setIsChatBotOpen(!isChatBotOpen)}
          className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-full shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        >
          {isChatBotOpen ? (
            <X className="h-5 w-5 sm:h-7 sm:w-7 group-hover:rotate-90 transition-transform duration-300" />
          ) : (
            <MessageSquare className="h-5 w-5 sm:h-7 sm:w-7 group-hover:scale-110 transition-transform duration-300" />
          )}
          <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse shadow-lg"></span>
        </button>

        {/* PDF Viewer */}
        <PdfViewer 
          isOpen={isPdfViewerOpen}
          onClose={() => setIsPdfViewerOpen(false)}
          pdfUrl={pdfUrl}
          userId={user?.uid}
        />
        
        {/* Boron Bot */}
        {profile && (
          <BoronBot
            isOpen={isChatBotOpen}
            onClose={() => setIsChatBotOpen(false)}
            profile={profile as unknown as ProfileType}
          />
        )}

        {/* Template Selection Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <h3 className="text-xl font-bold text-white">Select Template</h3>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-400 mb-6">
                  Choose a template for your Overleaf preview
                </p>

                {/* Template Options */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Classic Template */}
                  <button
                    onClick={() => handleOpenOverleafWithTemplate('classic')}
                    className="group relative p-6 border-2 border-slate-700 hover:border-blue-500 rounded-xl transition-all duration-200 bg-slate-800/50 hover:bg-slate-800"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                        <FileText className="h-8 w-8 text-blue-400" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-semibold text-white mb-1">Classic</h4>
                        <p className="text-xs text-slate-400">Professional & Clean</p>
                      </div>
                    </div>
                  </button>

                  {/* Modern Template */}
                  <button
                    onClick={() => handleOpenOverleafWithTemplate('modern')}
                    className="group relative p-6 border-2 border-slate-700 hover:border-teal-500 rounded-xl transition-all duration-200 bg-slate-800/50 hover:bg-slate-800"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-lg bg-teal-500/20 flex items-center justify-center group-hover:bg-teal-500/30 transition-colors">
                        <Zap className="h-8 w-8 text-teal-400" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-semibold text-white mb-1">Modern</h4>
                        <p className="text-xs text-slate-400">Elegant & Stylish</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 