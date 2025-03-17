'use client';

import { useState } from 'react';
import { Button } from "@/app/components/ui/button";
import { PenSquare, Plus, Briefcase, Save, X, Trash2 } from "lucide-react";

interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  includeInResume?: boolean;
}

interface ExperienceSectionProps {
  experiences: Experience[];
  onAdd: (experience: Omit<Experience, 'id'>) => Promise<void>;
  onUpdate: (experience: Experience) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function ExperienceSection({ 
  experiences, 
  onAdd, 
  onUpdate, 
  onDelete 
}: ExperienceSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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
    return `${startDate} - ${endDate || 'Present'}`;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-200">Experience</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsAdding(true)}
          disabled={isAdding || isLoading}
          className="text-gray-300 border-gray-700 hover:bg-gray-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Experience
        </Button>
      </div>

      {/* Add Experience Form */}
      {isAdding && (
        <div className="bg-gray-800/70 rounded-lg p-6 border border-gray-700 mb-6">
          <h3 className="text-lg font-medium text-white mb-4">Add New Experience</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Position
              </label>
              <input
                type="text"
                value={newExperience.position}
                onChange={(e) => setNewExperience({...newExperience, position: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="Senior Software Engineer"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Company
              </label>
              <input
                type="text"
                value={newExperience.company}
                onChange={(e) => setNewExperience({...newExperience, company: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="Tech Corp"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={newExperience.location}
                onChange={(e) => setNewExperience({...newExperience, location: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="New York, NY"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Start Date (MM/YYYY)
                </label>
                <input
                  type="text"
                  value={newExperience.startDate}
                  onChange={(e) => setNewExperience({...newExperience, startDate: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                  placeholder="01/2022"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  End Date (MM/YYYY or leave empty for present)
                </label>
                <input
                  type="text"
                  value={newExperience.endDate}
                  onChange={(e) => setNewExperience({...newExperience, endDate: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                  placeholder="Present"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={newExperience.description}
                onChange={(e) => setNewExperience({...newExperience, description: e.target.value})}
                className="w-full h-24 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="Describe your responsibilities and achievements..."
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="newIncludeInResume"
                checked={newExperience.includeInResume !== false}
                onChange={(e) => setNewExperience({...newExperience, includeInResume: e.target.checked})}
                className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                disabled={isLoading}
              />
              <label htmlFor="newIncludeInResume" className="ml-2 block text-sm text-gray-300">
                Include in Resume
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={cancelAdding}
                className="text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleAdd}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || !newExperience.company || !newExperience.position}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Experience List */}
      <div className="space-y-8 mt-6">
        {experiences.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No experience added yet. Click the "Add Experience" button to add your work history.
          </div>
        ) : (
          <>
            {/* Edit Form */}
            {editingId && editExperience && (
              <div className="bg-gray-800/70 rounded-lg p-6 border border-gray-700 mb-6">
                <h3 className="text-lg font-medium text-white mb-4">Edit Experience</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      value={editExperience.position}
                      onChange={(e) => setEditExperience({...editExperience, position: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={editExperience.company}
                      onChange={(e) => setEditExperience({...editExperience, company: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editExperience.location}
                      onChange={(e) => setEditExperience({...editExperience, location: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Start Date (MM/YYYY)
                      </label>
                      <input
                        type="text"
                        value={editExperience.startDate}
                        onChange={(e) => setEditExperience({...editExperience, startDate: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        End Date (MM/YYYY or leave empty for present)
                      </label>
                      <input
                        type="text"
                        value={editExperience.endDate}
                        onChange={(e) => setEditExperience({...editExperience, endDate: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editExperience.description}
                      onChange={(e) => setEditExperience({...editExperience, description: e.target.value})}
                      className="w-full h-24 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="editIncludeInResume"
                      checked={editExperience.includeInResume !== false}
                      onChange={(e) => setEditExperience({...editExperience, includeInResume: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                      disabled={isLoading}
                    />
                    <label htmlFor="editIncludeInResume" className="ml-2 block text-sm text-gray-300">
                      Include in Resume
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={cancelEditing}
                      className="text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleUpdate}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={isLoading || !editExperience.company || !editExperience.position}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Experience Cards */}
            {experiences.map((experience) => (
              <div 
                key={experience.id} 
                className={`${editingId === experience.id ? 'hidden' : 'block'} ${experience.includeInResume === false ? 'opacity-60' : ''}`}
              >
                <div className="bg-gray-800/70 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-500/20 p-3 rounded-lg">
                        <Briefcase className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{experience.position}</h3>
                        <p className="text-gray-300">{experience.company}</p>
                        <p className="text-gray-400 text-sm mt-1">{experience.location}</p>
                        <p className="text-gray-400 text-sm">{formatDateRange(experience.startDate, experience.endDate)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleIncludeInResume(experience)}
                        className={`p-2 rounded-full ${experience.includeInResume !== false ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-gray-300'} hover:bg-gray-700/50`}
                        disabled={isLoading}
                        title={experience.includeInResume !== false ? "Included in Resume" : "Not in Resume"}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => startEditing(experience)}
                        className="p-2 rounded-full text-gray-400 hover:text-blue-400 hover:bg-gray-700/50"
                        disabled={isLoading}
                      >
                        <PenSquare className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(experience.id)}
                        className="p-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-gray-700/50"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-gray-300 whitespace-pre-line">
                    {experience.description}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}