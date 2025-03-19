'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Loader2, Check, X, AlertTriangle } from 'lucide-react';
import { ProfileInfo } from '@/app/types';
import { Progress } from '@/app/components/ui/progress';

// Define types for parsed resume data
type EducationItem = {
  degree: string;
  school: string;
  graduationDate: string;
};

type ExperienceItem = {
  company: string;
  title: string;
  dates: string;
  responsibilities: string[];
};

type ProjectItem = {
  name: string;
  description: string;
  technologies?: string[];
};

interface ParsedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  title?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  education?: EducationItem[];
  experience?: ExperienceItem[];
  skills?: string[];
  projects?: ProjectItem[];
  [key: string]: any; // Allow for any additional fields
}

interface ResumeParserModalProps {
  open: boolean;
  onClose: () => void;
  parsedData: ParsedResumeData | null;
  isLoading: boolean;
  error?: string;
  extractedText?: string;
  onApplyData: (data: any) => void;
  applyProgress?: string;
  progressPercentage?: number;
}

// Define which fields from the parsed data we want to show in the profile
const PROFILE_FIELDS = [
  'name', 'email', 'phone', 'location', 'title', 
  'linkedinUrl', 'githubUrl', 'portfolioUrl'
] as const;

// Define sections for selection
const DATA_SECTIONS = {
  profile: 'Basic Profile',
  about: 'About',
  education: 'Education',
  experience: 'Work Experience',
  skills: 'Skills',
  projects: 'Projects'
};

