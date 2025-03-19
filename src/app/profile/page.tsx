'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Loader2, MessageCircle, Zap, X, MessageSquare } from "lucide-react";
import Link from 'next/link';
import logo from "@/app/images/logo-no-background.png";
import Image from 'next/image';
import { Button } from "@/app/components/ui/button";
import { v4 as uuidv4 } from 'uuid';
import { 
  saveUserProfileSummary, 
  getUserProfileSummary, 
  addExperienceItem, 
  addEducationItem, 
  addSkillItem, 
  addProjectItem,
  UserProfileSummary
} from '@/app/lib/userProfileService';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import type { UserProfile as ProfileType } from '@/app/types/profile';

// Import profile section components
import ProfileHeader from '@/app/components/profile/ProfileHeader';
import AboutSection from '@/app/components/profile/AboutSection';
import ExperienceSection from '@/app/components/profile/ExperienceSection';
import EducationSection from '@/app/components/profile/EducationSection';
import SkillsSection from '@/app/components/profile/SkillsSection';
import ProjectsSection from '@/app/components/profile/ProjectsSection';
import PdfViewer from '../components/profile/PdfViewer';
import BoronBot from '../components/profile/ChatBot';

// Define interfaces for profile data
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

interface UserProfile extends ProfileInfo {
  about: string;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
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
            profileImage: savedProfile.profileImage || user?.photoURL || '/placeholder-avatar.png',
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
            projects: savedProfile.projects || []
          });
        } else {
          // Create a minimal profile with user info from Firebase
          const defaultProfile: UserProfile = {
            name: user?.displayName || 'John Doe',
            email: user?.email || 'john@example.com',
            profileImage: user?.photoURL || '/placeholder-avatar.png',
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
            projects: []
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
        projects: profileData.projects
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
    // This function generates a LaTeX document based on the user's profile
    // and opens it in Overleaf
    
    if (!profile || !user?.uid) return;
    
    try {
      // Use the server API endpoint that generates the LaTeX with path parameters
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/api/latex-resume/${user.uid}`;
      
      // Create a data URI with the API URL
      const encodedUri = encodeURIComponent(apiUrl);
      const overleafUrl = `https://www.overleaf.com/docs?snip_uri=${encodedUri}`;
      
      // Open the Overleaf link in a new window
      window.open(overleafUrl, '_blank');
      
      console.log('Opening LaTeX resume in Overleaf');
    } catch (error) {
      console.error('Error generating LaTeX resume:', error);
    }
  };
  
  const handleViewRawLatex = async () => {
    if (!profile || !user?.uid) return;
    
    try {
      // Directly open the LaTeX API URL in a new tab using path parameters
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/api/latex-resume/${user.uid}`;
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
            profileImage: refreshedProfile.profileImage || user?.photoURL || '/placeholder-avatar.png',
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
            projects: refreshedProfile.projects || []
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <div className="text-xl text-gray-300">Loading your profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

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
                  Saving...
                </span>
              )}
              {saveStatus === 'success' && (
                <span className="text-sm text-green-400">
                  Saved successfully
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-sm text-red-400">
                  Error saving
                </span>
              )}
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Profile Header */}
          <ProfileHeader 
            profile={profile}
            userId={user?.uid}
            onUpdateProfile={handleUpdateProfile}
            onUploadImage={handleUploadImage}
            onUploadResume={handleUploadResume}
            onPreviewInOverleaf={handlePreviewInOverleaf}
            onViewRawLatex={handleViewRawLatex}
            onViewPdf={handleViewPdf}
            onUpdateAbout={handleUpdateAbout}
            onAddExperience={handleAddExperience}
            onAddEducation={handleAddEducation}
            onAddSkill={handleAddSkill}
            onAddProject={handleAddProject}
            onAddSkillsBatch={handleAddSkillsBatch}
            onParsingComplete={refreshProfile}
          />
          
          {/* ChatBot toggle button */}
          <div className="fixed bottom-6 right-6 z-10">
            <Button
              onClick={() => setIsChatBotOpen(!isChatBotOpen)}
              className="rounded-full w-14 h-14 bg-gradient-to-r from-blue-900 to-purple-900 hover:from-blue-800 hover:to-purple-800 shadow-lg flex items-center justify-center"
            >
              {isChatBotOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            </Button>
          </div>
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-800 mb-8 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('about')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'about' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('experience')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'experience' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Experience
            </button>
            <button
              onClick={() => setActiveTab('education')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'education' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Education
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'skills' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Skills
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'projects' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Projects
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
            {/* About Tab */}
            {activeTab === 'about' && (
              <AboutSection 
                initialAbout={profile.about}
                onSave={handleUpdateAbout}
                experiences={formattedExperiences}
                skills={formattedSkills}
                education={formattedEducation}
              />
            )}
            
            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <ExperienceSection 
                experiences={profile.experiences}
                onAdd={handleAddExperience}
                onUpdate={handleUpdateExperience}
                onDelete={handleDeleteExperience}
              />
            )}
            
            {/* Education Tab */}
            {activeTab === 'education' && (
              <EducationSection 
                educations={profile.education}
                onAdd={handleAddEducation}
                onUpdate={handleUpdateEducation}
                onDelete={handleDeleteEducation}
              />
            )}
            
            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <SkillsSection 
                skills={profile.skills}
                onAdd={handleAddSkill}
                onUpdate={handleUpdateSkill}
                onDelete={handleDeleteSkill}
                onAddBatch={handleAddSkillsBatch}
                experiences={formattedExperiences}
                projects={profile.projects.map(proj => ({
                  title: proj.title,
                  technologies: proj.technologies,
                  description: proj.description
                }))}
              />
            )}
            
            {/* Projects Tab */}
            {activeTab === 'projects' && (
              <ProjectsSection 
                projects={profile.projects}
                onAdd={handleAddProject}
                onUpdate={handleUpdateProject}
                onDelete={handleDeleteProject}
              />
            )}
          </div>
        </div>

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
      </div>
    </ProtectedRoute>
  );
} 