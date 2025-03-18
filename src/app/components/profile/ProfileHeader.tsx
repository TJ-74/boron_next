'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/app/components/ui/button";
import { PenSquare, Upload, Loader2, ExternalLink, FileText } from "lucide-react";

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

interface ProfileHeaderProps {
  profile: ProfileInfo;
  onUpdateProfile: (profile: Partial<ProfileInfo>) => Promise<void>;
  onUploadImage: (file: File) => Promise<void>;
  onUploadResume: (file: File) => Promise<void>;
  onPreviewInOverleaf: () => Promise<void>;
  onViewRawLatex?: () => Promise<void>;
}

export default function ProfileHeader({ 
  profile, 
  onUpdateProfile, 
  onUploadImage, 
  onUploadResume,
  onPreviewInOverleaf,
  onViewRawLatex
}: ProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isResumeUploading, setIsResumeUploading] = useState(false);
  
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

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImageUploading(true);
    try {
      await onUploadImage(file);
    } catch (error) {
      console.error('Failed to upload profile image:', error);
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsResumeUploading(true);
    try {
      await onUploadResume(file);
    } catch (error) {
      console.error('Failed to upload resume:', error);
    } finally {
      setIsResumeUploading(false);
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

  // Function to handle Overleaf preview
  const handleOverleafPreview = async () => {
    try {
      await onPreviewInOverleaf();
    } catch (error) {
      console.error('Failed to preview in Overleaf:', error);
    }
  };

  const handleViewRawLatexClick = async () => {
    try {
      if (onViewRawLatex) {
        await onViewRawLatex();
      }
    } catch (error) {
      console.error('Failed to view raw LaTeX:', error);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 mb-8">
      {!isEditing ? (
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 border-4 border-blue-500/20">
              {profile.profileImage ? (
                <Image
                  src={profile.profileImage}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
              <input
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
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {profile.name}
            </h1>
            <p className="text-xl text-gray-300 mt-1">{profile.title}</p>
            
            <div className="mt-4 space-y-2 text-gray-400">
              <p><span className="text-gray-300">Email:</span> {profile.email}</p>
              {profile.phone && <p><span className="text-gray-300">Phone:</span> {profile.phone}</p>}
              {profile.location && <p><span className="text-gray-300">Location:</span> {profile.location}</p>}
              
              <div className="flex flex-wrap gap-3 mt-3">
                {profile.linkedinUrl && (
                  <a 
                    href={profile.linkedinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
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
                    className="text-gray-300 hover:text-white flex items-center gap-1"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
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
                    className="text-green-400 hover:text-green-300 flex items-center gap-1"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Portfolio
                  </a>
                )}
              </div>
            </div>

            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
              >
                <PenSquare className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col gap-3">
            <label className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50">
              {isResumeUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Resume
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                disabled={isResumeUploading}
              />
            </label>
            
            <Button
              variant="outline"
              size="default"
              onClick={handleOverleafPreview}
              className="flex items-center gap-2 border-green-600 text-green-500 hover:bg-green-900/20 hover:text-green-400"
            >
              <ExternalLink className="h-4 w-4" />
              Preview in Overleaf
            </Button>
            
            {onViewRawLatex && (
              <Button
                variant="outline"
                size="default"
                onClick={handleViewRawLatexClick}
                className="flex items-center gap-2 border-blue-600 text-blue-500 hover:bg-blue-900/20 hover:text-blue-400"
              >
                <FileText className="h-4 w-4" />
                View LaTeX Code
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-200">Edit Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={editProfile.name}
                onChange={(e) => setEditProfile({...editProfile, name: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={editProfile.email}
                onChange={(e) => setEditProfile({...editProfile, email: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Job Title
              </label>
              <input
                type="text"
                value={editProfile.title}
                onChange={(e) => setEditProfile({...editProfile, title: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="Software Engineer"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={editProfile.phone}
                onChange={(e) => setEditProfile({...editProfile, phone: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="+1 (555) 123-4567"
                disabled={isLoading}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={editProfile.location}
                onChange={(e) => setEditProfile({...editProfile, location: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="New York, NY"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={editProfile.linkedinUrl}
                onChange={(e) => setEditProfile({...editProfile, linkedinUrl: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="https://linkedin.com/in/username"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                GitHub URL
              </label>
              <input
                type="url"
                value={editProfile.githubUrl}
                onChange={(e) => setEditProfile({...editProfile, githubUrl: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="https://github.com/username"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Portfolio URL
              </label>
              <input
                type="url"
                value={editProfile.portfolioUrl}
                onChange={(e) => setEditProfile({...editProfile, portfolioUrl: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="https://yourportfolio.com"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="ghost" 
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || !editProfile.name || !editProfile.email}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 