'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/app/components/ui/button";
import { PenSquare, Plus, Code, Save, X, Trash2, Layers, Edit, ExternalLink, Github, Sparkles, FolderKanban, Calendar, ChevronUp, ChevronDown } from "lucide-react";
import { generateDescription, GenerationPrompt } from '@/app/services/groqService';

interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string;
  startDate: string;
  endDate: string;
  projectUrl?: string;
  githubUrl?: string;
  includeInResume?: boolean;
  order?: number;
}

interface ProjectsSectionProps {
  projects: Project[];
  onAdd: (project: Omit<Project, 'id'>) => Promise<void>;
  onUpdate: (project: Project) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder?: (projects: Project[]) => Promise<void>;
}

export default function ProjectsSection({ 
  projects, 
  onAdd, 
  onUpdate, 
  onDelete,
  onReorder 
}: ProjectsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState<Omit<Project, 'id'>>({
    title: '',
    description: '',
    technologies: '',
    startDate: '',
    endDate: '',
    projectUrl: '',
    githubUrl: '',
    includeInResume: true
  });

  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>, isEditing: boolean) => {
    const element = e.target;
    adjustTextareaHeight(element);
    
    if (isEditing && editingProject) {
      setEditingProject({...editingProject, description: e.target.value});
    } else {
      setNewProject({...newProject, description: e.target.value});
    }
  };

  // Effect to adjust textarea height when editing starts
  useEffect(() => {
    if (editingProject) {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        adjustTextareaHeight(textarea);
      }
    }
  }, [editingProject]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name !== 'description') {
      setNewProject({
        ...newProject,
        [name]: value
      });
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingProject) return;
    
    const { name, value } = e.target;
    if (name !== 'description') {
      setEditingProject({
        ...editingProject,
        [name]: value
      });
    }
  };

  const handleAdd = async () => {
    if (!newProject.title.trim() || !newProject.description.trim()) return;
    
    setIsLoading(true);
    try {
      await onAdd(newProject);
      setIsAdding(false);
      setNewProject({
        title: '',
        description: '',
        technologies: '',
        startDate: '',
        endDate: '',
        projectUrl: '',
        githubUrl: '',
        includeInResume: true
      });
    } catch (error) {
      console.error('Failed to add project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    if (!editingProject || !editingProject.title.trim() || !editingProject.description.trim()) return;
    
    setIsLoading(true);
    try {
      await onUpdate(editingProject);
      setIsEditing(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Failed to update project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    setIsLoading(true);
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setNewProject({
      title: '',
      description: '',
      technologies: '',
      startDate: '',
      endDate: '',
      projectUrl: '',
      githubUrl: '',
      includeInResume: true
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingProject(null);
  };

  const handleToggleIncludeInResume = async (project: Project) => {
    setIsLoading(true);
    try {
      const updatedProject = { 
        ...project, 
        includeInResume: !project.includeInResume 
      };
      await onUpdate(updatedProject);
    } catch (error) {
      console.error('Failed to update project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIDescription = async (isEditing: boolean) => {
    const project = isEditing ? editingProject : newProject;
    if (!project?.title || !project?.technologies) {
      alert("Please fill in at least the Project Title and Technologies fields first");
      return;
    }

    let mode: 'replace' | 'enhance' = 'replace';
    
    // If there's an existing description, give the option to enhance instead of replace
    if (project.description && project.description.trim() !== '') {
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
        type: 'project',
        title: project.title,
        technologies: project.technologies,
        additionalContext: project.startDate ? 
          `Project timeframe: ${project.startDate} to ${project.endDate || 'present'}` : '',
        mode,
        // Only include current description if enhancing
        ...(mode === 'enhance' && { currentDescription: project.description })
      };
      
      // Call the Groq API service
      const generatedDescription = await generateDescription(prompt);
      
      if (isEditing && editingProject) {
        setEditingProject({
          ...editingProject,
          description: generatedDescription
        });
      } else {
        setNewProject({
          ...newProject,
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

  // Helper function to format dates in a consistent way
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

  // Sort projects by order if available
  const sortedProjects = [...projects].sort((a, b) => {
    if (typeof a.order === 'number' && typeof b.order === 'number') {
      return a.order - b.order;
    }
    return 0;
  });

  const handleMoveProject = async (currentIndex: number, direction: 'up' | 'down') => {
    if (!onReorder) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedProjects.length) return;

    const items = Array.from(sortedProjects);
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
      console.error('Failed to reorder projects:', error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <FolderKanban className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Projects</h2>
            <p className="text-xs sm:text-sm text-gray-400">Showcase your work</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          disabled={isAdding || isEditing || isLoading}
          className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-xs sm:text-sm shadow-sm disabled:opacity-50 w-full sm:w-auto"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Add Project</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Add Project Form */}
      {isAdding && (
        <div className="rounded-2xl shadow-2xl border border-white/10 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400" />
            </div>
            Add New Project
          </h3>
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                  Project Title*
                </label>
                <input
                  type="text"
                  name="title"
                  value={newProject.title}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500 text-sm sm:text-base"
                  placeholder="e.g., E-commerce Website, Task Management App"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2">
                <label className="block text-xs sm:text-sm font-semibold text-gray-300">
                  Description*
                </label>
                <button
                  onClick={() => generateAIDescription(false)}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-xs shadow-sm disabled:opacity-50 w-full sm:w-auto"
                  disabled={isLoading || isGeneratingDescription || !newProject.title || !newProject.technologies}
                >
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">{isGeneratingDescription ? 'Generating...' : 'AI Generate'}</span>
                  <span className="sm:hidden">{isGeneratingDescription ? 'Generating' : 'AI'}</span>
                </button>
              </div>
              <textarea
                name="description"
                value={newProject.description}
                onChange={(e) => handleDescriptionChange(e, false)}
                className="w-full h-32 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500 resize-none text-sm sm:text-base"
                placeholder="Describe your project with bullet points (one per line) - what you built, key features, technologies used, and impact"
                disabled={isLoading || isGeneratingDescription}
              />
              <p className="text-xs text-gray-400 mt-2">Use a new line for each bullet point</p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                Technologies Used*
              </label>
              <input
                type="text"
                name="technologies"
                value={newProject.technologies}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500 text-sm sm:text-base"
                placeholder="e.g., React, Node.js, MongoDB, TypeScript"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="month"
                  name="startDate"
                  value={newProject.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white text-sm sm:text-base"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                  End Date <span className="text-gray-400 font-normal text-xs sm:text-sm">(leave empty if ongoing)</span>
                </label>
                <input
                  type="month"
                  name="endDate"
                  value={newProject.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white text-sm sm:text-base"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                  Project URL <span className="text-gray-400 font-normal text-xs sm:text-sm">(optional)</span>
                </label>
                <input
                  type="url"
                  name="projectUrl"
                  value={newProject.projectUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500 text-sm sm:text-base"
                  placeholder="https://yourproject.com"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                  GitHub URL <span className="text-gray-400 font-normal text-xs sm:text-sm">(optional)</span>
                </label>
                <input
                  type="url"
                  name="githubUrl"
                  value={newProject.githubUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500 text-sm sm:text-base"
                  placeholder="https://github.com/username/repo"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="newIncludeInResume"
                checked={newProject.includeInResume !== false}
                onChange={(e) => setNewProject({...newProject, includeInResume: e.target.checked})}
                className="h-4 w-4 rounded border-2 border-white/20 text-purple-400 focus:ring-purple-500 bg-white/5 backdrop-blur-xl flex-shrink-0"
                disabled={isLoading}
              />
              <label htmlFor="newIncludeInResume" className="ml-3 block text-xs sm:text-sm font-semibold text-gray-300">
                Include in Resume
              </label>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-white/10">
              <button
                onClick={cancelAdding}
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-xl text-gray-300 rounded-lg hover:bg-white/30 transition-all font-medium text-xs sm:text-sm w-full sm:w-auto"
                disabled={isLoading}
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-xs sm:text-sm shadow-sm disabled:opacity-50 w-full sm:w-auto"
                disabled={isLoading || !newProject.title.trim() || !newProject.description.trim() || !newProject.technologies.trim()}
              >
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{isLoading ? 'Saving...' : 'Save Project'}</span>
                <span className="sm:hidden">{isLoading ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-6">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Projects Added Yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Showcase your work by adding your personal projects, open-source contributions, or professional work. This helps demonstrate your technical skills and creativity.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all font-semibold "
            >
              <FolderKanban className="h-5 w-5" />
              Add Your First Project
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedProjects.map((project, index) => (
              <div
                key={project.id}
                className={`${project.includeInResume === false ? 'opacity-60' : ''}`}
              >
                {editingProject && editingProject.id === project.id ? (
                  <div className="rounded-2xl shadow-2xl border border-white/10 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <PenSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400" />
                      </div>
                      Edit Project
                    </h3>
                    <div className="space-y-4 sm:space-y-6">
                      <div className="md:col-span-2">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                          Project Title*
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={editingProject.title}
                          onChange={handleEditInputChange}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500 text-sm sm:text-base"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2">
                          <label className="block text-xs sm:text-sm font-semibold text-gray-300">
                            Description*
                          </label>
                          <button
                            onClick={() => generateAIDescription(true)}
                            className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-xs shadow-sm disabled:opacity-50 w-full sm:w-auto"
                            disabled={isLoading || isGeneratingDescription || !editingProject.title || !editingProject.technologies}
                          >
                            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            <span className="hidden sm:inline">{isGeneratingDescription ? 'Generating...' : 'AI Generate'}</span>
                            <span className="sm:hidden">{isGeneratingDescription ? 'Generating' : 'AI'}</span>
                          </button>
                        </div>
                        <textarea
                          name="description"
                          value={editingProject.description}
                          onChange={(e) => handleDescriptionChange(e, true)}
                          className="w-full h-32 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500 resize-none text-sm sm:text-base"
                          placeholder="Describe your project with bullet points (one per line)"
                          disabled={isLoading || isGeneratingDescription}
                        />
                        <p className="text-xs text-gray-400 mt-2">Use a new line for each bullet point</p>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                          Technologies Used*
                        </label>
                        <input
                          type="text"
                          name="technologies"
                          value={editingProject.technologies}
                          onChange={handleEditInputChange}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500 text-sm sm:text-base"
                          placeholder="e.g., React, Node.js, MongoDB"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                            Start Date
                          </label>
                          <input
                            type="month"
                            name="startDate"
                            value={editingProject.startDate}
                            onChange={handleEditInputChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white text-sm sm:text-base"
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                            End Date <span className="text-gray-400 font-normal text-xs sm:text-sm">(leave empty if ongoing)</span>
                          </label>
                          <input
                            type="month"
                            name="endDate"
                            value={editingProject.endDate}
                            onChange={handleEditInputChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white text-sm sm:text-base"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                            Project URL <span className="text-gray-400 font-normal text-xs sm:text-sm">(optional)</span>
                          </label>
                          <input
                            type="url"
                            name="projectUrl"
                            value={editingProject.projectUrl}
                            onChange={handleEditInputChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500 text-sm sm:text-base"
                            placeholder="https://yourproject.com"
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                            GitHub URL <span className="text-gray-400 font-normal text-xs sm:text-sm">(optional)</span>
                          </label>
                          <input
                            type="url"
                            name="githubUrl"
                            value={editingProject.githubUrl}
                            onChange={handleEditInputChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder-gray-500 text-sm sm:text-base"
                            placeholder="https://github.com/username/repo"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="includeProjectInResume"
                          checked={editingProject.includeInResume !== false}
                          onChange={(e) => setEditingProject({...editingProject, includeInResume: e.target.checked})}
                          className="h-4 w-4 rounded border-2 border-white/20 text-purple-400 focus:ring-purple-500 bg-white/5 backdrop-blur-xl flex-shrink-0"
                          disabled={isLoading}
                        />
                        <label htmlFor="includeProjectInResume" className="ml-3 block text-xs sm:text-sm font-semibold text-gray-300">
                          Include in Resume
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-white/10">
                        <button
                          onClick={cancelEditing}
                          className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-xl text-gray-300 rounded-lg hover:bg-white/30 transition-all font-medium text-xs sm:text-sm w-full sm:w-auto"
                          disabled={isLoading}
                        >
                          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdate}
                          className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-xs sm:text-sm shadow-sm disabled:opacity-50 w-full sm:w-auto"
                          disabled={isLoading || !editingProject.title || !editingProject.description || !editingProject.technologies}
                        >
                          <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">{isLoading ? 'Saving...' : 'Update Project'}</span>
                          <span className="sm:hidden">{isLoading ? 'Saving...' : 'Update'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`rounded-2xl shadow-2xl border transition-all duration-200 hover:shadow-2xl group ${
                    project.includeInResume === false ? 'border-white/20 opacity-75' : 'border-white/10 hover:border-purple-400/50'
                  }`}>
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 mb-4">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                          {/* Icon with reorder buttons below on mobile */}
                          <div className="relative flex-shrink-0 flex flex-col items-center gap-1.5 sm:gap-0">
                            <div className="relative">
                              <div className="bg-gradient-to-br from-purple-500/20 to-cyan-500/20 p-2 sm:p-3 rounded-xl">
                                <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                              </div>
                              {project.includeInResume !== false && (
                                <div className="absolute -top-1 -right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-green-500 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                            {/* Reorder buttons - below icon on mobile only */}
                            <div className="flex flex-row gap-1 sm:hidden opacity-100 transition-opacity">
                              <button
                                onClick={() => handleMoveProject(index, 'up')}
                                disabled={index === 0 || isLoading}
                                className="p-1.5 rounded-md text-gray-400 hover:text-gray-400 hover:bg-white/10 backdrop-blur-xl disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveProject(index, 'down')}
                                disabled={index === sortedProjects.length - 1 || isLoading}
                                className="p-1.5 rounded-md text-gray-400 hover:text-gray-400 hover:bg-white/10 backdrop-blur-xl disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-white mb-1 break-words">{project.title}</h3>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400 mb-3">
                              {project.startDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span className="break-words">
                                    {formatDate(project.startDate)}
                                    {' - '}
                                    {project.endDate ? formatDate(project.endDate) : 'Present'}
                                  </span>
                                </span>
                              )}

                              {project.githubUrl && (
                                <a
                                  href={project.githubUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                  <Github className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  GitHub
                                </a>
                              )}

                              {project.projectUrl && (
                                <a
                                  href={project.projectUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  View Project
                                </a>
                              )}
                            </div>

                            <div className="mb-4">
                              <p className="text-gray-300 text-xs sm:text-sm font-medium mb-2">Technologies:</p>
                              <div className="flex flex-wrap gap-2">
                                {project.technologies.split(',').map((tech, index) => (
                                  <span
                                    key={index}
                                    className="bg-purple-500/10 text-purple-400 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium border border-purple-400/30"
                                  >
                                    {tech.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Desktop: Reorder buttons - between content and action buttons */}
                        <div className="hidden sm:flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-4">
                          <button
                            onClick={() => handleMoveProject(index, 'up')}
                            disabled={index === 0 || isLoading}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-400 hover:bg-white/10 backdrop-blur-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleMoveProject(index, 'down')}
                            disabled={index === sortedProjects.length - 1 || isLoading}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-400 hover:bg-white/10 backdrop-blur-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Action buttons - right side on all screens */}
                        <div className="flex items-center gap-1 self-start sm:self-auto ml-auto sm:ml-0">
                          <button
                            onClick={() => handleToggleIncludeInResume(project)}
                            className={`p-2 sm:p-2 rounded-lg transition-all ${
                              project.includeInResume !== false
                                ? 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'
                                : 'text-gray-400 bg-white/5 backdrop-blur-xl hover:bg-white/20'
                            }`}
                            disabled={isLoading}
                            title={project.includeInResume !== false ? "Included in Resume" : "Not in Resume"}
                          >
                            <svg className="h-4 w-4 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(project)}
                            className="p-2 sm:p-2 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                            disabled={isLoading}
                          >
                            <PenSquare className="h-4 w-4 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="p-2 sm:p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      {project.description && (
                        <div className="border-t border-white/10 pt-4">
                          <div className="space-y-2">
                            {project.description.split('\n').map((line, i) => (
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