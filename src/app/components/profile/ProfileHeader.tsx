'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from "@/app/components/ui/button";
import { PenSquare, Upload, Loader2, ExternalLink, FileText, Code, Zap } from "lucide-react";
import ResumeParserModal from './ResumeParserModal';
import { ProfileInfo } from '@/app/types';
import ImageCropModal from './ImageCropModal';
import ImageFallback from '@/app/components/ui/ImageFallback';
import { addExperienceItem, addEducationItem, addSkillItem, addProjectItem } from '@/app/lib/userProfileService';
import { Progress } from "@/app/components/ui/progress";
import { useRouter } from 'next/navigation';

interface ProfileHeaderProps {
  profile: ProfileInfo;
  userId?: string;
  onUpdateProfile: (profile: Partial<ProfileInfo>) => Promise<void>;
  onUploadImage: (file: File) => Promise<void>;
  onUploadResume: (file: File) => Promise<void>;
  onPreviewInOverleaf: () => Promise<void>;
  onViewPdf?: () => Promise<void>;
  onViewLatex?: () => Promise<void>;
  onUpdateAbout?: (about: string) => Promise<void>;
  onAddExperience?: (experience: any) => Promise<void>;
  onAddEducation?: (education: any) => Promise<void>;
  onAddSkill?: (skill: any, isBatch?: boolean) => Promise<void>;
  onAddProject?: (project: any) => Promise<void>;
  onAddSkillsBatch?: (skills: any[]) => Promise<void>;
  onParsingComplete?: () => void;
  onLogout?: () => void;
  onJobScraper?: () => void;
}

