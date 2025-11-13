'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Zap, MessageSquare, FileText } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import type { UserProfile, Experience, Education, Skill, Project } from '../../types/profile';
import CoverLetterPanel from './CoverLetterPanel';

interface BoronBotProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// ChatAPI message format
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Helper function to render markdown in messages
const renderMarkdown = (text: string) => {
  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, partIndex) => {
    // Handle code blocks
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.slice(3, -3).trim();
      return (
        <pre key={partIndex} className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-lg p-3 my-2 overflow-x-auto">
          <code className="text-sm font-mono text-gray-300">{code}</code>
        </pre>
      );
    }

    // Split by newlines to handle lists
    const lines = part.split('\n');
    return lines.map((line, lineIndex) => {
      // Handle bullet points (• or -)
      if (line.trim().match(/^[•\-\*]\s/)) {
        const content = line.trim().replace(/^[•\-\*]\s/, '');
        return (
          <div key={`${partIndex}-${lineIndex}`} className="flex items-start gap-3 my-1 pl-1">
            <span className="text-purple-400 font-bold text-sm leading-5 mt-0.5 flex-shrink-0 w-3 text-center">•</span>
            <span className="flex-1 leading-relaxed">{processInlineFormatting(content, `${partIndex}-${lineIndex}`)}</span>
          </div>
        );
      }

      // Handle numbered lists
      if (line.trim().match(/^\d+\.\s/)) {
        const match = line.trim().match(/^(\d+)\.\s(.+)$/);
        if (match) {
          return (
            <div key={`${partIndex}-${lineIndex}`} className="flex items-start gap-3 my-1 pl-1">
              <span className="text-purple-400 font-semibold text-sm leading-5 mt-0.5 flex-shrink-0 w-4 text-right">{match[1]}.</span>
              <span className="flex-1 leading-relaxed">{processInlineFormatting(match[2], `${partIndex}-${lineIndex}`)}</span>
            </div>
          );
        }
      }

      // Regular line with inline formatting
      return (
        <div key={`${partIndex}-${lineIndex}`}>
          {processInlineFormatting(line, `${partIndex}-${lineIndex}`)}
        </div>
      );
    });
  });
};

// Helper to process inline formatting (bold, italic, code)
const processInlineFormatting = (text: string, keyPrefix: string) => {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let index = 0;

  // Regex patterns
  const patterns = [
    { regex: /\*\*(.+?)\*\*/g, render: (match: string, content: string, i: number) =>
      <strong key={`${keyPrefix}-bold-${i}`} className="font-bold">{content}</strong> },
    { regex: /__(.+?)__/g, render: (match: string, content: string, i: number) =>
      <strong key={`${keyPrefix}-bold2-${i}`} className="font-bold">{content}</strong> },
    { regex: /\*(.+?)\*/g, render: (match: string, content: string, i: number) =>
      <em key={`${keyPrefix}-italic-${i}`} className="italic">{content}</em> },
    { regex: /_(.+?)_/g, render: (match: string, content: string, i: number) =>
      <em key={`${keyPrefix}-italic2-${i}`} className="italic">{content}</em> },
    { regex: /`(.+?)`/g, render: (match: string, content: string, i: number) =>
      <code key={`${keyPrefix}-code-${i}`} className="bg-slate-800/50 backdrop-blur-xl border border-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-purple-400">{content}</code> },
  ];

  // Find all matches
  const matches: Array<{ start: number; end: number; element: React.ReactNode }> = [];

  patterns.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.regex);
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        element: pattern.render(match[0], match[1], match.index)
      });
    }
  });

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  // Build elements array
  let lastEnd = 0;
  matches.forEach((match, i) => {
    // Skip overlapping matches
    if (match.start < lastEnd) return;

    // Add text before match
    if (match.start > lastEnd) {
      elements.push(text.slice(lastEnd, match.start));
    }

    // Add formatted element
    elements.push(match.element);
    lastEnd = match.end;
  });

  // Add remaining text
  if (lastEnd < text.length) {
    elements.push(text.slice(lastEnd));
  }

  return elements.length > 0 ? <>{elements}</> : text;
};

