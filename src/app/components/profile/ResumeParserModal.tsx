'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Loader2, FileText, AlertTriangle, Copy, Check, User, Briefcase, GraduationCap, Code, FolderOpen, Lightbulb } from 'lucide-react';
import { useState } from 'react';

interface ParsedData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  title?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  about?: string;
  education?: Array<{
    id: string;
    school: string;
    degree: string;
    startDate: string;
    endDate: string;
    cgpa: string;
  }>;
  experiences?: Array<{
    id: string;
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  skills?: Array<{
    id: string;
    name: string;
    domain: string;
  }>;
  projects?: Array<{
    id: string;
    title: string;
    description: string;
    technologies: string;
    startDate: string;
    endDate: string;
    githubUrl?: string;
    projectUrl?: string;
  }>;
}

interface ResumeParserModalProps {
  open: boolean;
  onClose: () => void;
  isLoading: boolean;
  error?: string;
  extractedText?: string;
  parsedData?: ParsedData | null;
  onApply?: (data: ParsedData, selectedSections: string[]) => void;
  isApplying?: boolean;
  applyProgress?: string;
}

export default function ResumeParserModal({
  open,
  onClose,
  isLoading,
  error,
  extractedText,
  parsedData,
  onApply,
  isApplying = false,
  applyProgress,
}: ResumeParserModalProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'parsed' | 'text'>('parsed');
  
  // Section selection state
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set([
    'profile',
    'about',
    'education',
    'experiences',
    'skills',
    'projects'
  ]));
  
  const toggleSection = (section: string) => {
    setSelectedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };
  
  const hasSectionData = (section: string): boolean => {
    if (!parsedData) return false;
    switch (section) {
      case 'profile':
        return !!(parsedData.name || parsedData.email || parsedData.phone || parsedData.location || parsedData.title);
      case 'about':
        return !!parsedData.about;
      case 'education':
        return !!(parsedData.education && parsedData.education.length > 0);
      case 'experiences':
        return !!(parsedData.experiences && parsedData.experiences.length > 0);
      case 'skills':
        return !!(parsedData.skills && parsedData.skills.length > 0);
      case 'projects':
        return !!(parsedData.projects && parsedData.projects.length > 0);
      default:
        return false;
    }
  };

  const handleCopy = () => {
    const textToCopy = viewMode === 'text' ? extractedText : JSON.stringify(parsedData, null, 2);
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume Parser Results
          </DialogTitle>
          <DialogDescription>
            {isLoading ? 'Extracting and parsing your PDF...' : 
             error ? 'An error occurred while processing your PDF.' :
             parsedData ? 'Successfully extracted and parsed your resume into structured data.' :
             extractedText ? `Extracted ${extractedText.length.toLocaleString()} characters.` :
             'No data available.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-400">Processing your PDF...</p>
              <p className="text-gray-500 text-sm mt-2">Extracting text and parsing with AI...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-400 font-medium mb-2">{error}</p>
              <p className="text-gray-400 text-sm text-center max-w-md">
                Make sure your PDF is text-based (not a scanned image) and try again.
              </p>
            </div>
          ) : parsedData || extractedText ? (
            <>
              {/* View Mode Toggle */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'parsed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('parsed')}
                    disabled={!parsedData}
                  >
                    Parsed Data
                  </Button>
                  <Button
                    variant={viewMode === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('text')}
                    disabled={!extractedText}
                  >
                    Raw Text
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy {viewMode === 'parsed' ? 'JSON' : 'Text'}
                    </>
                  )}
                </Button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto">
                {viewMode === 'parsed' && parsedData ? (
                  <div className="space-y-6">
                    {/* Personal Information */}
                    {(parsedData.name || parsedData.email || parsedData.phone || parsedData.location || parsedData.title) && (
                      <div className={`p-4 bg-gray-900/50 rounded-lg border ${selectedSections.has('profile') ? 'border-blue-500' : 'border-gray-700'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-400" />
                            <h3 className="text-lg font-semibold text-white">Personal Information</h3>
                          </div>
                          {onApply && !isApplying && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedSections.has('profile')}
                                onChange={() => toggleSection('profile')}
                                disabled={isApplying}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-400">Apply</span>
                            </label>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {parsedData.name && (
                            <div>
                              <span className="text-gray-400">Name:</span>
                              <span className="text-white ml-2">{parsedData.name}</span>
                            </div>
                          )}
                          {parsedData.email && (
                            <div>
                              <span className="text-gray-400">Email:</span>
                              <span className="text-white ml-2">{parsedData.email}</span>
                            </div>
                          )}
                          {parsedData.phone && (
                            <div>
                              <span className="text-gray-400">Phone:</span>
                              <span className="text-white ml-2">{parsedData.phone}</span>
                            </div>
                          )}
                          {parsedData.location && (
                            <div>
                              <span className="text-gray-400">Location:</span>
                              <span className="text-white ml-2">{parsedData.location}</span>
                            </div>
                          )}
                          {parsedData.title && (
                            <div className="col-span-2">
                              <span className="text-gray-400">Title:</span>
                              <span className="text-white ml-2">{parsedData.title}</span>
                            </div>
                          )}
                        </div>
                        {(parsedData.linkedinUrl || parsedData.githubUrl || parsedData.portfolioUrl) && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <div className="flex flex-wrap gap-3 text-sm">
                              {parsedData.linkedinUrl && (
                                <a href={parsedData.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                  LinkedIn
                                </a>
                              )}
                              {parsedData.githubUrl && (
                                <a href={parsedData.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                  GitHub
                                </a>
                              )}
                              {parsedData.portfolioUrl && (
                                <a href={parsedData.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                  Portfolio
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* About Section */}
                    {parsedData.about && (
                      <div className={`p-4 bg-gray-900/50 rounded-lg border ${selectedSections.has('about') ? 'border-blue-500' : 'border-gray-700'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-white">About</h3>
                          {onApply && !isApplying && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedSections.has('about')}
                                onChange={() => toggleSection('about')}
                                disabled={isApplying}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-400">Apply</span>
                            </label>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{parsedData.about}</p>
                      </div>
                    )}

                    {/* Education */}
                    {parsedData.education && parsedData.education.length > 0 && (
                      <div className={`p-4 bg-gray-900/50 rounded-lg border ${selectedSections.has('education') ? 'border-blue-500' : 'border-gray-700'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-blue-400" />
                            <h3 className="text-lg font-semibold text-white">Education ({parsedData.education.length})</h3>
                          </div>
                          {onApply && !isApplying && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedSections.has('education')}
                                onChange={() => toggleSection('education')}
                                disabled={isApplying}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-400">Apply</span>
                            </label>
                          )}
                        </div>
                        <div className="space-y-3">
                          {parsedData.education.map((edu, index) => (
                            <div key={edu.id || index} className="p-3 bg-gray-800/50 rounded border border-gray-700">
                              <div className="font-medium text-white">{edu.degree}</div>
                              <div className="text-gray-300 text-sm">{edu.school}</div>
                              <div className="text-gray-400 text-xs mt-1">
                                {edu.startDate && edu.endDate && `${edu.startDate} - ${edu.endDate}`}
                                {edu.cgpa && ` • GPA: ${edu.cgpa}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {parsedData.experiences && parsedData.experiences.length > 0 && (
                      <div className={`p-4 bg-gray-900/50 rounded-lg border ${selectedSections.has('experiences') ? 'border-blue-500' : 'border-gray-700'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-blue-400" />
                            <h3 className="text-lg font-semibold text-white">Experience ({parsedData.experiences.length})</h3>
                          </div>
                          {onApply && !isApplying && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedSections.has('experiences')}
                                onChange={() => toggleSection('experiences')}
                                disabled={isApplying}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-400">Apply</span>
                            </label>
                          )}
                        </div>
                        <div className="space-y-3">
                          {parsedData.experiences.map((exp, index) => (
                            <div key={exp.id || index} className="p-3 bg-gray-800/50 rounded border border-gray-700">
                              <div className="font-medium text-white">{exp.position} at {exp.company}</div>
                              {exp.location && <div className="text-gray-400 text-xs">{exp.location}</div>}
                              <div className="text-gray-400 text-xs">
                                {exp.startDate && exp.endDate && `${exp.startDate} - ${exp.endDate}`}
                              </div>
                              {exp.description && (
                                <div className="text-gray-300 text-sm mt-2 whitespace-pre-wrap">{exp.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {parsedData.skills && parsedData.skills.length > 0 && (
                      <div className={`p-4 bg-gray-900/50 rounded-lg border ${selectedSections.has('skills') ? 'border-blue-500' : 'border-gray-700'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Code className="h-5 w-5 text-blue-400" />
                            <h3 className="text-lg font-semibold text-white">Skills ({parsedData.skills.length})</h3>
                          </div>
                          {onApply && !isApplying && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedSections.has('skills')}
                                onChange={() => toggleSection('skills')}
                                disabled={isApplying}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-400">Apply</span>
                            </label>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {parsedData.skills.map((skill, index) => (
                            <div
                              key={skill.id || index}
                              className="px-3 py-1 bg-gray-800 rounded-full text-sm border border-gray-700"
                            >
                              <span className="text-white">{skill.name}</span>
                              {skill.domain && skill.domain !== 'General' && (
                                <span className="text-gray-400 text-xs ml-2">({skill.domain})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {parsedData.projects && parsedData.projects.length > 0 && (
                      <div className={`p-4 bg-gray-900/50 rounded-lg border ${selectedSections.has('projects') ? 'border-blue-500' : 'border-gray-700'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-5 w-5 text-blue-400" />
                            <h3 className="text-lg font-semibold text-white">Projects ({parsedData.projects.length})</h3>
                          </div>
                          {onApply && !isApplying && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedSections.has('projects')}
                                onChange={() => toggleSection('projects')}
                                disabled={isApplying}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-400">Apply</span>
                            </label>
                          )}
                        </div>
                        <div className="space-y-3">
                          {parsedData.projects.map((project, index) => (
                            <div key={project.id || index} className="p-3 bg-gray-800/50 rounded border border-gray-700">
                              <div className="font-medium text-white">{project.title}</div>
                              {project.startDate && project.endDate && (
                                <div className="text-gray-400 text-xs">
                                  {project.startDate} - {project.endDate}
                                </div>
                              )}
                              {project.description && (
                                <div className="text-gray-300 text-sm mt-2">{project.description}</div>
                              )}
                              {project.technologies && (
                                <div className="text-gray-400 text-xs mt-2">
                                  <span className="font-medium">Technologies:</span> {project.technologies}
                                </div>
                              )}
                              {(project.githubUrl || project.projectUrl) && (
                                <div className="flex gap-3 mt-2 text-xs">
                                  {project.githubUrl && (
                                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                      GitHub
                                    </a>
                                  )}
                                  {project.projectUrl && (
                                    <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                      Live Demo
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* JSON View Toggle */}
                    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <details className="cursor-pointer">
                        <summary className="text-sm text-gray-400 hover:text-gray-300">
                          View Raw JSON
                        </summary>
                        <pre className="mt-3 p-3 bg-gray-950 rounded text-xs text-gray-400 overflow-x-auto">
                          {JSON.stringify(parsedData, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                        {extractedText || 'No text available'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-gray-600 mb-4" />
              <p className="text-gray-400">No data to display</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex-1">
            {isApplying && applyProgress && (
              <p className="text-sm text-gray-400">{applyProgress}</p>
            )}
            {!isApplying && parsedData && onApply && (
              <p className="text-sm text-gray-500">
                {selectedSections.size} section{selectedSections.size !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading || isApplying}
            >
              Close
            </Button>
            {parsedData && onApply && (
              <Button
                onClick={() => onApply(parsedData, Array.from(selectedSections))}
                disabled={isLoading || isApplying || selectedSections.size === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  `Apply Selected (${selectedSections.size})`
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
