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
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">About Me</h2>
            <p className="text-sm text-gray-500">Tell your story</p>
          </div>
        </div>

        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium text-sm shadow-sm"
          >
            <PenSquare className="h-4 w-4" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm"
              disabled={isSaving || isGenerating}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={handleGenerateAbout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
              disabled={isSaving || isGenerating}
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'AI Generate'}
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
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
            className="w-full h-48 px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
            placeholder="Write something about yourself... Share your passion, experience, and what drives you professionally."
            disabled={isSaving || isGenerating}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            {tempAbout.length} characters
          </div>
        </div>
      ) : about ? (
        <div className="relative">
          <div className="absolute top-0 left-0 text-blue-500 opacity-20">
            <Quote className="h-8 w-8" />
          </div>
          <p className="text-gray-700 leading-relaxed pl-8 pt-2">{about}</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tell Your Story</h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            Share your professional journey, passions, and what makes you unique. This helps potential employers understand who you are beyond your resume.
          </p>
          <button
            onClick={handleEdit}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-sm hover:shadow-md"
          >
            <PenSquare className="h-5 w-5" />
            Start Writing
          </button>
        </div>
      )}
    </div>
  );
} 