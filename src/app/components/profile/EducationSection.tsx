'use client';

import { useState } from 'react';
import { Button } from "@/app/components/ui/button";
import { PenSquare, Plus, GraduationCap, Save, X, Trash2 } from "lucide-react";

interface Education {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  cgpa: string;
  includeInResume?: boolean;
}

interface EducationSectionProps {
  educations: Education[];
  onAdd: (education: Omit<Education, 'id'>) => Promise<void>;
  onUpdate: (education: Education) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function EducationSection({ 
  educations, 
  onAdd, 
  onUpdate, 
  onDelete 
}: EducationSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [newEducation, setNewEducation] = useState<Omit<Education, 'id'>>({
    school: '',
    degree: '',
    startDate: '',
    endDate: '',
    cgpa: '',
    includeInResume: true
  });
  
  const [editEducation, setEditEducation] = useState<Education | null>(null);

  const handleAdd = async () => {
    setIsLoading(true);
    try {
      await onAdd(newEducation);
      setIsAdding(false);
      setNewEducation({
        school: '',
        degree: '',
        startDate: '',
        endDate: '',
        cgpa: '',
        includeInResume: true
      });
    } catch (error) {
      console.error('Failed to add education:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editEducation) return;
    
    setIsLoading(true);
    try {
      await onUpdate(editEducation);
      setEditingId(null);
      setEditEducation(null);
    } catch (error) {
      console.error('Failed to update education:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this education?')) return;
    
    setIsLoading(true);
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Failed to delete education:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (education: Education) => {
    setEditingId(education.id);
    setEditEducation({ ...education });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditEducation(null);
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setNewEducation({
      school: '',
      degree: '',
      startDate: '',
      endDate: '',
      cgpa: '',
      includeInResume: true
    });
  };

  const handleToggleIncludeInResume = async (education: Education) => {
    setIsLoading(true);
    try {
      const updatedEducation = { 
        ...education, 
        includeInResume: !education.includeInResume 
      };
      await onUpdate(updatedEducation);
    } catch (error) {
      console.error('Failed to update education:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    return `${startDate} - ${endDate || 'Present'}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-200">Education</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsAdding(true)}
          disabled={isAdding || isLoading}
          className="text-gray-300 border-gray-700 hover:bg-gray-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Education
        </Button>
      </div>

      {/* Add Education Form */}
      {isAdding && (
        <div className="bg-gray-800/70 rounded-lg p-6 border border-gray-700 mb-6">
          <h3 className="text-lg font-medium text-white mb-4">Add New Education</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Degree
              </label>
              <input
                type="text"
                value={newEducation.degree}
                onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="Bachelor of Science in Computer Science"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                School
              </label>
              <input
                type="text"
                value={newEducation.school}
                onChange={(e) => setNewEducation({...newEducation, school: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="University of Technology"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Start Date (MM/YYYY)
                </label>
                <input
                  type="text"
                  value={newEducation.startDate}
                  onChange={(e) => setNewEducation({...newEducation, startDate: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                  placeholder="09/2018"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  End Date (MM/YYYY or leave empty for present)
                </label>
                <input
                  type="text"
                  value={newEducation.endDate}
                  onChange={(e) => setNewEducation({...newEducation, endDate: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                  placeholder="05/2022"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  CGPA
                </label>
                <input
                  type="text"
                  value={newEducation.cgpa}
                  onChange={(e) => setNewEducation({...newEducation, cgpa: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                  placeholder="3.8/4.0"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="newIncludeInResume"
                checked={newEducation.includeInResume !== false}
                onChange={(e) => setNewEducation({...newEducation, includeInResume: e.target.checked})}
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
                disabled={isLoading || !newEducation.school || !newEducation.degree}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Education List */}
      <div className="space-y-8 mt-6">
        {educations.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No education added yet. Click the "Add Education" button to add your educational background.
          </div>
        ) : (
          educations.map((edu) => (
            <div 
              key={edu.id} 
              className={`relative pl-8 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-purple-500 before:to-pink-500 ${edu.includeInResume === false ? 'opacity-60' : ''}`}
            >
              <div className="absolute left-0 top-0 w-4 h-4 -translate-x-1/2 rounded-full bg-purple-500 flex items-center justify-center">
                <GraduationCap className="h-2 w-2 text-white" />
              </div>
              
              {editingId === edu.id && editEducation ? (
                <div className="bg-gray-800/70 rounded-lg p-6 border border-gray-700">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Degree
                      </label>
                      <input
                        type="text"
                        value={editEducation.degree}
                        onChange={(e) => setEditEducation({...editEducation, degree: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        School
                      </label>
                      <input
                        type="text"
                        value={editEducation.school}
                        onChange={(e) => setEditEducation({...editEducation, school: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Start Date (MM/YYYY)
                        </label>
                        <input
                          type="text"
                          value={editEducation.startDate}
                          onChange={(e) => setEditEducation({...editEducation, startDate: e.target.value})}
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
                          value={editEducation.endDate}
                          onChange={(e) => setEditEducation({...editEducation, endDate: e.target.value})}
                          className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          CGPA
                        </label>
                        <input
                          type="text"
                          value={editEducation.cgpa}
                          onChange={(e) => setEditEducation({...editEducation, cgpa: e.target.value})}
                          className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="editIncludeInResume"
                        checked={editEducation.includeInResume !== false}
                        onChange={(e) => setEditEducation({...editEducation, includeInResume: e.target.checked})}
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
                        disabled={isLoading || !editEducation.school || !editEducation.degree}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800/50 rounded-lg p-6 group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <h3 className="text-xl font-semibold text-white">{edu.degree}</h3>
                    <span className="text-sm text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">
                      {formatDateRange(edu.startDate, edu.endDate)}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                    <p className="text-blue-400">{edu.school}</p>
                    {edu.cgpa && (
                      <span className="text-gray-400 text-sm">
                        • CGPA: {edu.cgpa}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleToggleIncludeInResume(edu)}
                      className={`${edu.includeInResume !== false ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-gray-300'} hover:bg-gray-700/50`}
                      disabled={isLoading}
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {edu.includeInResume !== false ? "In Resume" : "Not in Resume"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => startEditing(edu)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                    >
                      <PenSquare className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(edu.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 