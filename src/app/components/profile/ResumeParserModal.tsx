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
  onApplyData: (data: Partial<ProfileInfo>) => void;
}

// Define which fields from the parsed data we want to show in the profile
const PROFILE_FIELDS = [
  'name', 'email', 'phone', 'location', 'title', 
  'linkedinUrl', 'githubUrl', 'portfolioUrl'
] as const;

export default function ResumeParserModal({
  open,
  onClose,
  parsedData,
  isLoading,
  error,
  extractedText,
  onApplyData
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
  
  // Add state to toggle showing the extracted text
  const [showExtractedText, setShowExtractedText] = useState(false);

  // Reset the selected fields when new data is loaded
  useEffect(() => {
    if (parsedData) {
      const newSelectedFields = { ...selectedFields };
      
      // Set to false any fields that are missing in the parsed data
      Object.keys(newSelectedFields).forEach(field => {
        if (!parsedData[field]) {
          newSelectedFields[field] = false;
        }
      });
      
      setSelectedFields(newSelectedFields);
    }
  }, [parsedData]);

  const toggleField = (field: string) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleApply = () => {
    if (!parsedData) return;

    const selectedData: Partial<ProfileInfo> = {};
    
    // Only include fields that are valid for ProfileInfo
    for (const field of PROFILE_FIELDS) {
      if (selectedFields[field] && parsedData[field] !== undefined) {
        // Only include string values
        const value = parsedData[field];
        if (typeof value === 'string') {
          selectedData[field] = value;
        }
      }
    }
    
    onApplyData(selectedData);
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
            Select the details you'd like to apply to your profile.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-4 text-gray-400">Parsing your resume...</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {parsedData.education && Array.isArray(parsedData.education) && parsedData.education.length > 0 && (
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

            {parsedData.skills && Array.isArray(parsedData.skills) && parsedData.skills.length > 0 && (
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

            {parsedData.experience && Array.isArray(parsedData.experience) && parsedData.experience.length > 0 && (
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
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApply}
            disabled={isLoading || !parsedData || !!error || hasParsingError || Object.values(selectedFields).filter(Boolean).length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Apply to Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 