export default function ResumeParserModal({
  open,
  onClose,
  parsedData,
  isLoading,
  error,
  extractedText,
  onApplyData,
  applyProgress,
  progressPercentage = 0
}: ResumeParserModalProps) {
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({
    name: true,
    email: true,
    phone: true,
    location: true,
    title: true,
    linkedinUrl: true,
    githubUrl: true,
    portfolioUrl: true
  });
  
  // Add state for section selection
  const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>({
    profile: true,
    about: true,
    education: true,
    experience: true,
    skills: true,
    projects: true
  });
  
  // Add state to toggle showing the extracted text
  const [showExtractedText, setShowExtractedText] = useState(false);

  // Reset the selected fields when new data is loaded
  useEffect(() => {
    if (parsedData) {
      const newSelectedFields = { ...selectedFields };
      const newSelectedSections = { ...selectedSections };
      
      // Set to false any fields that are missing in the parsed data
      Object.keys(newSelectedFields).forEach(field => {
        if (!parsedData[field]) {
          newSelectedFields[field] = false;
        }
      });
      
      // Set section availability based on parsed data
      if (!parsedData.education || !Array.isArray(parsedData.education) || parsedData.education.length === 0) {
        newSelectedSections.education = false;
      }
      if (!parsedData.experience || !Array.isArray(parsedData.experience) || parsedData.experience.length === 0) {
        newSelectedSections.experience = false;
      }
      if (!parsedData.skills || !Array.isArray(parsedData.skills) || parsedData.skills.length === 0) {
        newSelectedSections.skills = false;
      }
      if (!parsedData.projects || !Array.isArray(parsedData.projects) || parsedData.projects.length === 0) {
        newSelectedSections.projects = false;
      }
      if (!parsedData.about) {
        newSelectedSections.about = false;
      }
      
      setSelectedFields(newSelectedFields);
      setSelectedSections(newSelectedSections);
    }
  }, [parsedData]);

  const toggleField = (field: string) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  
  const toggleSection = (section: string) => {
    setSelectedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleApply = () => {
    if (!parsedData) return;

    // Create a filtered copy of the parsed data with only selected sections
    const filteredData = { ...parsedData };
    
    // Only include basic profile fields that are selected
    if (!selectedSections.profile) {
      PROFILE_FIELDS.forEach(field => {
        delete filteredData[field];
      });
    } else {
      // Filter individual profile fields
      PROFILE_FIELDS.forEach(field => {
        if (!selectedFields[field]) {
          delete filteredData[field];
        }
      });
    }
    
    // Filter out unselected sections
    if (!selectedSections.about) delete filteredData.about;
    if (!selectedSections.education) delete filteredData.education;
    if (!selectedSections.experience) delete filteredData.experience;
    if (!selectedSections.skills) delete filteredData.skills;
    if (!selectedSections.projects) delete filteredData.projects;
    
    // Pass the filtered data to onApplyData
    onApplyData(filteredData);
    onClose();
  };

  // Check if we encountered a parsing error
  const hasParsingError = parsedData && 'parseError' in parsedData;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resume Parser Results</DialogTitle>
          <DialogDescription>
            We've extracted the following information from your resume. 
            Select the sections and details you'd like to apply to your profile.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            {applyProgress && (
              <div className="w-full max-w-md mt-6">
                <Progress value={progressPercentage} className="h-2 mb-2" />
                <p className="text-gray-400 text-center">
                  {applyProgress}
                </p>
                <p className="text-gray-500 text-sm text-center mt-1">
                  {progressPercentage}% Complete
                </p>
              </div>
            )}
            {!applyProgress && (
              <p className="mt-4 text-gray-400">
                Parsing your resume...
              </p>
            )}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <p className="mt-4 text-gray-200 text-center">{error}</p>
            <p className="mt-2 text-gray-400 text-center text-sm">
              Try uploading a different file format or a text-based PDF.
            </p>
          </div>
        ) : !parsedData ? (
          <div className="flex flex-col items-center justify-center py-12">
            <X className="h-8 w-8 text-red-500" />
            <p className="mt-4 text-gray-400">No data could be parsed from your resume.</p>
          </div>
        ) : hasParsingError ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <p className="mt-4 text-gray-200 text-center">We had trouble parsing your resume.</p>
            <p className="mt-2 text-gray-400 text-center text-sm">
              Try uploading a different file or a simpler format like plain text.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Show extracted text toggle button */}
            {extractedText && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExtractedText(!showExtractedText)}
                  className="text-blue-400 border-blue-400 hover:bg-blue-900/20"
                >
                  {showExtractedText ? 'Hide Extracted Text' : 'Show Extracted Text'}
                </Button>
              </div>
            )}

            {/* Extracted text display area */}
            {showExtractedText && extractedText && (
              <div className="p-4 bg-gray-900/50 rounded-md border border-gray-700 mt-2">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Text Extracted From Resume:</h3>
                <div className="max-h-[200px] overflow-y-auto">
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap">{extractedText}</pre>
                </div>
              </div>
            )}
            
            {/* Section selection */}
            <div className="p-4 bg-gray-900/50 rounded-md border border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Select Sections to Import:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(DATA_SECTIONS).map(([key, label]) => (
                  <div 
                    key={key}
                    className={`p-3 rounded-md cursor-pointer flex items-center gap-2 transition-colors ${
                      selectedSections[key] 
                        ? 'bg-blue-900/30 border border-blue-500/50 text-blue-300' 
                        : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700'
                    } ${!parsedData[key] && key !== 'profile' ? 'opacity-50' : ''}`}
                    onClick={() => parsedData[key] || key === 'profile' ? toggleSection(key) : null}
                  >
                    <div className={`p-1 rounded-md ${
                      selectedSections[key] ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-500'
                    }`}>
                      <Check className="h-4 w-4" />
                    </div>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Only show profile fields if profile section is selected */}
            {selectedSections.profile && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <h3 className="text-lg font-medium text-white mb-1 md:col-span-2">Basic Info</h3>
                {/* Only render profile fields that are strings */}
                {PROFILE_FIELDS.map(field => {
                  const value = parsedData[field];
                  if (value === undefined || value === null || typeof value !== 'string') {
                    return null;
                  }
                  
                  return (
                    <div key={field} className="flex items-start space-x-3 p-3 border border-gray-700 rounded-md bg-gray-800/50">
                      <div 
                        className={`p-1.5 rounded-md cursor-pointer ${
                          selectedFields[field] ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
                        }`}
                        onClick={() => toggleField(field)}
                      >
                        <Check className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-300 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-white break-words">{value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedSections.education && parsedData.education && Array.isArray(parsedData.education) && parsedData.education.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-white mb-3">Education</h3>
                <div className="space-y-3">
                  {parsedData.education.map((edu, index) => (
                    <div key={index} className="p-3 border border-gray-700 rounded-md bg-gray-800/50">
                      <p className="font-medium text-white">{edu.degree}</p>
                      <p className="text-gray-300">{edu.school}</p>
                      <p className="text-gray-400 text-sm">{edu.graduationDate}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedSections.skills && parsedData.skills && Array.isArray(parsedData.skills) && parsedData.skills.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-white mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 bg-gray-700 text-gray-200 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedSections.experience && parsedData.experience && Array.isArray(parsedData.experience) && parsedData.experience.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-white mb-3">Experience</h3>
                <div className="space-y-3">
                  {parsedData.experience.map((exp, index) => (
                    <div key={index} className="p-3 border border-gray-700 rounded-md bg-gray-800/50">
                      <p className="font-medium text-white">{exp.title} at {exp.company}</p>
                      <p className="text-gray-400 text-sm">{exp.dates}</p>
                      {exp.responsibilities && Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0 && (
                        <ul className="mt-2 list-disc list-inside space-y-1">
                          {exp.responsibilities.map((resp, i) => (
                            <li key={i} className="text-gray-300 text-sm">{resp}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {selectedSections.projects && parsedData.projects && Array.isArray(parsedData.projects) && parsedData.projects.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-white mb-3">Projects</h3>
                <div className="space-y-3">
                  {parsedData.projects.map((project, index) => (
                    <div key={index} className="p-3 border border-gray-700 rounded-md bg-gray-800/50">
                      <p className="font-medium text-white">{project.name}</p>
                      <p className="text-gray-300 text-sm">{project.description}</p>
                      {project.technologies && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Array.isArray(project.technologies) ? project.technologies.map((tech, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                              {tech}
                            </span>
                          )) : (
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                              {project.technologies}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show extraction quality message */}
            {!error && !hasParsingError && (
              <div className="mt-4 p-3 bg-blue-900/20 text-blue-400 text-sm rounded-md">
                <p>
                  Note: The quality of extraction depends on your resume format.
                  {Object.values(selectedFields).filter(Boolean).length === 0 && (
                    <span className="block mt-1 text-yellow-400">
                      We couldn't extract core profile information. Try a simpler format.
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={!!applyProgress}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApply}
            disabled={isLoading || !parsedData || !!error || hasParsingError || 
              (selectedSections.profile && Object.values(selectedFields).filter(Boolean).length === 0 && 
               Object.values(selectedSections).filter(Boolean).length <= 1) || 
              !!applyProgress}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Apply to Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 