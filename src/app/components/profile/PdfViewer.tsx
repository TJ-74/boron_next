'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Printer } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface PdfViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  userId?: string;
}

export default function PdfViewer({ isOpen, onClose, pdfUrl, userId }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && pdfUrl) {
      setIsLoading(true);
      setError(null);
      setCurrentUrl(pdfUrl);
    }
  }, [isOpen, pdfUrl]);

  // Add escape key handler
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    
    // Disable body scroll when viewer is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load resume. Please try again later.');
  };

  // Add a timestamp to the URL to force reload when needed
  const getUrlWithTimestamp = () => {
    if (!currentUrl) return '';
    // Always force a fresh reload by adding a timestamp
    const baseUrl = currentUrl.split('?')[0]; // Remove any existing query params
    return `${baseUrl}?t=${new Date().getTime()}`;
  };

  const refreshResume = () => {
    setIsLoading(true);
    setError(null);
    
    // Force a new PDF to be generated with updated certificates
    if (userId) {
      const baseUrl = window.location.origin;
      setCurrentUrl(`${baseUrl}/api/pdf-resume/${userId}`);
    } else {
      setCurrentUrl(pdfUrl);
    }
  };

  const handlePrint = () => {
    const iframe = document.getElementById('resume-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-70 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Resume Viewer panel */}
      <div 
        className="fixed inset-y-0 right-0 z-50 w-full md:w-2/3 lg:w-1/2 xl:w-2/5 bg-gray-900 shadow-2xl transform transition-all duration-300 ease-in-out animate-slide-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'slide-in 0.3s forwards',
        }}
      >
        <style jsx>{`
          @keyframes slide-in {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
        `}</style>
        
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">Resume Preview</h2>
            <div className="flex items-center gap-3">
              <Button 
                onClick={refreshResume} 
                variant="outline" 
                size="sm"
                className="text-blue-400 border-blue-800 hover:text-blue-300 hover:bg-blue-900/20"
                disabled={isLoading}
              >
                Refresh
              </Button>
              <Button 
                onClick={handlePrint} 
                variant="outline" 
                size="sm"
                className="text-green-400 border-green-800 hover:text-green-300 hover:bg-green-900/20"
                disabled={isLoading}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button 
                onClick={onClose} 
                variant="ghost" 
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden bg-gray-100">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                  <p className="text-gray-300">Loading resume...</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
                <div className="max-w-md p-6 text-center">
                  <p className="text-red-400 mb-4">{error}</p>
                  <Button 
                    onClick={refreshResume} 
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
            
            {currentUrl && (
              <iframe 
                id="resume-iframe"
                src={getUrlWithTimestamp()}
                className="w-full h-full border-0"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                title="Resume"
                sandbox="allow-same-origin allow-scripts allow-modals allow-popups allow-forms"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
} 