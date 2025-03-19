'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Copy, Download, FileText, RefreshCw, Edit2, Save, AlertCircle, FileDown } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import type { UserProfile } from '@/app/types/profile';
import { jsPDF } from 'jspdf';

interface CoverLetterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  coverLetterContent: string;
  jobDescription?: string;
  isLoading: boolean;
  onRegenerateCoverLetter: () => void;
  onUpdateJobDescription?: (description: string) => void;
  onUpdateCoverLetter?: (content: string) => void;
  isCoverLetterMode?: boolean;
}

export default function CoverLetterPanel({ 
  isOpen, 
  onClose, 
  coverLetterContent,
  jobDescription,
  isLoading,
  onRegenerateCoverLetter,
  onUpdateJobDescription,
  onUpdateCoverLetter,
  isCoverLetterMode = true // Default to true for backward compatibility
}: CoverLetterPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isEditingJobDesc, setIsEditingJobDesc] = useState(false);
  const [isViewingJobDesc, setIsViewingJobDesc] = useState(false);
  const [editedJobDesc, setEditedJobDesc] = useState(jobDescription || '');
  const [editableCoverLetter, setEditableCoverLetter] = useState(coverLetterContent);
  const [positionTitle, setPositionTitle] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const jobDescTextareaRef = useRef<HTMLTextAreaElement>(null);
  const coverLetterTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Update editable content when the original content changes
  useEffect(() => {
    setEditableCoverLetter(coverLetterContent);
  }, [coverLetterContent]);

  // Initialize or update edited job description when job description or visibility changes
  useEffect(() => {
    if (isOpen) {
      setEditedJobDesc(jobDescription || '');
    }
  }, [jobDescription, isOpen]);

  const handleCopy = async () => {
    try {
      // Copy the editable content instead of the original
      await navigator.clipboard.writeText(editableCoverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF();
      
      // Set font to a more professional option
      doc.setFont('times', 'normal');
      doc.setFontSize(12);
      
      // Format the cover letter content
      const lines = editableCoverLetter.split('\n');
      let y = 20;
      const margin = 20;
      const pageWidth = 210; // A4 width in mm
      const textWidth = pageWidth - (margin * 2);
      
      // Check if the content already has a header section (name and contact info)
      const hasHeader = lines.length > 3 && 
                        (lines[0].trim().match(/^[A-Z][a-z]+ [A-Z][a-z]+$/) || // Name format
                         lines[0].includes('@') || // Email
                         lines[0].includes('(') || // Phone number
                         lines[1].includes('@') || // Email on second line
                         lines[1].includes('(') || // Phone on second line
                         lines[0].startsWith('http')); // Website
      
      // Add date at top if not already present in the content
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const hasDate = editableCoverLetter.includes(dateStr) || 
                      editableCoverLetter.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/);
      
      if (!hasDate) {
        doc.text(dateStr, margin, y);
        y += 10;
      }
      
      // Add position title as subject line if provided
      if (positionTitle) {
        y += 8;
        doc.setFontSize(11);
        doc.text("Subject: Application for " + positionTitle + " Position", margin, y);
        doc.setFontSize(12);
        y += 10;
      }
      
      // Process each line of the cover letter
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines but still add spacing
        if (line === '') {
          y += 6;
          continue;
        }
        
        // Make the name bold if it's the first line and looks like a name
        if (i === 0 && !hasDate && line.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/)) {
          doc.setFont('times', 'bold');
          doc.text(line, margin, y);
          doc.setFont('times', 'normal');
          y += 6;
          continue;
        }
        
        // Handle salutation (make slightly larger)
        if (line.startsWith('Dear ') || line.startsWith('To ') || line.startsWith('Hiring')) {
          doc.setFontSize(12.5);
          const splitText = doc.splitTextToSize(line, textWidth - margin);
          doc.text(splitText, margin, y);
          doc.setFontSize(12);
          y += splitText.length * 7;
          continue;
        }
        
        // Handle signature section
        if (line.startsWith('Sincerely,') || line.startsWith('Yours truly,') || 
            line.startsWith('Best,') || line.startsWith('Regards,') || 
            line.startsWith('Thank you,')) {
          y += 3; // Add a bit more space before signature
          doc.text(line, margin, y);
          y += 15; // Space for signature
          continue;
        }
        
        // Split long lines to fit within margins
        const splitText = doc.splitTextToSize(line, textWidth - margin);
        
        // Check if we need to add a new page
        if (y + (splitText.length * 6) > 290) { // 290 is approximate page height with margins
          doc.addPage();
          y = 20;
        }
        
        // Add the text
        doc.text(splitText, margin, y);
        y += splitText.length * 6;
      }
      
      // Save PDF
      doc.save('Cover_Letter.pdf');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  };

  const handleSaveJobDescription = () => {
    if (onUpdateJobDescription && editedJobDesc && editedJobDesc !== jobDescription) {
      onUpdateJobDescription(editedJobDesc);
    }
    setIsEditingJobDesc(false);
  };

  const startEditingJobDesc = () => {
    setEditedJobDesc(jobDescription || '');
    setIsEditingJobDesc(true);
    setTimeout(() => {
      jobDescTextareaRef.current?.focus();
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Cover Letter panel */}
      <div 
        className="fixed inset-y-0 left-0 z-30 w-full md:w-2/3 lg:w-1/2 xl:w-2/5 bg-gray-900 shadow-2xl transform transition-all duration-300 ease-in-out animate-slide-in-left"
        onClick={(e) => e.stopPropagation()}
      >
        <style jsx>{`
          @keyframes slide-in-left {
            from {
              transform: translateX(-100%);
            }
            to {
              transform: translateX(0);
            }
          }
          .animate-slide-in-left {
            animation: slide-in-left 0.3s forwards;
          }
        `}</style>
        
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gradient-to-r from-green-900 to-blue-900">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <FileText className="h-5 w-5 mr-2 text-green-400" />
              Cover Letter Generator
              {!isCoverLetterMode && (
                <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded">Manual Mode</span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="text-green-400 border-green-700 hover:bg-green-900/20"
              >
                {copied ? 'Copied!' : 'Copy'}
                <Copy className="h-4 w-4 ml-1" />
              </Button>
              <Button
                onClick={handleDownloadPdf}
                variant="outline"
                size="sm"
                className="text-purple-400 border-purple-700 hover:bg-purple-900/20"
              >
                PDF
                <FileDown className="h-4 w-4 ml-1" />
              </Button>
              <Button
                onClick={onRegenerateCoverLetter}
                variant="outline"
                size="sm"
                className="text-amber-400 border-amber-700 hover:bg-amber-900/20"
                disabled={isLoading}
              >
                {isLoading ? 'Generating...' : 'Regenerate'}
                <RefreshCw className={`h-4 w-4 ml-1 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                onClick={onClose} 
                variant="ghost" 
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {!jobDescription || jobDescription.trim().length < 20 ? (
            <div className="p-8 bg-gray-800 text-center flex-1 flex flex-col items-center justify-center">
              <FileText className="h-16 w-16 text-gray-500 mb-4" />
              <h3 className="text-xl font-medium text-gray-300 mb-3">No Job Description Provided</h3>
              <p className="text-gray-400 mb-6 max-w-md">
                To generate a personalized cover letter, you need to provide a job description. 
                The more details you provide, the better your cover letter will be.
              </p>
              <div className="bg-gray-700/50 p-4 rounded-md w-full max-w-md">
                <textarea
                  ref={jobDescTextareaRef}
                  value={editedJobDesc}
                  onChange={(e) => setEditedJobDesc(e.target.value)}
                  className="w-full h-40 px-3 py-2 text-sm text-gray-800 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Paste the job description here..."
                />
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      if (editedJobDesc.trim().length < 20) {
                        alert("Please provide a more detailed job description (at least 20 characters)");
                        return;
                      }
                      if (onUpdateJobDescription) {
                        onUpdateJobDescription(editedJobDesc);
                      }
                    }}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Cover Letter
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-gray-800 border-b border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-300">Job Description:</h3>
                  {isEditingJobDesc ? (
                    <Button
                      onClick={handleSaveJobDescription}
                      variant="outline"
                      size="sm"
                      className="text-green-400 border-green-700 hover:bg-green-900/20"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save & Regenerate
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setIsViewingJobDesc(!isViewingJobDesc)}
                        variant="outline"
                        size="sm"
                        className="text-gray-300 border-gray-600 hover:bg-gray-700/50"
                      >
                        {isViewingJobDesc ? "Hide" : "View"}
                      </Button>
                      <Button
                        onClick={startEditingJobDesc}
                        variant="outline"
                        size="sm"
                        className="text-blue-400 border-blue-700 hover:bg-blue-900/20"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
                
                {isEditingJobDesc ? (
                  <div className="mt-2">
                    <textarea
                      ref={jobDescTextareaRef}
                      value={editedJobDesc}
                      onChange={(e) => setEditedJobDesc(e.target.value)}
                      className="w-full h-32 px-3 py-2 text-sm text-gray-800 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter the full job description here..."
                    />
                    <div className="mt-2">
                      <input
                        type="text"
                        value={positionTitle}
                        onChange={(e) => setPositionTitle(e.target.value)}
                        placeholder="Position title (for PDF subject line)"
                        className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mt-1 flex items-center text-xs text-gray-400">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Edit the job description to make your cover letter more accurate. Click "Save & Regenerate" when done.
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-700/50 p-2 rounded-md">
                      <p className="text-sm text-gray-300 line-clamp-1 overflow-ellipsis">
                        {jobDescription?.substring(0, 120)}
                        {jobDescription && jobDescription.length > 120 ? '...' : ''}
                      </p>
                    </div>
                    {isViewingJobDesc && (
                      <div className="mt-2 bg-gray-700/30 p-3 rounded-md max-h-60 overflow-y-auto">
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{jobDescription}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto bg-white p-6">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <RefreshCw className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                      <p className="text-gray-700">Generating your cover letter...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-600">Your Cover Letter:</h3>
                      <div className="text-xs text-gray-500">Edit directly in the text area below</div>
                    </div>
                    {!coverLetterContent && !isCoverLetterMode ? (
                      <div className="flex flex-col items-center justify-center h-[200px] bg-gray-50 rounded-md p-6 mb-4">
                        <FileText className="h-10 w-10 text-gray-400 mb-3" />
                        <p className="text-center text-gray-600 mb-3">
                          No cover letter content yet. You can:
                        </p>
                        <ul className="list-disc text-sm text-gray-500 space-y-1 pl-5">
                          <li>Write your own cover letter from scratch</li>
                          <li>Toggle "Cover Letter Mode" in the chatbot to generate one</li>
                          <li>Provide a job description in the editing panel above</li>
                        </ul>
                      </div>
                    ) : null}
                    <textarea
                      ref={coverLetterTextareaRef}
                      value={editableCoverLetter}
                      onChange={(e) => {
                        setEditableCoverLetter(e.target.value);
                        if (onUpdateCoverLetter) {
                          onUpdateCoverLetter(e.target.value);
                        }
                      }}
                      className="w-full h-full min-h-[500px] p-4 text-gray-800 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-pre-wrap font-serif"
                      style={{ resize: 'none', lineHeight: '1.6' }}
                      placeholder={!coverLetterContent && !isCoverLetterMode ? "Start typing your cover letter here..." : ""}
                    />
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
} 