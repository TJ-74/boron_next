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

export default function BoronBot({ isOpen, onClose, profile }: BoronBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: `Hi ${profile.name}! I'm Boron Bot, your AI profile assistant. I can answer questions about your resume, like "What's in my work experience?" or "List my skills". How can I help you today?`,
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiMessages, setApiMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi ${profile.name}! I'm Boron Bot, your AI profile assistant. I can answer questions about your resume, like "What's in my work experience?" or "List my skills". How can I help you today?`,
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

  // Tab button to show/hide the chat
  const ChatTab = () => {
    if (!isTabVisible) return null;
    
    return (
      <div 
        className={`fixed left-0 top-1/2 transform -translate-y-1/2 z-50 transition-transform duration-300 ${isChatVisible ? 'translate-x-0' : 'translate-x-12'}`}
      >
        <button
          onClick={() => {
            if (isChatVisible) {
              setIsChatVisible(false);
            } else {
              setIsChatVisible(true);
              setIsCoverLetterPanelOpen(false);
            }
          }}
          className="flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 text-white p-3 rounded-r-xl shadow-2xl border border-blue-400/20 transition-all duration-200 hover:scale-105"
          title={isChatVisible ? "Hide Boron Bot" : "Show Boron Bot"}
        >
          {isChatVisible ? (
            <X className="h-6 w-6" />
          ) : (
            <div className="flex flex-col items-center">
              <Zap className="h-6 w-6 text-yellow-400 mb-1 animate-pulse" />
              <MessageSquare className="h-5 w-5" />
            </div>
          )}
        </button>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <ChatTab />
      
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
      
      {/* Shared backdrop for both panels */}
      {(isChatVisible || isCoverLetterPanelOpen) && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}
      
      {/* Chat Interface - only shown when isChatVisible is true */}
      {isChatVisible && (
        <>
          {/* Chat panel */}
          <div
            className={`fixed inset-y-0 right-0 w-full md:w-2/3 lg:w-1/2 xl:w-2/5 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 shadow-2xl z-50 transition-transform duration-300 ease-in-out transform border-l border-slate-700/50 ${isChatVisible ? 'translate-x-0' : 'translate-x-full'}`}
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
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-blue-900/80 via-purple-900/80 to-indigo-900/80 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-white flex items-center">
                  Boron Bot
                  <span className="ml-2 text-sm font-normal text-blue-300">AI Assistant</span>
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-slate-800/50 backdrop-blur-sm">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 shadow-lg backdrop-blur-sm border transition-all duration-200 hover:scale-[1.02] ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white border-blue-500/30 shadow-blue-500/20'
                          : 'bg-gradient-to-br from-slate-800 to-slate-700 text-slate-100 border-slate-600/30 shadow-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        {message.sender === 'bot' ? (
                          <Zap className="h-4 w-4 mr-2 text-yellow-400 animate-pulse" />
                        ) : (
                          <User className="h-4 w-4 mr-2 text-blue-200" />
                        )}
                        <span className="text-xs font-medium opacity-75">
                          {message.sender === 'user' ? 'You' : 'Boron Bot'} •{' '}
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-700 text-white rounded-2xl p-4 shadow-lg border border-slate-600/30 backdrop-blur-sm">
                      <div className="flex items-center space-x-1">
                        <Zap className="h-4 w-4 text-yellow-400 mr-2" />
                        <span className="text-xs text-slate-400 mr-3">Boron Bot is thinking...</span>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-slate-700/50 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-sm">
                <div className="flex items-end space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me about your profile or generate a cover letter..."
                      className="w-full px-4 py-3 bg-slate-800/70 backdrop-blur-sm border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-slate-400 resize-none transition-all duration-200 min-h-[48px] max-h-[120px]"
                      rows={1}
                      style={{ 
                        height: 'auto',
                        minHeight: '48px'
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl px-6 py-3 h-12 shadow-lg transition-all duration-200 disabled:opacity-50 hover:scale-105 disabled:hover:scale-100"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
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