'use client';

import { FileText, X, Download, Printer, FileCode } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { ResumeData } from '@/app/resume-generator/page';

interface ResumeCanvasProps {
  isOpen: boolean;
  resumeData: ResumeData | null;
  resumeStyles: string;
  renderResume: (data: ResumeData) => string;
  onClose: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onPreviewOverleaf: () => void;
  selectedTemplate: 'classic' | 'modern';
  onTemplateChange: (template: 'classic' | 'modern') => void;
  viewMode: 'resume' | 'coverLetter';
  onViewModeChange: (mode: 'resume' | 'coverLetter') => void;
  coverLetterContent: string;
}

export default function ResumeCanvas({
  isOpen,
  resumeData,
  resumeStyles,
  renderResume,
  onClose,
  onDownload,
  onPrint,
  onPreviewOverleaf,
  selectedTemplate,
  onTemplateChange,
  viewMode,
  onViewModeChange,
  coverLetterContent,
}: ResumeCanvasProps) {
  const [renderKey, setRenderKey] = useState(0);

  // Force re-render when resumeData, selectedTemplate, or viewMode changes
  useEffect(() => {
    if (resumeData || coverLetterContent) {
      setRenderKey(prev => prev + 1);
    }
  }, [resumeData, selectedTemplate, viewMode, coverLetterContent]);

  if (!isOpen || (!resumeData && !coverLetterContent)) return null;

  return (
    <div className="overflow-hidden flex flex-col h-full resume-canvas-enter">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-lg border border-purple-500/30">
              <FileText className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{viewMode === 'resume' ? 'Resume Canvas' : 'Cover Letter'}</h2>
              <p className="text-[10px] text-gray-400">Live preview</p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 ml-4 border-r border-white/10 pr-4">
              <button
                onClick={() => onViewModeChange('resume')}
                className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition-all ${
                  viewMode === 'resume'
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
                title="Resume View"
              >
                Resume
              </button>
              <button
                onClick={() => onViewModeChange('coverLetter')}
                className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition-all ${
                  viewMode === 'coverLetter'
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
                title="Cover Letter View"
              >
                Cover Letter
              </button>
            </div>
            
            {/* Template Selector - Only show for Resume */}
            {viewMode === 'resume' && (
              <div className="flex items-center gap-1 ml-4">
              <button
                onClick={() => onTemplateChange('classic')}
                className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition-all ${
                  selectedTemplate === 'classic'
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
                title="Classic Template"
              >
                Classic
              </button>
              <button
                onClick={() => onTemplateChange('modern')}
                className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition-all ${
                  selectedTemplate === 'modern'
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
                title="Modern Template"
              >
                Modern
              </button>
            </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group"
            aria-label="Close resume canvas"
          >
            <X className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto bg-slate-900/60 p-4 custom-scrollbar">
            {viewMode === 'resume' && resumeData ? (
              <>
                <style dangerouslySetInnerHTML={{ __html: resumeStyles }} />
                <div 
                  key={`resume-${renderKey}`}
                  id="chat-resume-wrapper" 
                  dangerouslySetInnerHTML={{ __html: renderResume(resumeData) }} 
                />
              </>
            ) : (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-2xl" style={{ 
                  width: '8.5in', 
                  minHeight: '11in', 
                  padding: '0.5in',
                  margin: '0 auto'
                }}>
                  <style dangerouslySetInnerHTML={{ __html: `
                    .cover-letter-content {
                      color: #111827 !important;
                      font-family: 'Times New Roman', Times, serif;
                      font-size: 11pt;
                      line-height: 1.5;
                      max-width: 100%;
                    }
                    .cover-letter-content p {
                      color: #111827 !important;
                      margin-bottom: 0.75em;
                      text-align: left;
                      line-height: 1.5;
                    }
                    .cover-letter-content * {
                      color: #111827 !important;
                    }
                    .cover-letter-header {
                      margin-bottom: 1.5em;
                    }
                    .cover-letter-date {
                      margin-bottom: 0.5em;
                    }
                    .cover-letter-contact {
                      margin-bottom: 1.5em;
                      text-align: left;
                    }
                    .cover-letter-body {
                      margin-bottom: 1em;
                    }
                    .cover-letter-closing {
                      margin-top: 1.5em;
                    }
                  ` }} />
                  {coverLetterContent ? (
                    <div 
                      className="cover-letter-content"
                      dangerouslySetInnerHTML={{ __html: coverLetterContent }} 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <p>No cover letter generated yet. Provide a job description to generate one.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-t border-white/10 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
              <span className="text-[10px] sm:text-xs text-green-400 font-medium">Auto-Saved</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPreviewOverleaf}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-200 font-semibold text-xs hover:scale-105 active:scale-95"
              title="Preview in Overleaf"
            >
              <FileCode className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Overleaf</span>
            </button>
            <button
              onClick={onDownload}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 hover:from-purple-500 hover:via-fuchsia-400 hover:to-cyan-400 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-200 font-semibold text-xs hover:scale-105 active:scale-95"
              title="Download PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onPrint}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all duration-200 font-semibold text-xs hover:scale-105 active:scale-95"
              title="Print"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.4);
          border-radius: 4px;
          border: 1px solid rgba(15, 23, 42, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.6);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.4) rgba(15, 23, 42, 0.5);
        }
      `}</style>
    </div>
  );
}