export default function BoronBot({ isOpen, onClose, profile }: BoronBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: `Hi ${profile.name}! I'm **Boron Bot**, your AI profile assistant. I can answer questions about your resume, like:

- "What's in my work experience?"
- "List my skills"
- "Tell me about my projects"
- "Show me my education"

How can I help you today?`,
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiMessages, setApiMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi ${profile.name}! I'm **Boron Bot**, your AI profile assistant. I can answer questions about your resume, like:

- "What's in my work experience?"
- "List my skills"
- "Tell me about my projects"
- "Show me my education"

How can I help you today?`,
    }
  ]);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isCoverLetterPanelOpen, setIsCoverLetterPanelOpen] = useState(false);
  const [coverLetterContent, setCoverLetterContent] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [isEditedCoverLetter, setIsEditedCoverLetter] = useState(false);
  const [isCoverLetterMode, setIsCoverLetterMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea function
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Focus input when component opens
    if (isOpen && textareaRef.current && isChatVisible) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [isOpen, isChatVisible]);

  useEffect(() => {
    // Update tab visibility when isOpen changes
    if (!isOpen) {
      setIsChatVisible(false);
      setIsCoverLetterPanelOpen(false);
    } else {
      setIsChatVisible(true);
    }
    setIsTabVisible(isOpen);
  }, [isOpen]);

  useEffect(() => {
    // Adjust textarea height when input value changes
    adjustTextareaHeight();
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    // Add user message to UI
    setMessages((prev) => [...prev, userMessage]);
    
    // Add user message to API message history
    const newUserApiMessage: ChatMessage = {
      role: 'user',
      content: inputValue
    };
    
    // Update API messages
    const updatedApiMessages = [...apiMessages, newUserApiMessage];
    setApiMessages(updatedApiMessages);
    
    // Check if we're in cover letter mode and this looks like a job description
    const lowerCaseInput = inputValue.toLowerCase();
    const looksCoverLetterRelated = 
      lowerCaseInput.includes('cover letter') || 
      lowerCaseInput.includes('write a letter') ||
      lowerCaseInput.includes('create a letter') ||
      lowerCaseInput.includes('generate a letter') ||
      lowerCaseInput.includes('make a letter') ||
      (lowerCaseInput.includes('letter') && 
       (lowerCaseInput.includes('job') || lowerCaseInput.includes('position')));
      
    const shouldGenerateCoverLetter = isCoverLetterMode || 
      (looksCoverLetterRelated && 
       (lowerCaseInput.includes('job') || 
        lowerCaseInput.includes('position') || 
        lowerCaseInput.includes('role') ||
        lowerCaseInput.includes('application') ||
        lowerCaseInput.length > 100)); // Consider long messages as potential job descriptions
    
    // Clear input and show typing indicator
    setInputValue('');
    setIsTyping(true);

    try {
      if (shouldGenerateCoverLetter) {
        // Extract job description from the message
        let jobDescFromMessage = inputValue;
        
        // Remove common phrases to better isolate the job description
        jobDescFromMessage = jobDescFromMessage.replace(
          /(?:write|create|generate|make|can you|could you|please|would you)?\s*(?:a|the)?\s*cover letter(?:\s+for|\s+based on|\s+regarding)?|i need|i want|i'd like|i would like|job description:?|job posting:?|position description:?|role:?|here's the job description:?|applying for|the job is for|and the job|can you make|the description is|the requirements are/gi, 
          ''
        ).trim();
        
        // Clean up leading/trailing punctuation and multiple spaces
        jobDescFromMessage = jobDescFromMessage.replace(/^[.,;:!?\s]+|[.,;:!?\s]+$/g, '').replace(/\s+/g, ' ');
        
        // Fallback if the job description is too short
        if (jobDescFromMessage.length < 50) {
          // Ask for more details about the job
          const followUpMsg = `I'd be happy to create a cover letter for you. Could you please provide more details about the job you're applying for? Please paste the full job description or share more specifics about the role, company, and requirements.`;
          
          setMessages((prev) => [
            ...prev,
            {
              text: followUpMsg,
              sender: 'bot',
              timestamp: new Date(),
            },
          ]);
          
          setApiMessages([...updatedApiMessages, {
            role: 'assistant',
            content: followUpMsg
          }]);
          
          setIsTyping(false);
          return;
        }
        
        // Add bot response acknowledging the request
        const acknowledgement = `I'll create a cover letter based on your profile and the job description you provided. You can view, edit, and customize it in the panel that opens.`;
        
        setMessages((prev) => [
          ...prev,
          {
            text: acknowledgement,
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
        
        // Add bot acknowledgement to API message history
        setApiMessages([...updatedApiMessages, {
          role: 'assistant',
          content: acknowledgement
        }]);
        
        // Set job description and trigger cover letter generation
        setJobDescription(jobDescFromMessage);
        setIsGeneratingCoverLetter(true);
        setIsCoverLetterPanelOpen(true);
        
        // Call the cover letter API
        const coverLetterResponse = await fetch('/api/cover-letter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile,
            jobDescription: jobDescFromMessage,
          }),
        });

        if (!coverLetterResponse.ok) {
          throw new Error('Failed to generate cover letter');
        }

        const coverLetterData = await coverLetterResponse.json();
        setCoverLetterContent(coverLetterData.coverLetter);
        
      } else {
        // Regular chat message processing
        // Call the API with the updated message history
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: updatedApiMessages,
            profile,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response from AI');
        }

        const data = await response.json();
        
        // Add bot response to UI
        setMessages((prev) => [
          ...prev,
          {
            text: data.message,
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
        
        // Add bot response to API message history
        setApiMessages([...updatedApiMessages, {
          role: 'assistant',
          content: data.message
        }]);
      }
      
    } catch (error) {
      console.error('Error getting response:', error);
      
      if (shouldGenerateCoverLetter) {
        // Show error message for cover letter generation
        setMessages((prev) => [
          ...prev,
          {
            text: "I'm sorry, I couldn't generate a cover letter at this time. Please try again later.",
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
        
        // Add error message to API message history
        setApiMessages([...updatedApiMessages, {
          role: 'assistant',
          content: "I'm sorry, I couldn't generate a cover letter at this time. Please try again later."
        }]);
        
      } else {
        // Fallback to local response for regular chat
        const botResponse = generateBotResponse(inputValue, profile);
        setMessages((prev) => [
          ...prev,
          {
            text: botResponse,
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
        
        // Add fallback response to API message history
        setApiMessages([...updatedApiMessages, {
          role: 'assistant',
          content: botResponse
        }]);
      }
      
    } finally {
      setIsTyping(false);
      setIsGeneratingCoverLetter(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRegenerateCoverLetter = async () => {
    if (!jobDescription || isGeneratingCoverLetter) {
      return;
    }

    setIsGeneratingCoverLetter(true);
    try {
      const response = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile,
          jobDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover letter');
      }

      const data = await response.json();
      setCoverLetterContent(data.coverLetter);
    } catch (error) {
      console.error('Error generating cover letter:', error);
      setMessages([...messages, {
        text: "I'm sorry, I couldn't generate the cover letter at this time. Please try again later.",
        sender: 'bot',
        timestamp: new Date(),
      }]);
      
      // Also update API messages
      setApiMessages([...apiMessages, {
        role: 'assistant',
        content: "I'm sorry, I couldn't generate the cover letter at this time. Please try again later."
      }]);
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const handleUpdateJobDescription = async (newJobDescription: string) => {
    setJobDescription(newJobDescription);
    
    // Regenerate cover letter with the updated job description
    setIsGeneratingCoverLetter(true);
    try {
      const response = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile,
          jobDescription: newJobDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover letter with updated job description');
      }

      const data = await response.json();
      setCoverLetterContent(data.coverLetter);
      
      // Add a message to inform the user
      setMessages([...messages, {
        text: "I've updated your cover letter based on the edited job description.",
        sender: 'bot',
        timestamp: new Date(),
      }]);
      
      // Also update API messages
      setApiMessages([...apiMessages, {
        role: 'assistant',
        content: "I've updated your cover letter based on the edited job description."
      }]);
    } catch (error) {
      console.error('Error regenerating cover letter:', error);
      setMessages([...messages, {
        text: "I'm sorry, I couldn't regenerate the cover letter with your updated job description. Please try again.",
        sender: 'bot',
        timestamp: new Date(),
      }]);
      
      // Also update API messages
      setApiMessages([...apiMessages, {
        role: 'assistant',
        content: "I'm sorry, I couldn't regenerate the cover letter with your updated job description. Please try again."
      }]);
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  // Track updates to the cover letter content (when edited directly)
  const handleUpdateCoverLetter = (updatedContent: string) => {
    setCoverLetterContent(updatedContent);
    setIsEditedCoverLetter(true);
  };

  // Function to handle backdrop click - simplify to always close everything
  const handleBackdropClick = () => {
    closeAllPanels();
  };

  // Function to completely close both panels
  const closeAllPanels = () => {
    setIsChatVisible(false);
    setIsCoverLetterPanelOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Cover Letter Panel */}
      <CoverLetterPanel
        isOpen={isCoverLetterPanelOpen}
        onClose={() => {
          setIsCoverLetterPanelOpen(false);
          // If chat is also not visible, close everything
          if (!isChatVisible) {
            onClose();
          }
        }}
        coverLetterContent={coverLetterContent}
        jobDescription={jobDescription}
        isLoading={isGeneratingCoverLetter}
        onRegenerateCoverLetter={handleRegenerateCoverLetter}
        onUpdateJobDescription={handleUpdateJobDescription}
        onUpdateCoverLetter={handleUpdateCoverLetter}
        isCoverLetterMode={isCoverLetterMode}
      />
      
      {/* Chat Interface - Professional Side Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-[480px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl z-50 transition-all duration-300 ease-in-out border-l border-white/10 ${isChatVisible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Grid Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-xl flex-shrink-0 h-20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">AI Assistant</h2>
                <p className="text-xs text-gray-400">Powered by Boron</p>
              </div>
            </div>
            <button
              onClick={closeAllPanels}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-scroll px-6 pt-6 pb-6 space-y-4 min-h-0"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#64748b #1e293b'
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                } animate-in fade-in slide-in-from-bottom-4 duration-300`}
              >
                <div
                  className={`group relative max-w-[85%] ${
                    message.sender === 'user'
                      ? 'rounded-3xl rounded-br-md'
                      : 'rounded-3xl rounded-bl-md'
                  } transition-all duration-200 hover:scale-[1.01]`}
                >
                  {message.sender === 'bot' && (
                    <div className="flex items-center gap-2 mb-2 ml-1">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-gray-400">AI Assistant</span>
                    </div>
                  )}
                  <div
                    className={`p-4 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-purple-600 via-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-white/5 backdrop-blur-xl text-white border border-white/10 shadow-lg'
                    } ${
                      message.sender === 'user'
                        ? 'rounded-3xl rounded-br-md'
                        : 'rounded-3xl rounded-bl-md'
                    }`}
                  >
                    <div className="leading-relaxed text-sm">{renderMarkdown(message.text)}</div>
                  </div>
                  {message.sender === 'user' && (
                    <div className="flex items-center justify-end gap-2 mt-1 mr-1">
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col gap-2 ml-1">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-gray-400">AI Assistant</span>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl text-white rounded-3xl rounded-bl-md p-4 shadow-lg border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-xs text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-xl flex-shrink-0">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your profile or request a cover letter..."
                className="w-full pl-4 pr-14 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white placeholder-gray-500 resize-none transition-all duration-200 min-h-[56px] max-h-[120px] shadow-lg hover:bg-white/10"
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '56px'
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-2 bottom-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 hover:shadow-lg hover:shadow-purple-500/50 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl p-3 shadow-lg transition-all duration-200 disabled:opacity-50 hover:scale-105 disabled:hover:scale-100 flex items-center justify-center"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Function to generate bot responses based on user input and profile data
function generateBotResponse(userInput: string, profile: UserProfile): string {
  const input = userInput.toLowerCase();

  // Check for greetings
  if (
    input.includes('hello') ||
    input.includes('hi') ||
    input.includes('hey') ||
    input === 'yo'
  ) {
    return `Hello again! How can I help you with your profile information?`;
  }

  // Experience related queries
  if (
    input.includes('experience') ||
    input.includes('work') ||
    input.includes('job') ||
    input.includes('career')
  ) {
    if (profile.experiences.length === 0) {
      return `You don't have any work experience listed in your profile yet.`;
    }

    let response = `You have ${profile.experiences.length} work experience entries on your profile:\n\n`;
    
    profile.experiences.forEach((exp: Experience, index: number) => {
      response += `${index + 1}. ${exp.position} at ${exp.company}`;
      response += `\n   ${formatDate(exp.startDate)} - ${formatDate(exp.endDate)}`;
      response += `\n   ${exp.location}\n\n`;
    });

    return response;
  }

  // Education queries
  if (
    input.includes('education') ||
    input.includes('school') ||
    input.includes('college') ||
    input.includes('university') ||
    input.includes('degree')
  ) {
    if (profile.education.length === 0) {
      return `You don't have any education entries listed in your profile yet.`;
    }

    let response = `You have ${profile.education.length} education entries on your profile:\n\n`;
    
    profile.education.forEach((edu: Education, index: number) => {
      response += `${index + 1}. ${edu.degree} from ${edu.school}`;
      response += `\n   ${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`;
      if (edu.cgpa) response += `\n   GPA: ${edu.cgpa}`;
      response += '\n\n';
    });

    return response;
  }

  // Skills queries
  if (
    input.includes('skill') ||
    input.includes('abilities') ||
    input.includes('what can i do') ||
    input.includes('what am i good at')
  ) {
    if (profile.skills.length === 0) {
      return `You don't have any skills listed in your profile yet.`;
    }

    // Group skills by domain
    const skillsByDomain: Record<string, string[]> = {};
    profile.skills.forEach((skill: Skill) => {
      if (!skillsByDomain[skill.domain]) {
        skillsByDomain[skill.domain] = [];
      }
      skillsByDomain[skill.domain].push(skill.name);
    });

    let response = `You have ${profile.skills.length} skills across ${Object.keys(skillsByDomain).length} domains:\n\n`;
    
    Object.entries(skillsByDomain).forEach(([domain, skills]) => {
      response += `• ${domain}: ${skills.join(', ')}\n`;
    });

    return response;
  }

  // Projects queries
  if (
    input.includes('project') ||
    input.includes('portfolio') ||
    input.includes('work i did') ||
    input.includes('what i built')
  ) {
    if (profile.projects.length === 0) {
      return `You don't have any projects listed in your profile yet.`;
    }

    let response = `You have ${profile.projects.length} projects on your profile:\n\n`;
    
    profile.projects.forEach((project: Project, index: number) => {
      response += `${index + 1}. ${project.title}`;
      if (project.technologies) response += `\n   Technologies: ${project.technologies}`;
      response += `\n   ${formatDate(project.startDate)} - ${formatDate(project.endDate)}\n\n`;
    });

    return response;
  }

  // About/summary queries
  if (
    input.includes('about me') ||
    input.includes('summary') ||
    input.includes('bio') ||
    input.includes('who am i') ||
    input.includes('describe me')
  ) {
    if (!profile.about || profile.about.trim() === '') {
      return `You don't have an "About Me" section completed yet in your profile.`;
    }
    
    return `Here's your profile summary:\n\n${profile.about}`;
  }

  // Profile overview
  if (
    input.includes('overview') ||
    input.includes('profile') ||
    input.includes('resume') ||
    input.includes('show all') ||
    input.includes('everything')
  ) {
    let response = `${profile.name}'s Profile Overview:\n\n`;
    
    if (profile.title) {
      response += `Title: ${profile.title}\n\n`;
    }
    
    if (profile.about) {
      response += `About: ${profile.about.substring(0, 100)}${profile.about.length > 100 ? '...' : ''}\n\n`;
    }
    
    response += `Experience: ${profile.experiences.length} entries\n`;
    response += `Education: ${profile.education.length} entries\n`;
    response += `Skills: ${profile.skills.length} skills\n`;
    response += `Projects: ${profile.projects.length} projects\n\n`;
    
    response += `What specific part would you like to know more about?`;
    
    return response;
  }

  // Help command
  if (
    input.includes('help') ||
    input.includes('what can you do') ||
    input.includes('how to use') ||
    input.includes('commands')
  ) {
    return `I can help you explore and learn about your profile. Try asking me things like:

• "Show me my work experience"
• "What education do I have?"
• "List my skills"
• "Tell me about my projects"
• "What's my profile summary?"
• "Give me an overview of my profile"

You can also ask for specific details about any part of your profile!`;
  }

  // Default response if no patterns match
  return `I'm not sure how to answer that question about your profile. You can ask me about your experience, education, skills, projects, or summary. Type "help" for more options.`;
}

// Helper function to format dates nicely
function formatDate(dateString?: string): string {
  if (!dateString) return 'Present';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (e) {
    return dateString;
  }
} 