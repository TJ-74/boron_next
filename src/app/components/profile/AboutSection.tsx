'use client';

import { useState } from 'react';
import { Button } from "@/app/components/ui/button";
import { PenSquare, Save, X, Sparkles } from "lucide-react";
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-200">About Me</h2>
        {!isEditing ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleEdit}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
          >
            <PenSquare className="h-4 w-4 mr-2" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
              disabled={isSaving || isGenerating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateAbout}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
              disabled={isSaving || isGenerating}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate with AI'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSave}
              className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
              disabled={isSaving || isGenerating}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <textarea
          value={tempAbout}
          onChange={(e) => setTempAbout(e.target.value)}
          className="w-full h-40 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
          placeholder="Write something about yourself..."
          disabled={isSaving || isGenerating}
        />
      ) : about ? (
        <p className="text-gray-300 leading-relaxed">{about}</p>
      ) : (
        <div className="text-center py-8 text-gray-400">
          No information added yet. Click the "Edit" button to add information about yourself.
        </div>
      )}
    </div>
  );
} 