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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-200">Skills</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleGenerateSkills}
            disabled={isAdding || isLoading || !!editingSkill || isGeneratingSkills}
            className="text-blue-400 border-blue-600/30 hover:bg-blue-900/20"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isGeneratingSkills ? 'Generating...' : 'Generate Skills with AI'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={isAdding || isLoading || !!editingSkill || isGeneratingSkills}
            className="text-gray-300 border-gray-700 hover:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Skill
          </Button>
        </div>
      </div>

      {/* Add Skill Form */}
      {isAdding && (
        <div className="bg-gray-800/70 rounded-lg p-6 border border-gray-700 mb-6">
          <h3 className="text-lg font-medium text-white mb-4">
            {generatedSkills.length > 0 ? 'Select Skills to Add' : 'Add New Skill'}
          </h3>
          
          {/* AI Generated Skills */}
          {generatedSkills.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">
                  Select the skills you want to add to your profile:
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const allSelected = Object.values(selectedSkills).every(Boolean);
                      const newSelection: {[key: string]: boolean} = {};
                      generatedSkills.forEach((_, index) => {
                        newSelection[index] = !allSelected;
                      });
                      setSelectedSkills(newSelection);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {Object.values(selectedSkills).every(Boolean) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto border border-gray-700 rounded-lg p-2">
                {generatedSkills.map((skill, index) => (
                  <div key={index} className="flex items-center py-2 border-b border-gray-700 last:border-b-0">
                    <input
                      type="checkbox"
                      id={`skill-${index}`}
                      checked={selectedSkills[index] || false}
                      onChange={() => toggleSkillSelection(index)}
                      className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                    />
                    <label htmlFor={`skill-${index}`} className="ml-2 flex-1">
                      <span className="text-white font-medium">{skill.name}</span>
                      <span className="text-gray-400 text-sm ml-2">({skill.domain})</span>
                    </label>
                  </div>
                ))}
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
                  onClick={addSelectedSkills}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading || Object.values(selectedSkills).filter(Boolean).length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading 
                    ? (savingProgress || 'Adding...') 
                    : `Add Selected Skills (${Object.values(selectedSkills).filter(Boolean).length})`}
                </Button>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* Skills List */}
      <div className="space-y-6 mt-6">
        {skills.length === 0 ? (
          <div className="text-center w-full py-8 text-gray-400">
            No skills added yet. Click the "Add Skill" button to add your skills or use "Generate Skills with AI" to automatically create skills based on your profile.
          </div>
        ) : (
          sortedDomains.map((domain, domainIndex) => (
            <div key={domain} className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveDomain(domainIndex, 'up')}
                    disabled={domainIndex === 0 || isLoading}
                    className="p-1 hover:bg-gray-700/50"
                  >
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveDomain(domainIndex, 'down')}
                    disabled={domainIndex === sortedDomains.length - 1 || isLoading}
                    className="p-1 hover:bg-gray-700/50"
                  >
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
                <h3 className="text-lg font-semibold text-blue-400 flex items-center">
                  <Layers className="h-5 w-5 mr-2" />
                  {domain}
                </h3>
              </div>
              <div className="flex flex-wrap gap-3 pl-7">
                {groupedSkills[domain].map((skill) => (
                  <div 
                    key={skill.id} 
                  >
                    {editingSkill && editingSkill.id === skill.id ? (
                      // Edit form in place for this skill
                      <div className="bg-gray-800/70 px-4 py-3 rounded-lg border border-blue-500 flex flex-col gap-2">
                        <h4 className="text-sm font-medium text-white">Edit Skill</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editingSkill.domain}
                            onChange={(e) => setEditingSkill({...editingSkill, domain: e.target.value})}
                            className="px-2 py-1 bg-gray-700/70 border border-gray-600 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                            placeholder="Domain"
                            disabled={isLoading}
                          />
                          <input
                            type="text"
                            value={editingSkill.name}
                            onChange={(e) => setEditingSkill({...editingSkill, name: e.target.value})}
                            className="px-2 py-1 bg-gray-700/70 border border-gray-600 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                            placeholder="Skill"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`includeSkill-${skill.id}`}
                            checked={editingSkill.includeInResume !== false}
                            onChange={(e) => setEditingSkill({...editingSkill, includeInResume: e.target.checked})}
                            className="h-3 w-3 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                            disabled={isLoading}
                          />
                          <label htmlFor={`includeSkill-${skill.id}`} className="ml-2 block text-xs text-gray-300">
                            Include in Resume
                          </label>
                        </div>
                        <div className="flex justify-end gap-2 mt-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={cancelEditing}
                            className="h-7 px-2 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
                            disabled={isLoading}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={handleUpdate}
                            className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                            disabled={isLoading || !editingSkill.name.trim() || !editingSkill.domain.trim()}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            {isLoading ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Normal skill display
                      <div 
                        className={`bg-gray-800/70 text-gray-200 px-4 py-2 rounded-full flex items-center gap-2 border border-gray-700 hover:border-blue-500 transition-colors group ${skill.includeInResume === false ? 'opacity-60' : ''}`}
                      >
                        <Code className="h-4 w-4 text-blue-400" />
                        <span>{skill.name}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onUpdate && (
                            <>
                              <button
                                onClick={() => handleToggleIncludeInResume(skill)}
                                className={`p-1 rounded-full ${skill.includeInResume !== false ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-gray-300'} hover:bg-gray-700/50`}
                                disabled={isLoading}
                                title={skill.includeInResume !== false ? "Included in Resume" : "Not in Resume"}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleEdit(skill)}
                                className="p-1 rounded-full text-gray-400 hover:text-blue-400 hover:bg-gray-700/50"
                                disabled={isLoading}
                              >
                                <PenSquare className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(skill.id)}
                            className="p-1 rounded-full text-gray-400 hover:text-red-400 hover:bg-gray-700/50"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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