export default function ProfileHeader({ 
  profile, 
  userId,
  onUpdateProfile, 
  onUploadImage, 
  onUploadResume,
  onPreviewInOverleaf,
  onViewPdf,
  onViewLatex,
  onUpdateAbout,
  onAddExperience,
  onAddEducation,
  onAddSkill,
  onAddProject,
  onAddSkillsBatch,
  onParsingComplete,
  onLogout,
  onJobScraper
}: ProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isResumeUploading, setIsResumeUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Image cropping state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  
  // Resume parser state
  const [isParserModalOpen, setIsParserModalOpen] = useState(false);
  const [parsedResumeData, setParsedResumeData] = useState<any>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [parserError, setParserError] = useState<string | undefined>(undefined);
  const [extractedText, setExtractedText] = useState<string | undefined>(undefined);
  const [isApplyingResumeData, setIsApplyingResumeData] = useState(false);
  const [applyProgress, setApplyProgress] = useState<string>('');
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  
  const [editProfile, setEditProfile] = useState<ProfileInfo>({
    name: profile.name,
    email: profile.email,
    profileImage: profile.profileImage,
    phone: profile.phone || '',
    location: profile.location || '',
    title: profile.title || '',
    linkedinUrl: profile.linkedinUrl || '',
    githubUrl: profile.githubUrl || '',
    portfolioUrl: profile.portfolioUrl || ''
  });

  const router = useRouter();

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Create a temporary URL for the selected image
    const imageUrl = URL.createObjectURL(file);
    
    // Open the crop modal with the selected image
    setImageToCrop(imageUrl);
    setIsCropModalOpen(true);
    
    // Reset the file input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleCropComplete = async (croppedBlob: Blob, base64Data: string) => {
    setIsImageUploading(true);
    try {
      console.log('Starting image upload process...');
      console.log('Base64 data length:', base64Data.length);
      
      // Create a file from the cropped blob
      const croppedFile = new File([croppedBlob], 'cropped_profile.jpg', { 
        type: 'image/jpeg' 
      });
      console.log('Created file from blob:', croppedFile.name, croppedFile.type, croppedFile.size);
      
      // For very large images, we'll just send the base64 data to avoid FormData issues
      console.log('Uploading image to API directly with base64...');
      
      // Upload the cropped image with a longer timeout
      const uploadResponse = await fetch('/api/profile/image/base64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data,
          uid: userId || '',
          mimeType: 'image/jpeg',
          fileName: 'cropped_profile.jpg'
        }),
      });
      
      const responseText = await uploadResponse.text();
      console.log('Upload response text:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('Upload response data:', responseData);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
      }
      
      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload image: ${responseData?.error || uploadResponse.statusText}`);
      }
      
      // Generate the image URL from our image API endpoint with a cache-busting timestamp
      const imageUrl = `/api/profile/image/${userId}?t=${new Date().getTime()}`; 
      console.log('Generated image URL:', imageUrl);
      
      // Update the profile with the new image URL
      console.log('Updating profile with new image URL...');
      await onUpdateProfile({ profileImage: imageUrl });
      console.log('Profile updated successfully');
      
      // Revoke the object URL to avoid memory leaks
      if (imageToCrop) {
        URL.revokeObjectURL(imageToCrop);
      }
    } catch (error) {
      console.error('Failed to upload cropped profile image:', error);
    } finally {
      setIsImageUploading(false);
      setImageToCrop(null);
    }
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsResumeUploading(true);
    setIsParsingResume(true);
    setParsedResumeData(null);
    setParserError(undefined);
    setExtractedText(undefined);
    setIsParserModalOpen(true);
    
    try {
      // Upload the resume file
      await onUploadResume(file);
      
      // Parse the resume with Groq
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await fetch('/api/resume-parser', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setParsedResumeData(result.data);
        // Store the extracted text from the response
        if (result.extractedText) {
          setExtractedText(result.extractedText);
        }
      } else {
        console.error('Failed to parse resume:', result.error);
        setParserError(result.error || 'Failed to parse resume. Please try again or upload a different file.');
      }
    } catch (error) {
      console.error('Failed to process resume:', error);
      setParserError('An error occurred while processing your resume. Please try again.');
    } finally {
      setIsResumeUploading(false);
      setIsParsingResume(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onUpdateProfile(editProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditProfile({
      name: profile.name,
      email: profile.email,
      profileImage: profile.profileImage,
      phone: profile.phone || '',
      location: profile.location || '',
      title: profile.title || '',
      linkedinUrl: profile.linkedinUrl || '',
      githubUrl: profile.githubUrl || '',
      portfolioUrl: profile.portfolioUrl || ''
    });
  };

  // Handle applying parsed resume data to profile
  const handleApplyParsedData = async (parsedData: any) => {
    try {
      setIsApplyingResumeData(true);
      setProgressPercentage(0);
      console.log("PARSED DATA RECEIVED:", JSON.stringify(parsedData, null, 2));
      
      // Generate a unique parsing session ID to track logs
      const sessionId = Math.random().toString(36).substring(2, 10);
      console.log(`[${sessionId}] Starting resume data import session`);
      
      // Calculate total items to track progress
      const totalItems = 2 + // Basic profile and about section
        (parsedData.education?.length || 0) +
        (parsedData.experience?.length || 0) +
        (parsedData.skills?.length || 0) +
        (parsedData.projects?.length || 0);
      
      let completedItems = 0;
      
      const updateProgress = (message: string) => {
        completedItems++;
        const percentage = Math.min(Math.round((completedItems / totalItems) * 100), 100);
        setProgressPercentage(percentage);
        setApplyProgress(message);
      };
      
      // Keep track of how many items we've successfully saved
      let savedItems = {
        profile: false,
        about: false,
        education: 0,
        experience: 0,
        skills: 0,
        projects: 0
      };
      
      // Step 1: Basic Profile Info
      if (parsedData.name || parsedData.email || parsedData.phone || parsedData.location || 
          parsedData.title || parsedData.linkedinUrl || parsedData.githubUrl || parsedData.portfolioUrl) {
        
        setApplyProgress(`Updating basic profile information...`);
        
        try {
          console.log(`[${sessionId}] Updating profile basic info`);
      const profileInfo: Partial<ProfileInfo> = {
        name: parsedData.name,
        email: parsedData.email,
        phone: parsedData.phone,
        location: parsedData.location,
        title: parsedData.title,
        linkedinUrl: parsedData.linkedinUrl,
        githubUrl: parsedData.githubUrl,
        portfolioUrl: parsedData.portfolioUrl,
      };
      
          await onUpdateProfile(profileInfo);
          console.log(`[${sessionId}] Profile info updated successfully`);
      
          savedItems.profile = true;
      
      // Update the local state
      setEditProfile(prev => ({
        ...prev,
        ...profileInfo
      }));

          updateProgress(`Updated basic profile information`);
        } catch (error) {
          console.error(`[${sessionId}] Failed to update profile info:`, error);
          updateProgress(`Failed to update basic profile information`);
        }
      }

      // Step 2: About Section
      if (parsedData.about && onUpdateAbout) {
        setApplyProgress(`Updating about section...`);
        
        try {
          console.log(`[${sessionId}] Updating about section`);
        await onUpdateAbout(parsedData.about);
          console.log(`[${sessionId}] About section updated successfully`);
          
          savedItems.about = true;
          updateProgress(`Updated about section`);
        } catch (error) {
          console.error(`[${sessionId}] Failed to save about section:`, error);
          updateProgress(`Failed to update about section`);
        }
      }
      
      // Step 3: Education (process one item at a time)
      if (parsedData.education && Array.isArray(parsedData.education) && parsedData.education.length > 0 && onAddEducation) {
        console.log(`[${sessionId}] Processing ${parsedData.education.length} education items`);
        
        for (let i = 0; i < parsedData.education.length; i++) {
          const edu = parsedData.education[i];
          setApplyProgress(`Adding education ${i+1} of ${parsedData.education.length}...`);
          
          try {
            console.log(`[${sessionId}] Adding education item ${i+1}/${parsedData.education.length}`);
            
          const education = {
            school: edu.school || '',
            degree: edu.degree || '',
            startDate: edu.graduationDate ? edu.graduationDate.split(' - ')[0] : '',
            endDate: edu.graduationDate ? edu.graduationDate.split(' - ')[1] || edu.graduationDate : '',
            cgpa: '',
            includeInResume: true
          };
          
            // Only call the regular add function if userId is not available
            if (!userId) {
          await onAddEducation(education);
            } else {
              // Create education with ID for direct MongoDB update
              const newEducation = { ...education, id: Math.random().toString(36).substring(2, 15) };
              await addEducationItem(userId, newEducation);
              console.log(`[${sessionId}] Education item ${i+1} added - refreshing profile`);
            }
            
            console.log(`[${sessionId}] Education item ${i+1} added successfully`);
            
            savedItems.education++;
            updateProgress(`Added education ${i+1} of ${parsedData.education.length}`);
            
          } catch (eduError) {
            console.error(`[${sessionId}] Failed to add education item ${i+1}:`, eduError);
            updateProgress(`Failed to add education ${i+1}`);
          }
        }
      }
      
      // Step 4: Experience (process one item at a time)
      if (parsedData.experience && Array.isArray(parsedData.experience) && parsedData.experience.length > 0 && onAddExperience) {
        console.log(`[${sessionId}] Processing ${parsedData.experience.length} experience items`);
        
        for (let i = 0; i < parsedData.experience.length; i++) {
          const exp = parsedData.experience[i];
          setApplyProgress(`Adding experience ${i+1} of ${parsedData.experience.length}...`);
          
          try {
            console.log(`[${sessionId}] Adding experience item ${i+1}/${parsedData.experience.length}`);
            
          const experience = {
            company: exp.company || '',
            position: exp.title || '',
            location: '',
            startDate: exp.dates ? exp.dates.split(' - ')[0] : '',
            endDate: exp.dates ? exp.dates.split(' - ')[1] || exp.dates : '',
            description: exp.responsibilities ? exp.responsibilities.join('\n') : '',
            includeInResume: true
          };
          
            // Log the experience object being added
            console.log(`[${sessionId}] Experience data:`, JSON.stringify(experience, null, 2));
            
            if (!userId) {
          await onAddExperience(experience);
            } else {
              // Create experience with ID for direct MongoDB update
              const newExperience = { ...experience, id: Math.random().toString(36).substring(2, 15) };
              await addExperienceItem(userId, newExperience);
              console.log(`[${sessionId}] Experience item ${i+1} added - refreshing profile`);
            }
            
            console.log(`[${sessionId}] Experience item ${i+1} added successfully`);
            
            savedItems.experience++;
            updateProgress(`Added experience ${i+1} of ${parsedData.experience.length}`);
            
          } catch (expError) {
            console.error(`[${sessionId}] Failed to add experience item ${i+1}:`, expError);
            updateProgress(`Failed to add experience ${i+1}`);
          }
        }
      }
      
      // Step 5: Skills
      if (parsedData.skills && Array.isArray(parsedData.skills) && parsedData.skills.length > 0) {
        console.log(`[${sessionId}] Processing ${parsedData.skills.length} skills`);
        
        if (onAddSkillsBatch && !userId) {
          // Use batch processing if available
          try {
            setApplyProgress(`Adding ${parsedData.skills.length} skills...`);
            console.log(`[${sessionId}] Adding skills batch`);
            
            const skillsToAdd = parsedData.skills.map((skill: string) => ({
            name: skill,
            domain: 'Other',
            includeInResume: true
          }));
          
            await onAddSkillsBatch(skillsToAdd);
            console.log(`[${sessionId}] Skills batch added successfully`);
            savedItems.skills = skillsToAdd.length;
            
            updateProgress(`Added ${skillsToAdd.length} skills`);
            
          } catch (skillsError) {
            console.error(`[${sessionId}] Failed to add skills batch:`, skillsError);
            updateProgress(`Failed to add skills`);
          }
        } 
        else if (onAddSkill) {
          // Process skills one by one
          for (let i = 0; i < parsedData.skills.length; i++) {
            const skillName = parsedData.skills[i];
            setApplyProgress(`Adding skill ${i+1} of ${parsedData.skills.length}...`);
            
            try {
              console.log(`[${sessionId}] Adding skill ${i+1}/${parsedData.skills.length}: ${skillName}`);
              
              const skill = {
                name: skillName,
              domain: 'Other',
              includeInResume: true
            };
              
              if (!userId) {
                await onAddSkill(skill, false);
              } else {
                // Create skill with ID for direct MongoDB update
                const newSkill = { ...skill, id: Math.random().toString(36).substring(2, 15) };
                await addSkillItem(userId, newSkill);
                console.log(`[${sessionId}] Skill ${i+1} added - refreshing profile`);
              }
              
              console.log(`[${sessionId}] Skill ${i+1} added successfully`);
              
              savedItems.skills++;
              updateProgress(`Added skill ${i+1} of ${parsedData.skills.length}`);
              
            } catch (skillError) {
              console.error(`[${sessionId}] Failed to add skill ${i+1}:`, skillError);
              updateProgress(`Failed to add skill ${i+1}`);
            }
          }
        }
      }
      
      // Step 6: Projects
      if (parsedData.projects && Array.isArray(parsedData.projects) && parsedData.projects.length > 0 && onAddProject) {
        console.log(`[${sessionId}] Processing ${parsedData.projects.length} projects`);
        
        for (let i = 0; i < parsedData.projects.length; i++) {
          const proj = parsedData.projects[i];
          setApplyProgress(`Adding project ${i+1} of ${parsedData.projects.length}...`);
          
          try {
            console.log(`[${sessionId}] Adding project item ${i+1}/${parsedData.projects.length}`);
            
          const project = {
            title: proj.name || '',
            description: proj.description || '',
            technologies: Array.isArray(proj.technologies) 
              ? proj.technologies.join(', ') 
              : (typeof proj.technologies === 'string' ? proj.technologies : ''),
            startDate: '',
            endDate: '',
            projectUrl: '',
            githubUrl: '',
            includeInResume: true
          };
          
            if (!userId) {
          await onAddProject(project);
            } else {
              // Create project with ID for direct MongoDB update
              const newProject = { ...project, id: Math.random().toString(36).substring(2, 15) };
              await addProjectItem(userId, newProject);
              console.log(`[${sessionId}] Project ${i+1} added - refreshing profile`);
            }
            
            console.log(`[${sessionId}] Project ${i+1} added successfully`);
            
            savedItems.projects++;
            updateProgress(`Added project ${i+1} of ${parsedData.projects.length}`);
            
          } catch (projError) {
            console.error(`[${sessionId}] Failed to add project ${i+1}:`, projError);
            updateProgress(`Failed to add project ${i+1}`);
          }
        }
      }
      
      // Show final summary
      const summary = `Successfully imported: ${savedItems.profile ? 'Profile info, ' : ''}${savedItems.about ? 'About, ' : ''}${savedItems.education} education items, ${savedItems.experience} experiences, ${savedItems.skills} skills, ${savedItems.projects} projects`;
      
      console.log(`[${sessionId}] Resume import complete. ${summary}`);
      setProgressPercentage(100);
      setApplyProgress(`Complete! ${summary}`);
      
    } catch (error) {
      console.error('Failed to apply resume data to profile:', error);
      setApplyProgress('Error occurred during import. Check console for details.');
      alert('There was an error while importing your resume data. Some items may not have been saved.');
    } finally {
      setTimeout(() => {
        setIsApplyingResumeData(false);
        setApplyProgress('');
        setProgressPercentage(0);
        setIsParserModalOpen(false);
        
        // Call the callback to refresh the page if provided
        if (onParsingComplete) {
          onParsingComplete();
        }
      }, 2000); // Show completion message for 2 seconds before closing
    }
  };

  // Function to handle Overleaf preview
  const handleOverleafPreview = async () => {
    try {
      await onPreviewInOverleaf();
    } catch (error) {
      console.error('Failed to preview in Overleaf:', error);
    }
  };

  const handleViewPdfClick = async () => {
    try {
      if (onViewPdf) {
        await onViewPdf();
      }
    } catch (error) {
      console.error('Failed to view PDF resume:', error);
    }
  };

  const handleViewLatexClick = async () => {
    try {
      if (onViewLatex) {
        await onViewLatex();
      }
    } catch (error) {
      console.error('Failed to view LaTeX code:', error);
    }
  };

  return (
    <div className="relative rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
      {/* Image Crop Modal */}
      {imageToCrop && (
        <ImageCropModal
          open={isCropModalOpen}
          onClose={() => {
            setIsCropModalOpen(false);
            // Clean up the URL after a short delay to allow for any animations to complete
            setTimeout(() => {
              if (imageToCrop) {
                URL.revokeObjectURL(imageToCrop);
                setImageToCrop(null);
              }
            }, 300);
          }}
          imageUrl={imageToCrop}
          onCropComplete={handleCropComplete}
        />
      )}
      
      {/* Resume Parser Modal */}
      <ResumeParserModal
        open={isParserModalOpen}
        onClose={() => setIsParserModalOpen(false)}
        isLoading={isParsingResume || isApplyingResumeData}
        parsedData={parsedResumeData}
        error={parserError}
        extractedText={extractedText}
        onApplyData={handleApplyParsedData}
        applyProgress={isApplyingResumeData ? applyProgress : undefined}
        progressPercentage={progressPercentage}
      />
      
      {!isEditing ? (
        <>
          {/* Profile Content - Horizontal Layout */}
          <div className="p-6 sm:p-8">
            {/* Main Content Grid: Left (Details) - Right (Actions) */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Left Side: Profile Details */}
              <div className="flex-1 min-w-0">
                {/* Profile Image and Basic Info */}
                <div className="flex items-start gap-6 mb-6">
                  <div className="relative flex-shrink-0">
                    <div className="w-28 h-28 rounded-2xl overflow-hidden bg-white/5 border-4 border-white/10 shadow-xl shadow-purple-500/20">
                      {profile.profileImage ? (
                        <ImageFallback
                          src={profile.profileImage}
                          alt="Profile"
                          width={112}
                          height={112}
                          className="object-cover w-full h-full"
                          fallback="/user.png"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-cyan-500/20 text-gray-400">
                          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white p-2.5 rounded-xl cursor-pointer hover:shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-110">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        disabled={isImageUploading}
                      />
                      {isImageUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <PenSquare className="h-4 w-4" />
                      )}
                    </label>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                      {profile.name}
                    </h1>
                    <p className="text-lg text-gray-400 mb-3">{profile.title || 'Add your title'}</p>

                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-lg hover:bg-white/20 hover:border-white/30 transition-all font-medium text-xs shadow-sm"
                    >
                      <PenSquare className="h-3.5 w-3.5" />
                      Edit Profile
                    </button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{profile.email}</span>
                  </div>

                  {profile.phone && (
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{profile.phone}</span>
                    </div>
                  )}

                  {profile.location && (
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl) && (
                  <div className="flex flex-wrap gap-2">
                    {profile.linkedinUrl && (
                      <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500/20 backdrop-blur-xl text-blue-400 rounded-lg hover:bg-blue-500/30 border border-blue-500/30 transition-all text-sm font-medium"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        LinkedIn
                      </a>
                    )}

                    {profile.githubUrl && (
                      <a
                        href={profile.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-500/20 backdrop-blur-xl text-gray-300 rounded-lg hover:bg-gray-500/30 border border-gray-500/30 transition-all text-sm font-medium"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        GitHub
                      </a>
                    )}

                    {profile.portfolioUrl && (
                      <a
                        href={profile.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-green-500/20 backdrop-blur-xl text-green-400 rounded-lg hover:bg-green-500/30 border border-green-500/30 transition-all text-sm font-medium"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Portfolio
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side: Action Buttons */}
              <div className="flex-shrink-0">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Resume Actions</h3>
                  <div className="space-y-3">
                    <label className="block">
                      <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white px-6 py-3 rounded-xl cursor-pointer hover:shadow-lg hover:shadow-purple-500/50 transition-all font-semibold text-sm">
                        {isResumeUploading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5" />
                            Upload Resume
                          </>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleResumeUpload}
                          disabled={isResumeUploading}
                        />
                      </div>
                    </label>

                    <button
                      onClick={handleOverleafPreview}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500/20 backdrop-blur-xl border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/30 transition-all font-semibold text-sm"
                    >
                      <ExternalLink className="h-5 w-5" />
                      Preview in Overleaf
                    </button>

                    {onViewPdf && (
                      <button
                        onClick={handleViewPdfClick}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 backdrop-blur-xl border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/30 transition-all font-semibold text-sm"
                      >
                        <FileText className="h-5 w-5" />
                        View PDF Resume
                      </button>
                    )}

                    {onViewLatex && (
                      <button
                        onClick={handleViewLatexClick}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500/20 backdrop-blur-xl border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all font-semibold text-sm"
                      >
                        <Code className="h-5 w-5" />
                        View LaTeX Code
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 space-y-6">
          <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={editProfile.name}
                onChange={(e) => setEditProfile({...editProfile, name: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={editProfile.email}
                onChange={(e) => setEditProfile({...editProfile, email: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Job Title
              </label>
              <input
                type="text"
                value={editProfile.title}
                onChange={(e) => setEditProfile({...editProfile, title: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                placeholder="Software Engineer"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={editProfile.phone}
                onChange={(e) => setEditProfile({...editProfile, phone: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                placeholder="+1 (555) 123-4567"
                disabled={isLoading}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                value={editProfile.location}
                onChange={(e) => setEditProfile({...editProfile, location: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                placeholder="New York, NY"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={editProfile.linkedinUrl}
                onChange={(e) => setEditProfile({...editProfile, linkedinUrl: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                placeholder="https://linkedin.com/in/username"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                GitHub URL
              </label>
              <input
                type="url"
                value={editProfile.githubUrl}
                onChange={(e) => setEditProfile({...editProfile, githubUrl: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                placeholder="https://github.com/username"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Portfolio URL
              </label>
              <input
                type="url"
                value={editProfile.portfolioUrl}
                onChange={(e) => setEditProfile({...editProfile, portfolioUrl: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                placeholder="https://yourportfolio.com"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-white/10 backdrop-blur-xl text-white rounded-xl hover:bg-white/20 transition-all font-semibold"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all font-semibold disabled:opacity-50"
              disabled={isLoading || !editProfile.name || !editProfile.email}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 