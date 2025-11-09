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
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Education</h2>
            <p className="text-sm text-gray-500">Academic achievements</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          disabled={isAdding || isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Education
        </button>
      </div>

      {/* Add Education Form */}
      {isAdding && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <Plus className="h-4 w-4 text-purple-600" />
            </div>
            Add New Education
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Degree
                </label>
                <input
                  type="text"
                  value={newEducation.degree}
                  onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Bachelor of Science in Computer Science"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  School
                </label>
                <input
                  type="text"
                  value={newEducation.school}
                  onChange={(e) => setNewEducation({...newEducation, school: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="University of Technology"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="month"
                  value={newEducation.startDate}
                  onChange={(e) => setNewEducation({...newEducation, startDate: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date <span className="text-gray-500 font-normal">(leave empty for current)</span>
                </label>
                <input
                  type="month"
                  value={newEducation.endDate}
                  onChange={(e) => setNewEducation({...newEducation, endDate: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CGPA/GPA <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={newEducation.cgpa}
                onChange={(e) => setNewEducation({...newEducation, cgpa: e.target.value})}
                className="w-full max-w-xs px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
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
                className="h-4 w-4 rounded border-2 border-gray-300 text-purple-600 focus:ring-purple-500 bg-white"
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
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
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
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Education Added Yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Showcase your academic achievements and qualifications. This helps demonstrate your educational background to potential employers.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-sm hover:shadow-md"
            >
              <GraduationCap className="h-5 w-5" />
              Add Your Education
            </button>
          </div>
        ) : (
          educations.map((edu) => (
            <div key={edu.id}>
              {editingId === edu.id && editEducation ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <PenSquare className="h-4 w-4 text-purple-600" />
                    </div>
                    Edit Education
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Degree
                        </label>
                        <input
                          type="text"
                          value={editEducation.degree}
                          onChange={(e) => setEditEducation({...editEducation, degree: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          School
                        </label>
                        <input
                          type="text"
                          value={editEducation.school}
                          onChange={(e) => setEditEducation({...editEducation, school: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="month"
                          value={editEducation.startDate}
                          onChange={(e) => setEditEducation({...editEducation, startDate: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          End Date <span className="text-gray-500 font-normal">(leave empty if current)</span>
                        </label>
                        <input
                          type="month"
                          value={editEducation.endDate}
                          onChange={(e) => setEditEducation({...editEducation, endDate: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CGPA/GPA <span className="text-gray-500 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={editEducation.cgpa}
                        onChange={(e) => setEditEducation({...editEducation, cgpa: e.target.value})}
                        className="w-full max-w-xs px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="editIncludeInResume"
                        checked={editEducation.includeInResume !== false}
                        onChange={(e) => setEditEducation({...editEducation, includeInResume: e.target.checked})}
                        className="h-4 w-4 rounded border-2 border-gray-300 text-purple-600 focus:ring-purple-500 bg-white"
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
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
                        disabled={isLoading || !editEducation.school || !editEducation.degree}
                      >
                        <Save className="h-4 w-4" />
                        {isLoading ? 'Saving...' : 'Update Education'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md group ${
                  edu.includeInResume === false ? 'border-gray-300 opacity-75' : 'border-gray-200 hover:border-purple-300'
                }`}>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="relative">
                          <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-3 rounded-xl">
                            <GraduationCap className="h-6 w-6 text-purple-600" />
                          </div>
                          {edu.includeInResume !== false && (
                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{edu.degree}</h3>
                          <p className="text-lg text-gray-700 font-medium mb-2">{edu.school}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
                              ? 'text-green-600 bg-green-50 hover:bg-green-100'
                              : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
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
                          className="p-2 rounded-lg text-gray-400 bg-gray-50 hover:text-purple-600 hover:bg-purple-50 transition-all"
                          disabled={isLoading}
                        >
                          <PenSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(edu.id)}
                          className="p-2 rounded-lg text-gray-400 bg-gray-50 hover:text-red-600 hover:bg-red-50 transition-all"
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