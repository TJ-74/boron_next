'use client';

import { useState } from 'react';
import { Button } from "@/app/components/ui/button";
import { PenSquare, Save, X, Sparkles, User, Quote } from "lucide-react";
import { generateAbout, AboutGenerationPrompt } from '@/app/services/aboutService';

interface AboutSectionProps {
  initialAbout: string;
  onSave: (about: string) => Promise<void>;
  experiences?: Array<{
    position: string;
    company: string;
    description?: string;
  }>;
  skills?: string[];
  education?: Array<{
    school: string;
    degree: string;
  }>;
}

export default function AboutSection({
  initialAbout,
  onSave,
  experiences = [],
  skills = [],
  education = []
}: AboutSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [about, setAbout] = useState(initialAbout);
  const [isSaving, setIsSaving] = useState(false);
  const [tempAbout, setTempAbout] = useState(initialAbout);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleEdit = () => {
    setTempAbout(about);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempAbout(about);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(tempAbout);
      setAbout(tempAbout);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save about section:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAbout = async () => {
    let mode: 'replace' | 'enhance' = 'replace';

    if (tempAbout.trim() !== '') {
      const userChoice = confirm(
        "Do you want to enhance your existing About section (OK) or generate a completely new one (Cancel)?"
      );

      if (userChoice) {
        mode = 'enhance';
      } else {
        if (!confirm("This will completely replace your existing About section. Continue?")) {
          return;
        }
      }
    }

    setIsGenerating(true);
    try {
      const prompt: AboutGenerationPrompt = {
        experiences,
        skills,
        education,
        currentAbout: tempAbout,
        mode
      };

      const generatedAbout = await generateAbout(prompt);
      setTempAbout(generatedAbout);
    } catch (error) {
      console.error('Failed to generate About section:', error);
      alert('Failed to generate About section. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">About Me</h2>
            <p className="text-sm text-gray-400">Tell your story</p>
          </div>
        </div>

        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-lg hover:bg-white/20 hover:border-white/30 transition-all font-medium text-sm"
          >
            <PenSquare className="h-4 w-4" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-xl text-white rounded-lg hover:bg-white/20 transition-all font-medium text-sm"
              disabled={isSaving || isGenerating}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={handleGenerateAbout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-sm disabled:opacity-50"
              disabled={isSaving || isGenerating}
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'AI Generate'}
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all font-medium text-sm disabled:opacity-50"
              disabled={isSaving || isGenerating}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Content Section */}
      {isEditing ? (
        <div className="relative">
          <textarea
            value={tempAbout}
            onChange={(e) => setTempAbout(e.target.value)}
            className="w-full h-48 px-4 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500 resize-none"
            placeholder="Write something about yourself... Share your passion, experience, and what drives you professionally."
            disabled={isSaving || isGenerating}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-500">
            {tempAbout.length} characters
          </div>
        </div>
      ) : about ? (
        <div className="relative">
          <div className="absolute top-0 left-0 text-purple-500 opacity-20">
            <Quote className="h-8 w-8" />
          </div>
          <p className="text-gray-300 leading-relaxed pl-8 pt-2">{about}</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Tell Your Story</h3>
          <p className="text-gray-400 mb-4 max-w-md mx-auto">
            Share your professional journey, passions, and what makes you unique. This helps potential employers understand who you are beyond your resume.
          </p>
          <button
            onClick={handleEdit}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all font-semibold"
          >
            <PenSquare className="h-5 w-5" />
            Start Writing
          </button>
        </div>
      )}
    </div>
  );
} 