'use client';

import { useState } from 'react';
import { Button } from "@/app/components/ui/button";
import { PenSquare, Save, X } from "lucide-react";

interface AboutSectionProps {
  initialAbout: string;
  onSave: (about: string) => Promise<void>;
}

export default function AboutSection({ initialAbout, onSave }: AboutSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [about, setAbout] = useState(initialAbout);
  const [isSaving, setIsSaving] = useState(false);
  const [tempAbout, setTempAbout] = useState(initialAbout);

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
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSave}
              className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
              disabled={isSaving}
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
          disabled={isSaving}
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