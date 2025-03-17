'use client';

import { useState } from 'react';
import { Button } from "@/app/components/ui/button";
import { PenSquare, Plus, Code, Save, X, Trash2, Layers, Edit } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  domain: string;
  includeInResume?: boolean;
}

interface SkillsSectionProps {
  skills: Skill[];
  onAdd: (skill: Omit<Skill, 'id'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate?: (skill: Skill) => Promise<void>;
}

export default function SkillsSection({ 
  skills, 
  onAdd, 
  onDelete,
  onUpdate 
}: SkillsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  const handleAdd = async () => {
    if (!newSkill.trim() || !newDomain.trim()) return;
    
    setIsLoading(true);
    try {
      await onAdd({ 
        name: newSkill.trim(),
        domain: newDomain.trim(),
        includeInResume: true // Default to true for new skills
      });
      setIsAdding(false);
      setNewSkill('');
      setNewDomain('');
    } catch (error) {
      console.error('Failed to add skill:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    
    setIsLoading(true);
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Failed to delete skill:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
  };

  const handleUpdate = async () => {
    if (!editingSkill || !editingSkill.name.trim() || !editingSkill.domain.trim()) return;
    
    setIsLoading(true);
    try {
      if (onUpdate) {
        await onUpdate(editingSkill);
      }
      setEditingSkill(null);
    } catch (error) {
      console.error('Failed to update skill:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleIncludeInResume = async (skill: Skill) => {
    if (!onUpdate) return;
    
    setIsLoading(true);
    try {
      const updatedSkill = { 
        ...skill, 
        includeInResume: !skill.includeInResume 
      };
      await onUpdate(updatedSkill);
    } catch (error) {
      console.error('Failed to update skill:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setNewSkill('');
    setNewDomain('');
  };

  const cancelEditing = () => {
    setEditingSkill(null);
  };

  // Group skills by domain
  const groupedSkills = skills.reduce((acc, skill) => {
    const domain = skill.domain || 'Other';
    if (!acc[domain]) {
      acc[domain] = [];
    }
    acc[domain].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-200">Skills</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsAdding(true)}
          disabled={isAdding || isLoading || !!editingSkill}
          className="text-gray-300 border-gray-700 hover:bg-gray-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Skill
        </Button>
      </div>

      {/* Add Skill Form */}
      {isAdding && (
        <div className="bg-gray-800/70 rounded-lg p-6 border border-gray-700 mb-6">
          <h3 className="text-lg font-medium text-white mb-4">Add New Skill</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Domain
              </label>
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="e.g., Web Development, Data Science"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Skill Name
              </label>
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="e.g., JavaScript, Python"
                disabled={isLoading}
              />
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
                disabled={isLoading || !newSkill.trim() || !newDomain.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Skill Form */}
      {editingSkill && (
        <div className="bg-gray-800/70 rounded-lg p-6 border border-gray-700 mb-6">
          <h3 className="text-lg font-medium text-white mb-4">Edit Skill</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Domain
              </label>
              <input
                type="text"
                value={editingSkill.domain}
                onChange={(e) => setEditingSkill({...editingSkill, domain: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="e.g., Web Development, Data Science"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Skill Name
              </label>
              <input
                type="text"
                value={editingSkill.name}
                onChange={(e) => setEditingSkill({...editingSkill, name: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="e.g., JavaScript, Python"
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeInResume"
                checked={editingSkill.includeInResume !== false}
                onChange={(e) => setEditingSkill({...editingSkill, includeInResume: e.target.checked})}
                className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                disabled={isLoading}
              />
              <label htmlFor="includeInResume" className="ml-2 block text-sm text-gray-300">
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
                disabled={isLoading || !editingSkill.name.trim() || !editingSkill.domain.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Skills List */}
      <div className="space-y-6 mt-6">
        {skills.length === 0 ? (
          <div className="text-center w-full py-8 text-gray-400">
            No skills added yet. Click the "Add Skill" button to add your skills.
          </div>
        ) : (
          Object.entries(groupedSkills).map(([domain, domainSkills]) => (
            <div key={domain} className="space-y-3">
              <h3 className="text-lg font-semibold text-blue-400 flex items-center">
                <Layers className="h-5 w-5 mr-2" />
                {domain}
              </h3>
              <div className="flex flex-wrap gap-3 pl-7">
                {domainSkills.map((skill) => (
                  <div 
                    key={skill.id} 
                    className={`bg-gray-800/70 text-gray-200 px-4 py-2 rounded-full flex items-center gap-2 border border-gray-700 hover:border-blue-500 transition-colors group ${skill.includeInResume === false ? 'opacity-60' : ''}`}
                  >
                    <Code className="h-4 w-4 text-blue-400" />
                    <span>{skill.name}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onUpdate && (
                        <>
                          <button
                            onClick={() => handleEdit(skill)}
                            className="text-gray-400 hover:text-blue-400"
                            disabled={isLoading}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleIncludeInResume(skill)}
                            className={`${skill.includeInResume !== false ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-gray-300'}`}
                            disabled={isLoading}
                            title={skill.includeInResume !== false ? "Included in Resume" : "Not in Resume"}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(skill.id)}
                        className="text-gray-400 hover:text-red-400"
                        disabled={isLoading}
                        title="Delete"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}