'use client';

import { useState } from 'react';
import { Button } from "@/app/components/ui/button";
import { PenSquare, Plus, Code, Save, X, Trash2, Layers, Edit, Sparkles, CheckCircle, ChevronUp, ChevronDown } from "lucide-react";
import { generateSkills, SkillsGenerationPrompt } from '@/app/services/skillsService';

interface Skill {
  id: string;
  name: string;
  domain: string;
  includeInResume?: boolean;
  order?: number;
}

interface SkillsSectionProps {
  skills: Skill[];
  onAdd: (skill: Omit<Skill, 'id'>, isBatchOperation?: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate?: (skill: Skill) => Promise<void>;
  onReorder?: (skills: Skill[]) => Promise<void>;
  experiences?: Array<{
    position: string;
    company: string;
    description?: string;
  }>;
  projects?: Array<{
    title: string;
    technologies: string;
    description?: string;
  }>;
  onAddBatch?: (skills: Array<Omit<Skill, 'id'>>) => Promise<void>;
}

export default function SkillsSection({ 
  skills, 
  onAdd, 
  onDelete,
  onUpdate,
  onReorder,
  experiences = [],
  projects = [],
  onAddBatch
}: SkillsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false);
  const [generatedSkills, setGeneratedSkills] = useState<Array<{name: string, domain: string}>>([]);
  const [selectedSkills, setSelectedSkills] = useState<{[key: string]: boolean}>({});
  const [savingProgress, setSavingProgress] = useState<string>('');

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
    setGeneratedSkills([]);
    setSelectedSkills({});
  };

  const cancelEditing = () => {
    setEditingSkill(null);
  };

  const toggleSkillSelection = (index: number) => {
    setSelectedSkills(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const addSelectedSkills = async () => {
    const skillsToAdd = generatedSkills.filter((_, index) => selectedSkills[index]);
    
    if (skillsToAdd.length === 0) {
      alert('Please select at least one skill to add.');
      return;
    }
    
    setIsLoading(true);
    try {
      // If we have a batch add function provided by parent, use it
      if (onAddBatch && skillsToAdd.length > 1) {
        await onAddBatch(skillsToAdd.map(skill => ({
          name: skill.name,
          domain: skill.domain,
          includeInResume: true
        })));
      } else {
        // Otherwise add skills one by one
        for (let i = 0; i < skillsToAdd.length; i++) {
          const skill = skillsToAdd[i];
          setSavingProgress(`Adding ${i+1}/${skillsToAdd.length}: ${skill.name}`);
          console.log(`Adding skill ${i+1}/${skillsToAdd.length}: ${skill.name} (${skill.domain})`);
          
          // If not the last skill, pass isBatchOperation flag
          const isLastSkill = i === skillsToAdd.length - 1;
          
          // Wait for each skill to be added
          await onAdd({
            name: skill.name,
            domain: skill.domain,
            includeInResume: true
          }, !isLastSkill); // Defer DB save for all except the last one
          
          // Small delay between operations to ensure state updates properly
          if (i < skillsToAdd.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }
      
      // Clear selection
      setGeneratedSkills([]);
      setSelectedSkills({});
      setSavingProgress('');
      
      // Close the adding form
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add skills:', error);
      alert(`Error adding skills: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSavingProgress('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSkills = async () => {
    setIsGeneratingSkills(true);
    try {
      // Determine mode based on existing skills
      const mode = skills.length > 0 ? 'suggest' : 'add';
      
      // Prepare the prompt
      const prompt: SkillsGenerationPrompt = {
        experiences,
        projects,
        currentSkills: skills.map(s => ({ name: s.name, domain: s.domain })),
        mode
      };
      
      // Call the skills generation service
      const generatedSkillsList = await generateSkills(prompt);
      
      // Filter out skills that already exist in the user's profile
      const existingSkillNames = new Set(skills.map(s => s.name.toLowerCase()));
      const filteredSkills = generatedSkillsList.filter(
        s => !existingSkillNames.has(s.name.toLowerCase())
      );
      
      // Update state with generated skills
      setGeneratedSkills(filteredSkills);
      
      // Initialize all skills as selected
      const initialSelection: {[key: string]: boolean} = {};
      filteredSkills.forEach((_, index) => {
        initialSelection[index] = true;
      });
      setSelectedSkills(initialSelection);
      
      // Open the adding form if not already open
      setIsAdding(true);
    } catch (error) {
      console.error('Failed to generate skills:', error);
      alert('Failed to generate skills. Please try again.');
    } finally {
      setIsGeneratingSkills(false);
    }
  };

  // Sort skills by order within each domain
  const groupedSkills = skills.reduce((acc, skill) => {
    const domain = skill.domain || 'Other';
    if (!acc[domain]) {
      acc[domain] = [];
    }
    acc[domain].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  // Sort domains by order of their first skill
  const sortedDomains = Object.keys(groupedSkills).sort((a, b) => {
    const firstSkillA = groupedSkills[a][0];
    const firstSkillB = groupedSkills[b][0];
    if (typeof firstSkillA?.order === 'number' && typeof firstSkillB?.order === 'number') {
      return firstSkillA.order - firstSkillB.order;
    }
    return 0;
  });

  const handleMoveDomain = async (currentIndex: number, direction: 'up' | 'down') => {
    if (!onReorder) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedDomains.length) return;

    // Get all domains and their skills
    const domains = [...sortedDomains];
    const allSkills = [...skills];

    // Get the domains we're swapping
    const currentDomain = domains[currentIndex];
    const targetDomain = domains[newIndex];

    // Calculate base order numbers for each position
    const orderStep = 10; // Leave space between orders for future insertions
    const getBaseOrder = (index: number) => index * orderStep;

    // Swap the domains
    domains[currentIndex] = targetDomain;
    domains[newIndex] = currentDomain;

    // Update order numbers for all skills based on their domain's new position
    const updatedSkills = allSkills.map(skill => {
      const domainIndex = domains.indexOf(skill.domain);
      const skillsInDomain = groupedSkills[skill.domain];
      const skillIndexInDomain = skillsInDomain.findIndex(s => s.id === skill.id);
      
      return {
        ...skill,
        order: getBaseOrder(domainIndex) + skillIndexInDomain
      };
    });

    try {
      await onReorder(updatedSkills);
    } catch (error) {
      console.error('Failed to reorder domains:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center">
            <Code className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Skills & Technologies</h2>
            <p className="text-sm text-gray-400">Showcase your technical expertise</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGenerateSkills}
            disabled={isAdding || isLoading || !!editingSkill || isGeneratingSkills}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {isGeneratingSkills ? 'Generating...' : 'AI Generate'}
          </button>
          <button
            onClick={() => setIsAdding(true)}
            disabled={isAdding || isLoading || !!editingSkill || isGeneratingSkills}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Skill
          </button>
        </div>
      </div>

      {/* Add Skill Form */}
      {isAdding && (
        <div className="rounded-2xl shadow-2xl border border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
              <Plus className="h-4 w-4 text-purple-400" />
            </div>
            {generatedSkills.length > 0 ? 'Select Skills to Add' : 'Add New Skill'}
          </h3>

          {/* AI Generated Skills */}
          {generatedSkills.length > 0 ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300 font-medium">
                  Select the skills you want to add to your profile:
                </span>
                <button
                  onClick={() => {
                    const allSelected = Object.values(selectedSkills).every(Boolean);
                    const newSelection: {[key: string]: boolean} = {};
                    generatedSkills.forEach((_, index) => {
                      newSelection[index] = !allSelected;
                    });
                    setSelectedSkills(newSelection);
                  }}
                  className="text-sm text-purple-400 hover:text-violet-700 font-medium"
                >
                  {Object.values(selectedSkills).every(Boolean) ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto border border-white/10 rounded-xl p-4 bg-white/5 backdrop-blur-xl">
                {generatedSkills.map((skill, index) => (
                  <div key={index} className="flex items-center py-3 border-b border-white/10 last:border-b-0">
                    <input
                      type="checkbox"
                      id={`skill-${index}`}
                      checked={selectedSkills[index] || false}
                      onChange={() => toggleSkillSelection(index)}
                      className="h-4 w-4 rounded border-white/20 text-purple-400 focus:ring-purple-500 bg-white/5 backdrop-blur-xl"
                    />
                    <label htmlFor={`skill-${index}`} className="ml-3 flex-1 flex items-center justify-between">
                      <span className="text-white font-medium">{skill.name}</span>
                      <span className="text-gray-400 text-sm bg-white/10 backdrop-blur-xl px-2 py-1 rounded-lg">{skill.domain}</span>
                    </label>
                  </div>
                ))}
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
                  onClick={addSelectedSkills}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
                  disabled={isLoading || Object.values(selectedSkills).filter(Boolean).length === 0}
                >
                  <Save className="h-4 w-4" />
                  {isLoading
                    ? (savingProgress || 'Adding...')
                    : `Add Selected Skills (${Object.values(selectedSkills).filter(Boolean).length})`}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                    placeholder="e.g., Web Development, Data Science"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Skill Name
                  </label>
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500"
                    placeholder="e.g., JavaScript, Python"
                    disabled={isLoading}
                  />
                </div>
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
                  disabled={isLoading || !newSkill.trim() || !newDomain.trim()}
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save Skill'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Skills List */}
      <div className="space-y-6">
        {skills.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
              <Code className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Skills Added Yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Showcase your technical skills and expertise. Add skills manually or use AI to generate them based on your experience and projects.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all font-semibold"
              >
                <Plus className="h-5 w-5" />
                Add Skill
              </button>
              <button
                onClick={handleGenerateSkills}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all font-semibold "
              >
                <Sparkles className="h-5 w-5" />
                AI Generate
              </button>
            </div>
          </div>
        ) : (
          sortedDomains.map((domain, domainIndex) => (
            <div key={domain} className="rounded-2xl shadow-2xl border border-white/10 p-6 group hover:shadow-2xl transition-all duration-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Layers className="h-4 w-4 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{domain}</h3>
                </div>

                {/* Domain reorder buttons */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleMoveDomain(domainIndex, 'up')}
                    disabled={domainIndex === 0 || isLoading}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-400 hover:bg-white/10 backdrop-blur-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDomain(domainIndex, 'down')}
                    disabled={domainIndex === sortedDomains.length - 1 || isLoading}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-400 hover:bg-white/10 backdrop-blur-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupedSkills[domain].map((skill) => (
                  <div key={skill.id}>
                    {editingSkill && editingSkill.id === skill.id ? (
                      // Edit form in place for this skill
                      <div className="rounded-xl border-2 border-purple-400/50 p-4 shadow-2xl">
                        <h4 className="text-sm font-bold text-white mb-3">Edit Skill</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">Domain</label>
                            <input
                              type="text"
                              value={editingSkill.domain}
                              onChange={(e) => setEditingSkill({...editingSkill, domain: e.target.value})}
                              className="w-full px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white text-sm"
                              disabled={isLoading}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">Skill</label>
                            <input
                              type="text"
                              value={editingSkill.name}
                              onChange={(e) => setEditingSkill({...editingSkill, name: e.target.value})}
                              className="w-full px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white text-sm"
                              disabled={isLoading}
                            />
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`includeSkill-${skill.id}`}
                              checked={editingSkill.includeInResume !== false}
                              onChange={(e) => setEditingSkill({...editingSkill, includeInResume: e.target.checked})}
                              className="h-4 w-4 rounded border-white/20 text-purple-400 focus:ring-purple-500 bg-white/5 backdrop-blur-xl"
                              disabled={isLoading}
                            />
                            <label htmlFor={`includeSkill-${skill.id}`} className="ml-2 block text-sm font-semibold text-gray-300">
                              Include in Resume
                            </label>
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                            <button
                              onClick={cancelEditing}
                              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white/10 backdrop-blur-xl text-gray-300 rounded-lg hover:bg-white/30 transition-all font-medium text-xs"
                              disabled={isLoading}
                            >
                              <X className="h-3 w-3" />
                              Cancel
                            </button>
                            <button
                              onClick={handleUpdate}
                              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-xs shadow-sm disabled:opacity-50"
                              disabled={isLoading || !editingSkill.name.trim() || !editingSkill.domain.trim()}
                            >
                              <Save className="h-3 w-3" />
                              {isLoading ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Normal skill display
                      <div
                        className={`border rounded-xl p-4 transition-all duration-200 hover:shadow-2xl shadow-2xl group cursor-pointer ${
                          skill.includeInResume === false
                            ? 'border-white/20 opacity-75'
                            : 'border-white/10 hover:border-purple-400/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="bg-gradient-to-br from-purple-500/20 to-cyan-500/20 p-2 rounded-lg">
                                <Code className="h-4 w-4 text-purple-400" />
                              </div>
                              {skill.includeInResume !== false && (
                                <div className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-white"></div>
                              )}
                            </div>
                            <span className="font-semibold text-white">{skill.name}</span>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onUpdate && (
                              <>
                                <button
                                  onClick={() => handleToggleIncludeInResume(skill)}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    skill.includeInResume !== false
                                      ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                      : 'text-gray-400 hover:bg-white/20'
                                  }`}
                                  disabled={isLoading}
                                  title={skill.includeInResume !== false ? "Included in Resume" : "Not in Resume"}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleEdit(skill)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-violet-50 transition-all"
                                  disabled={isLoading}
                                >
                                  <PenSquare className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDelete(skill.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                              disabled={isLoading}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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