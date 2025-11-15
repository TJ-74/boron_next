'use client';

import { History, Plus, Trash2, MessageSquare, Clock, FileText, X } from 'lucide-react';
import { useState } from 'react';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ResumeData {
  [key: string]: any;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
  apiMessages: ChatMessage[];
  resumeData: ResumeData | null;
}

interface ChatHistoryProps {
  isOpen: boolean;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSwitchSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
  onToggle: () => void;
}

export default function ChatHistory({
  isOpen,
  sessions,
  currentSessionId,
  onNewChat,
  onSwitchSession,
  onDeleteSession,
  onToggle,
}: ChatHistoryProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 24) {
      if (hours < 1) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes < 1 ? 'Just now' : `${minutes}m ago`;
      }
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getMessageCount = (session: ChatSession) => {
    return session.messages.filter(m => m.sender === 'user').length;
  };

  return (
    <>
      {/* History Icon and New Chat Button when closed */}
      {!isOpen && (
        <div className="fixed left-0 top-20 sm:top-24 z-30 ml-2 sm:ml-4 flex flex-col gap-2">
          <div 
            className="p-3 bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl border border-white/10 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:border-purple-500/50 cursor-pointer group"
            onMouseEnter={onToggle}
            title="Show Chat History"
          >
            <History className="h-5 w-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
          </div>
          <button
            onClick={onNewChat}
            className="p-3 bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl border border-white/10 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:border-cyan-500/50 cursor-pointer group"
            title="New Chat"
          >
            <Plus className="h-5 w-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
          </button>
        </div>
      )}

      {/* Full Sidebar when open */}
      <div
        className={`${
          isOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 ease-in-out overflow-hidden border-r border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl flex-shrink-0 shadow-2xl`}
        onMouseLeave={(e) => {
          if (isOpen) {
            // Close when mouse leaves the sidebar
            const rect = e.currentTarget.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right) {
              onToggle();
            }
          }
        }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-white/10 bg-white/5 backdrop-blur-xl flex-shrink-0">
            <div className="flex items-center justify-end">
              <button
                onClick={onToggle}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group"
                title="Hide Chat History"
              >
                <X className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </div>
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 hover:shadow-lg hover:shadow-purple-500/50 text-white rounded-lg transition-all duration-200 font-semibold text-xs hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-6 px-3">
              <div className="mb-3 p-3 bg-white/5 rounded-full border border-white/10">
                <MessageSquare className="h-7 w-7 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5">No chats yet</h3>
              <p className="text-xs text-gray-400 mb-3 max-w-[180px]">
                Start chatting to save sessions
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                <Clock className="h-3 w-3" />
                <span>Auto-saves</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {[...sessions].reverse().map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSwitchSession(session.id)}
                  onMouseEnter={() => setHoveredId(session.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`group relative p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                    currentSessionId === session.id
                      ? 'bg-gradient-to-r from-purple-500/20 via-fuchsia-500/10 to-cyan-500/20 border border-purple-500/50 shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20'
                  } backdrop-blur-sm hover:scale-[1.01] active:scale-[0.99]`}
                >
                  {/* Current Session Indicator */}
                  {currentSessionId === session.id && (
                    <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-purple-500 via-fuchsia-500 to-cyan-500 rounded-r-full" />
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <div className="flex items-start gap-1.5 mb-1.5">
                        <FileText className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${
                          currentSessionId === session.id ? 'text-purple-400' : 'text-gray-400'
                        }`} />
                        <h3 className={`text-xs font-semibold leading-snug line-clamp-2 ${
                          currentSessionId === session.id ? 'text-white' : 'text-gray-200'
                        }`}>
                          {session.title || 'Untitled Chat'}
                        </h3>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <div className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{formatTimestamp(session.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <MessageSquare className="h-2.5 w-2.5" />
                          <span>{getMessageCount(session)}</span>
                        </div>
                      </div>

                      {/* Resume Indicator */}
                      {session.resumeData && (
                        <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 border border-green-500/30 rounded">
                          <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-[9px] text-green-400 font-medium">Resume</span>
                        </div>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => onDeleteSession(session.id, e)}
                      className={`p-1 hover:bg-red-500/20 rounded transition-all ${
                        hoveredId === session.id || currentSessionId === session.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      }`}
                      title="Delete chat"
                    >
                      <Trash2 className="h-3 w-3 text-red-400 hover:text-red-300" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-2 border-t border-white/10 bg-white/5 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
            <span>Auto-saved</span>
          </div>
        </div>
      </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
          border: 1px solid rgba(15, 23, 42, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.3) rgba(15, 23, 42, 0.3);
        }
      `}</style>
    </>
  );
}

