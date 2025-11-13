'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/app/components/ui/button";
import { PenSquare, Plus, Briefcase, Save, X, Trash2, Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import { generateDescription, GenerationPrompt } from '@/app/services/groqService';

interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  includeInResume?: boolean;
  order?: number;
}

interface ExperienceSectionProps {
  experiences: Experience[];
  onAdd: (experience: Omit<Experience, 'id'>) => Promise<void>;
  onUpdate: (experience: Experience) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder?: (experiences: Experience[]) => Promise<void>;
}

export default function ExperienceSection({ 
  experiences, 
  onAdd, 
  onUpdate, 
  onDelete,
  onReorder 
}: ExperienceSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState<string>('auto');
  
  const [newExperience, setNewExperience] = useState<Omit<Experience, 'id'>>({
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    includeInResume: true
  });
  
  const [editExperience, setEditExperience] = useState<Experience | null>(null);

  // Sort experiences by order if available
  const sortedExperiences = [...experiences].sort((a, b) => {
    if (typeof a.order === 'number' && typeof b.order === 'number') {
      return a.order - b.order;
    }
    return 0;
  });

  const handleMoveExperience = async (currentIndex: number, direction: 'up' | 'down') => {
    if (!onReorder) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedExperiences.length) return;

    const items = Array.from(sortedExperiences);
    const [movedItem] = items.splice(currentIndex, 1);
    items.splice(newIndex, 0, movedItem);

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    try {
      await onReorder(updatedItems);
    } catch (error) {
      console.error('Failed to reorder experiences:', error);
    }
  };

  const handleAdd = async () => {
    setIsLoading(true);
    try {
      await onAdd(newExperience);
      setIsAdding(false);
      setNewExperience({
        company: '',
        position: '',
        location: '',
        startDate: '',
        endDate: '',
        description: '',
        includeInResume: true
      });
    } catch (error) {
      console.error('Failed to add experience:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editExperience) return;
    
    setIsLoading(true);
    try {
      await onUpdate(editExperience);
      setEditingId(null);
      setEditExperience(null);
    } catch (error) {
      console.error('Failed to update experience:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experience?')) return;
    
    setIsLoading(true);
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Failed to delete experience:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (experience: Experience) => {
    setEditingId(experience.id);
    setEditExperience({ ...experience });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditExperience(null);
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setNewExperience({
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
      includeInResume: true
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    // Format dates from YYYY-MM to MMM YYYY
    const formatDate = (dateString: string) => {
      if (!dateString) return 'Present';
      try {
        const [year, month] = dateString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      } catch (e) {
        return dateString; // Return as is if format is not YYYY-MM
      }
    };
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const handleToggleIncludeInResume = async (experience: Experience) => {
    setIsLoading(true);
    try {
      const updatedExperience = { 
        ...experience, 
        includeInResume: !experience.includeInResume 
      };
      await onUpdate(updatedExperience);
    } catch (error) {
      console.error('Failed to update experience:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIDescription = async (isEditing: boolean) => {
    const experience = isEditing ? editExperience : newExperience;
    if (!experience?.position || !experience?.company) {
      alert("Please fill in at least the Position and Company fields first");
      return;
    }

    let mode: 'replace' | 'enhance' = 'replace';
    
    // If there's an existing description, give the option to enhance instead of replace
    if (experience.description && experience.description.trim() !== '') {
      const userChoice = confirm(
        "Do you want to enhance the existing description (OK) or completely replace it (Cancel)?"
      );
      
      if (userChoice) {
        mode = 'enhance';
      } else {
        // User wants to replace, confirm this action
        if (!confirm("This will completely replace your existing description. Continue?")) {
          return;
        }
      }
    }

    setIsGeneratingDescription(true);
    try {
      // Create the prompt for Groq API
      const prompt: GenerationPrompt = {
        type: 'experience',
        position: experience.position,
        company: experience.company,
        additionalContext: experience.location ? 
          `Job location: ${experience.location}. Timeframe: ${experience.startDate} to ${experience.endDate || 'present'}` : '',
        mode,
        // Only include current description if enhancing
        ...(mode === 'enhance' && { currentDescription: experience.description })
      };
      
      // Call the Groq API service
      const generatedDescription = await generateDescription(prompt);
      
      if (isEditing && editExperience) {
        setEditExperience({
          ...editExperience,
          description: generatedDescription
        });
      } else {
        setNewExperience({
          ...newExperience,
          description: generatedDescription
        });
      }
    } catch (error) {
      console.error('Failed to generate description:', error);
      alert('Failed to generate description. Please try again.');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>, isEditing: boolean) => {
    const element = e.target;
    adjustTextareaHeight(element);
    
    if (isEditing && editExperience) {
      setEditExperience({...editExperience, description: e.target.value});
    } else {
      setNewExperience({...newExperience, description: e.target.value});
    }
  };

  // Effect to adjust textarea height when editing starts
  useEffect(() => {
    if (editExperience) {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        adjustTextareaHeight(textarea);
      }
    }
  }, [editExperience]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Work Experience</h2>
            <p className="text-sm text-gray-400">Showcase your career journey</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          disabled={isAdding || isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-sm disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Experience
        </button>
      </div>

      {/* Add Experience Form */}
      {isAdding && (
        <div className="rounded-2xl shadow-2xl border border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Plus className="h-4 w-4 text-purple-400" />
            </div>
            Add New Experience
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  value={newExperience.position}
                  onChange={(e) => setNewExperience({...newExperience, position: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                  placeholder="Senior Software Engineer"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={newExperience.company}
                  onChange={(e) => setNewExperience({...newExperience, company: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                  placeholder="Tech Corp"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                value={newExperience.location}
                onChange={(e) => setNewExperience({...newExperience, location: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                placeholder="New York, NY (or Remote)"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="month"
                  value={newExperience.startDate}
                  onChange={(e) => setNewExperience({...newExperience, startDate: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  End Date <span className="text-gray-400 font-normal">(leave empty for current)</span>
                </label>
                <input
                  type="month"
                  value={newExperience.endDate}
                  onChange={(e) => setNewExperience({...newExperience, endDate: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-300">
                  Description
                </label>
                <button
                  onClick={() => generateAIDescription(false)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-xs shadow-sm disabled:opacity-50"
                  disabled={isLoading || isGeneratingDescription || !newExperience.position || !newExperience.company}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isGeneratingDescription ? 'Generating...' : 'AI Generate'}
                </button>
              </div>
              <textarea
                value={newExperience.description}
                onChange={(e) => handleDescriptionChange(e, false)}
                className="w-full h-32 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500 resize-none"
                placeholder="Describe your responsibilities and achievements with bullet points (one per line)"
                disabled={isLoading || isGeneratingDescription}
              />
              <p className="text-xs text-gray-400 mt-2">Use a new line for each bullet point</p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="newIncludeInResume"
                checked={newExperience.includeInResume !== false}
                onChange={(e) => setNewExperience({...newExperience, includeInResume: e.target.checked})}
                className="h-4 w-4 rounded border-2 border-white/20 text-purple-400 focus:ring-purple-500 bg-white/5 backdrop-blur-xl"
                disabled={isLoading}
              />
              <label htmlFor="newIncludeInResume" className="ml-3 block text-sm font-semibold text-gray-300">
                Include in Resume
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={cancelAdding}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl text-gray-300 rounded-lg hover:bg-white/30 transition-all font-medium text-sm"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-sm disabled:opacity-50"
                disabled={isLoading || !newExperience.company || !newExperience.position}
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Experience'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Experience List */}
      <div className="space-y-6">
        {experiences.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Work Experience Yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Start building your professional story by adding your work experience. This helps showcase your career journey to potential employers.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all font-semibold"
            >
              <Briefcase className="h-5 w-5" />
              Add Your First Experience
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedExperiences.map((experience, index) => (
              <div
                key={experience.id}
                className={`${experience.includeInResume === false ? 'opacity-60' : ''}`}
              >
                {editingId === experience.id && editExperience ? (
                  <div className="rounded-2xl shadow-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                        <PenSquare className="h-4 w-4 text-purple-400" />
                      </div>
                      Edit Experience
                    </h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Position
                          </label>
                          <input
                            type="text"
                            value={editExperience.position}
                            onChange={(e) => setEditExperience({...editExperience, position: e.target.value})}
                            className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Company
                          </label>
                          <input
                            type="text"
                            value={editExperience.company}
                            onChange={(e) => setEditExperience({...editExperience, company: e.target.value})}
                            className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={editExperience.location}
                          onChange={(e) => setEditExperience({...editExperience, location: e.target.value})}
                          className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                          placeholder="e.g., New York, NY (or Remote)"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Start Date
                          </label>
                          <input
                            type="month"
                            value={editExperience.startDate}
                            onChange={(e) => setEditExperience({...editExperience, startDate: e.target.value})}
                            className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white"
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            End Date <span className="text-gray-400 font-normal">(leave empty if current)</span>
                          </label>
                          <input
                            type="month"
                            value={editExperience.endDate}
                            onChange={(e) => setEditExperience({...editExperience, endDate: e.target.value})}
                            className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-gray-300">
                            Description
                          </label>
                          <button
                            onClick={() => generateAIDescription(true)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-xs shadow-sm disabled:opacity-50"
                            disabled={isLoading || isGeneratingDescription || !editExperience.position || !editExperience.company}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {isGeneratingDescription ? 'Generating...' : 'AI Generate'}
                          </button>
                        </div>
                        <textarea
                          value={editExperience.description}
                          onChange={(e) => handleDescriptionChange(e, true)}
                          className="w-full h-32 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500 resize-none"
                          placeholder="Describe your responsibilities and achievements with bullet points (one per line)"
                          disabled={isLoading || isGeneratingDescription}
                        />
                        <p className="text-xs text-gray-400 mt-2">Use a new line for each bullet point</p>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="editIncludeInResume"
                          checked={editExperience.includeInResume !== false}
                          onChange={(e) => setEditExperience({...editExperience, includeInResume: e.target.checked})}
                          className="h-4 w-4 rounded border-2 border-white/20 text-purple-400 focus:ring-purple-500 bg-white/5 backdrop-blur-xl"
                          disabled={isLoading}
                        />
                        <label htmlFor="editIncludeInResume" className="ml-3 block text-sm font-semibold text-gray-300">
                          Include in Resume
                        </label>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <button
                          onClick={cancelEditing}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl text-gray-300 rounded-lg hover:bg-white/30 transition-all font-medium text-sm"
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdate}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-sm disabled:opacity-50"
                          disabled={isLoading || !editExperience.company || !editExperience.position}
                        >
                          <Save className="h-4 w-4" />
                          {isLoading ? 'Saving...' : 'Update Experience'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`rounded-2xl shadow-2xl border transition-all duration-200 hover:shadow-2xl group ${
                    experience.includeInResume === false ? 'border-white/20 opacity-75' : 'border-white/10 hover:border-purple-400/50'
                  }`}>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="relative">
                            <div className="bg-gradient-to-br from-purple-500/20 to-cyan-500/20 p-3 rounded-xl">
                              <Briefcase className="h-6 w-6 text-purple-400" />
                            </div>
                            {experience.includeInResume !== false && (
                              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-white mb-1">{experience.position}</h3>
                            <p className="text-lg text-gray-300 font-medium mb-2">{experience.company}</p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {experience.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h6a2 2 0 012 2v4m-6 4v10m-4-4h8" />
                                </svg>
                                {formatDateRange(experience.startDate, experience.endDate)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Reorder buttons */}
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleMoveExperience(index, 'up')}
                              disabled={index === 0 || isLoading}
                              className="p-1 rounded-md text-gray-400 hover:text-gray-400 hover:bg-white/10 backdrop-blur-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleMoveExperience(index, 'down')}
                              disabled={index === sortedExperiences.length - 1 || isLoading}
                              className="p-1 rounded-md text-gray-400 hover:text-gray-400 hover:bg-white/10 backdrop-blur-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleToggleIncludeInResume(experience)}
                              className={`p-2 rounded-lg transition-all ${
                                experience.includeInResume !== false
                                  ? 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'
                                  : 'text-gray-400 bg-white/5 backdrop-blur-xl hover:bg-white/20'
                              }`}
                              disabled={isLoading}
                              title={experience.includeInResume !== false ? "Included in Resume" : "Not in Resume"}
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => startEditing(experience)}
                              className="p-2 rounded-lg text-gray-400 bg-white/5 backdrop-blur-xl hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                              disabled={isLoading}
                            >
                              <PenSquare className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(experience.id)}
                              className="p-2 rounded-lg text-gray-400 bg-white/5 backdrop-blur-xl hover:text-red-400 hover:bg-red-500/10 transition-all"
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {experience.description && (
                        <div className="border-t border-white/10 pt-4">
                          <div className="space-y-2">
                            {experience.description.split('\n').map((line, i) => (
                              line.trim() ? (
                                <div key={i} className="flex items-start text-gray-300">
                                  <span className="mr-3 mt-1 text-purple-400 font-bold">•</span>
                                  <p className="flex-1 leading-relaxed">{line.trim()}</p>
                                </div>
                              ) : null
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}