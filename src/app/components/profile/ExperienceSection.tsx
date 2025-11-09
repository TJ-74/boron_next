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
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Work Experience</h2>
            <p className="text-sm text-gray-500">Showcase your career journey</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          disabled={isAdding || isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Experience
        </button>
      </div>

      {/* Add Experience Form */}
      {isAdding && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
              <Plus className="h-4 w-4 text-green-600" />
            </div>
            Add New Experience
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  value={newExperience.position}
                  onChange={(e) => setNewExperience({...newExperience, position: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Senior Software Engineer"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={newExperience.company}
                  onChange={(e) => setNewExperience({...newExperience, company: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Tech Corp"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={newExperience.location}
                onChange={(e) => setNewExperience({...newExperience, location: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="New York, NY (or Remote)"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="month"
                  value={newExperience.startDate}
                  onChange={(e) => setNewExperience({...newExperience, startDate: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date <span className="text-gray-500 font-normal">(leave empty for current)</span>
                </label>
                <input
                  type="month"
                  value={newExperience.endDate}
                  onChange={(e) => setNewExperience({...newExperience, endDate: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Description
                </label>
                <button
                  onClick={() => generateAIDescription(false)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-xs shadow-sm disabled:opacity-50"
                  disabled={isLoading || isGeneratingDescription || !newExperience.position || !newExperience.company}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isGeneratingDescription ? 'Generating...' : 'AI Generate'}
                </button>
              </div>
              <textarea
                value={newExperience.description}
                onChange={(e) => handleDescriptionChange(e, false)}
                className="w-full h-32 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                placeholder="Describe your responsibilities and achievements with bullet points (one per line)"
                disabled={isLoading || isGeneratingDescription}
              />
              <p className="text-xs text-gray-500 mt-2">Use a new line for each bullet point</p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="newIncludeInResume"
                checked={newExperience.includeInResume !== false}
                onChange={(e) => setNewExperience({...newExperience, includeInResume: e.target.checked})}
                className="h-4 w-4 rounded border-2 border-gray-300 text-green-600 focus:ring-green-500 bg-white"
                disabled={isLoading}
              />
              <label htmlFor="newIncludeInResume" className="ml-3 block text-sm font-semibold text-gray-700">
                Include in Resume
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={cancelAdding}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
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
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Work Experience Yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Start building your professional story by adding your work experience. This helps showcase your career journey to potential employers.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all font-semibold shadow-sm hover:shadow-md"
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
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <PenSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      Edit Experience
                    </h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Position
                          </label>
                          <input
                            type="text"
                            value={editExperience.position}
                            onChange={(e) => setEditExperience({...editExperience, position: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Company
                          </label>
                          <input
                            type="text"
                            value={editExperience.company}
                            onChange={(e) => setEditExperience({...editExperience, company: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={editExperience.location}
                          onChange={(e) => setEditExperience({...editExperience, location: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                          placeholder="e.g., New York, NY (or Remote)"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Start Date
                          </label>
                          <input
                            type="month"
                            value={editExperience.startDate}
                            onChange={(e) => setEditExperience({...editExperience, startDate: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            End Date <span className="text-gray-500 font-normal">(leave empty if current)</span>
                          </label>
                          <input
                            type="month"
                            value={editExperience.endDate}
                            onChange={(e) => setEditExperience({...editExperience, endDate: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Description
                          </label>
                          <button
                            onClick={() => generateAIDescription(true)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-xs shadow-sm disabled:opacity-50"
                            disabled={isLoading || isGeneratingDescription || !editExperience.position || !editExperience.company}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {isGeneratingDescription ? 'Generating...' : 'AI Generate'}
                          </button>
                        </div>
                        <textarea
                          value={editExperience.description}
                          onChange={(e) => handleDescriptionChange(e, true)}
                          className="w-full h-32 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                          placeholder="Describe your responsibilities and achievements with bullet points (one per line)"
                          disabled={isLoading || isGeneratingDescription}
                        />
                        <p className="text-xs text-gray-500 mt-2">Use a new line for each bullet point</p>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="editIncludeInResume"
                          checked={editExperience.includeInResume !== false}
                          onChange={(e) => setEditExperience({...editExperience, includeInResume: e.target.checked})}
                          className="h-4 w-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500 bg-white"
                          disabled={isLoading}
                        />
                        <label htmlFor="editIncludeInResume" className="ml-3 block text-sm font-semibold text-gray-700">
                          Include in Resume
                        </label>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={cancelEditing}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm"
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdate}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
                          disabled={isLoading || !editExperience.company || !editExperience.position}
                        >
                          <Save className="h-4 w-4" />
                          {isLoading ? 'Saving...' : 'Update Experience'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md group ${
                    experience.includeInResume === false ? 'border-gray-300 opacity-75' : 'border-gray-200 hover:border-green-300'
                  }`}>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="relative">
                            <div className="bg-gradient-to-br from-green-100 to-blue-100 p-3 rounded-xl">
                              <Briefcase className="h-6 w-6 text-green-600" />
                            </div>
                            {experience.includeInResume !== false && (
                              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{experience.position}</h3>
                            <p className="text-lg text-gray-700 font-medium mb-2">{experience.company}</p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
                              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleMoveExperience(index, 'down')}
                              disabled={index === sortedExperiences.length - 1 || isLoading}
                              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                  ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                  : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
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
                              className="p-2 rounded-lg text-gray-400 bg-gray-50 hover:text-blue-600 hover:bg-blue-50 transition-all"
                              disabled={isLoading}
                            >
                              <PenSquare className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(experience.id)}
                              className="p-2 rounded-lg text-gray-400 bg-gray-50 hover:text-red-600 hover:bg-red-50 transition-all"
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {experience.description && (
                        <div className="border-t border-gray-100 pt-4">
                          <div className="space-y-2">
                            {experience.description.split('\n').map((line, i) => (
                              line.trim() ? (
                                <div key={i} className="flex items-start text-gray-700">
                                  <span className="mr-3 mt-1 text-green-500 font-bold">•</span>
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