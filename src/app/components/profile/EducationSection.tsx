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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Education</h2>
            <p className="text-sm text-gray-400">Academic achievements</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          disabled={isAdding || isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-sm disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Education
        </button>
      </div>

      {/* Add Education Form */}
      {isAdding && (
        <div className="rounded-2xl shadow-2xl border border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Plus className="h-4 w-4 text-purple-400" />
            </div>
            Add New Education
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Degree
                </label>
                <input
                  type="text"
                  value={newEducation.degree}
                  onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                  placeholder="Bachelor of Science in Computer Science"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  School
                </label>
                <input
                  type="text"
                  value={newEducation.school}
                  onChange={(e) => setNewEducation({...newEducation, school: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                  placeholder="University of Technology"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="month"
                  value={newEducation.startDate}
                  onChange={(e) => setNewEducation({...newEducation, startDate: e.target.value})}
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
                  value={newEducation.endDate}
                  onChange={(e) => setNewEducation({...newEducation, endDate: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                CGPA/GPA <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={newEducation.cgpa}
                onChange={(e) => setNewEducation({...newEducation, cgpa: e.target.value})}
                className="w-full max-w-xs px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                placeholder="3.8/4.0"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="newIncludeInResume"
                checked={newEducation.includeInResume !== false}
                onChange={(e) => setNewEducation({...newEducation, includeInResume: e.target.checked})}
                className="h-4 w-4 rounded border-2 border-white/20 text-purple-400 focus:ring-purple-500 "
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
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
                disabled={isLoading || !newEducation.school || !newEducation.degree}
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Education'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Education List */}
      <div className="space-y-6">
        {educations.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Education Added Yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Showcase your academic achievements and qualifications. This helps demonstrate your educational background to potential employers.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all font-semibold "
            >
              <GraduationCap className="h-5 w-5" />
              Add Your Education
            </button>
          </div>
        ) : (
          educations.map((edu) => (
            <div
              key={edu.id}
              className={`${edu.includeInResume === false ? 'opacity-60' : ''}`}
            >
              {editingId === edu.id && editEducation ? (
                <div className="rounded-2xl shadow-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <PenSquare className="h-4 w-4 text-purple-400" />
                    </div>
                    Edit Education
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Degree
                        </label>
                        <input
                          type="text"
                          value={editEducation.degree}
                          onChange={(e) => setEditEducation({...editEducation, degree: e.target.value})}
                          className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          School
                        </label>
                        <input
                          type="text"
                          value={editEducation.school}
                          onChange={(e) => setEditEducation({...editEducation, school: e.target.value})}
                          className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Start Date
                        </label>
                        <input
                          type="month"
                          value={editEducation.startDate}
                          onChange={(e) => setEditEducation({...editEducation, startDate: e.target.value})}
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
                          value={editEducation.endDate}
                          onChange={(e) => setEditEducation({...editEducation, endDate: e.target.value})}
                          className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        CGPA/GPA <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={editEducation.cgpa}
                        onChange={(e) => setEditEducation({...editEducation, cgpa: e.target.value})}
                        className="w-full max-w-xs px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="editIncludeInResume"
                        checked={editEducation.includeInResume !== false}
                        onChange={(e) => setEditEducation({...editEducation, includeInResume: e.target.checked})}
                        className="h-4 w-4 rounded border-2 border-white/20 text-purple-400 focus:ring-purple-500 "
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
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
                        disabled={isLoading || !editEducation.school || !editEducation.degree}
                      >
                        <Save className="h-4 w-4" />
                        {isLoading ? 'Saving...' : 'Update Education'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`rounded-2xl shadow-2xl border transition-all duration-200 hover:shadow-2xl group ${
                  edu.includeInResume === false ? 'border-white/20 opacity-75' : 'border-white/10 hover:border-purple-300'
                }`}>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="relative">
                          <div className="bg-gradient-to-br from-purple-500/20 to-cyan-500/20 p-3 rounded-xl">
                            <GraduationCap className="h-6 w-6 text-purple-400" />
                          </div>
                          {edu.includeInResume !== false && (
                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-white mb-1">{edu.degree}</h3>
                          <p className="text-lg text-gray-300 font-medium mb-2">{edu.school}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h6a2 2 0 012 2v4m-6 4v10m-4-4h8" />
                              </svg>
                              {formatDateRange(edu.startDate, edu.endDate)}
                            </span>
                            {edu.cgpa && (
                              <span className="flex items-center gap-1">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                CGPA: {edu.cgpa}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleToggleIncludeInResume(edu)}
                          className={`p-2 rounded-lg transition-all ${
                            edu.includeInResume !== false
                              ? 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'
                              : 'text-gray-400 bg-white/5 backdrop-blur-xl hover:bg-white/20'
                          }`}
                          disabled={isLoading}
                          title={edu.includeInResume !== false ? "Included in Resume" : "Not in Resume"}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => startEditing(edu)}
                          className="p-2 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                          disabled={isLoading}
                        >
                          <PenSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(edu.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
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