'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { LinkedinIcon, GithubIcon, GlobeIcon, MailIcon, PhoneIcon, MapPinIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { getUserProfileSummary } from '@/app/lib/userProfileService';
import { UserProfileSummary } from '@/app/api/profile/route';
import ImageFallback from '@/app/components/ui/ImageFallback';
import logo from "@/app/images/logo-no-background.png";
import SearchProfiles from '@/app/components/SearchProfiles';

// ViewProfileCard component for an individual section
function ViewProfileCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-200 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function ViewProfile() {
  const { uid } = useParams<{ uid: string }>();
  const [profile, setProfile] = useState<UserProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('about');
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        if (!uid) {
          throw new Error('User ID is required');
        }
        
        const profileData = await getUserProfileSummary(uid);
        
        if (!profileData) {
          throw new Error('Profile not found');
        }
        
        setProfile(profileData);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [uid]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 text-blue-500 animate-spin mb-4 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <div className="text-xl text-gray-300">Loading profile...</div>
        </div>
      </div>
    );
  }
  
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
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
              <SearchProfiles />
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col justify-center items-center min-h-[60vh]">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Profile Not Found</h1>
            <p className="text-gray-400 mb-6">{error || 'The requested profile could not be found.'}</p>
            <Link href="/">
              <Button className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
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
            <SearchProfiles />
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="text-gray-300 border-gray-700 hover:bg-gray-800"
            >
              Back
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 border-4 border-blue-500/20">
                {profile.profileImage ? (
                  <ImageFallback
                    src={profile.profileImage}
                    alt={profile.name}
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                    fallback="/user.png"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                {profile.name}
              </h1>
              <p className="text-xl text-gray-300 mt-1">{profile.title}</p>
              
              <div className="mt-4 space-y-2 text-gray-400">
                <p className="flex items-center gap-2 justify-center md:justify-start">
                  <MailIcon className="h-4 w-4 flex-shrink-0" />
                  <span>{profile.email}</span>
                </p>
                
                {profile.phone && (
                  <p className="flex items-center gap-2 justify-center md:justify-start">
                    <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                    <span>{profile.phone}</span>
                  </p>
                )}
                
                {profile.location && (
                  <p className="flex items-center gap-2 justify-center md:justify-start">
                    <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                    <span>{profile.location}</span>
                  </p>
                )}
                
                <div className="flex flex-wrap gap-3 mt-3 justify-center md:justify-start">
                  {profile.linkedinUrl && (
                    <a 
                      href={profile.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <LinkedinIcon className="h-5 w-5" />
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
                      <GithubIcon className="h-5 w-5" />
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
                      <GlobeIcon className="h-5 w-5" />
                      Portfolio
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
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
          {activeTab === 'about' && profile.about && (
            <div>
              <h2 className="text-xl font-bold text-gray-200 mb-4">About</h2>
              <p className="text-gray-300 whitespace-pre-wrap">{profile.about}</p>
            </div>
          )}
          
          {/* Experience Tab */}
          {activeTab === 'experience' && profile.experiences && profile.experiences.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-200 mb-4">Experience</h2>
              <div className="space-y-6">
                {profile.experiences
                  .filter(exp => exp.includeInResume !== false)
                  .map((experience) => (
                    <div key={experience.id} className="border-l-2 border-blue-500/30 pl-4 pb-2">
                      <h3 className="text-lg font-medium text-white">{experience.position}</h3>
                      <p className="text-blue-400">{experience.company}</p>
                      <p className="text-sm text-gray-400 mb-2">
                        {experience.startDate} - {experience.endDate || 'Present'} • {experience.location}
                      </p>
                      <p className="text-gray-300 whitespace-pre-wrap">{experience.description}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          {/* Education Tab */}
          {activeTab === 'education' && profile.education && profile.education.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-200 mb-4">Education</h2>
              <div className="space-y-6">
                {profile.education
                  .filter(edu => edu.includeInResume !== false)
                  .map((education) => (
                    <div key={education.id} className="border-l-2 border-purple-500/30 pl-4 pb-2">
                      <h3 className="text-lg font-medium text-white">{education.school}</h3>
                      <p className="text-purple-400">{education.degree}</p>
                      <p className="text-sm text-gray-400 mb-2">
                        {education.startDate} - {education.endDate || 'Present'} • GPA: {education.cgpa}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          {/* Skills Tab */}
          {activeTab === 'skills' && profile.skills && profile.skills.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-200 mb-4">Skills</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(
                  profile.skills
                    .filter(skill => skill.includeInResume !== false)
                    .reduce((acc, skill) => {
                      if (!acc[skill.domain]) {
                        acc[skill.domain] = [];
                      }
                      acc[skill.domain].push(skill.name);
                      return acc;
                    }, {} as Record<string, string[]>)
                ).map(([domain, skills]) => (
                  <div key={domain} className="bg-gray-700/30 rounded-lg p-3">
                    <h4 className="font-medium text-blue-400 mb-2">{domain}</h4>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-1 bg-gray-700 text-gray-200 rounded-md text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Projects Tab */}
          {activeTab === 'projects' && profile.projects && profile.projects.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-200 mb-4">Projects</h2>
              <div className="space-y-6">
                {profile.projects
                  .filter(project => project.includeInResume !== false)
                  .map((project) => (
                    <div key={project.id} className="border-l-2 border-green-500/30 pl-4 pb-2">
                      <h3 className="text-lg font-medium text-white">{project.title}</h3>
                      <p className="text-green-400">{project.technologies}</p>
                      <p className="text-sm text-gray-400 mb-2">
                        {project.startDate} - {project.endDate || 'Present'}
                      </p>
                      <p className="text-gray-300 whitespace-pre-wrap mb-2">{project.description}</p>
                      
                      <div className="flex flex-wrap gap-3">
                        {project.githubUrl && (
                          <a 
                            href={project.githubUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-300 hover:text-white flex items-center gap-1 text-sm"
                          >
                            <GithubIcon className="h-4 w-4" />
                            GitHub Repository
                          </a>
                        )}
                        
                        {project.projectUrl && (
                          <a 
                            href={project.projectUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                          >
                            <GlobeIcon className="h-4 w-4" />
                            Live Demo
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 