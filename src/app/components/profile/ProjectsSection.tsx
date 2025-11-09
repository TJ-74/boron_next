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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center">
            <FolderKanban className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Projects</h2>
            <p className="text-sm text-gray-500">Showcase your work</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          disabled={isAdding || isEditing || isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Project
        </button>
      </div>

      {/* Add Project Form */}
      {isAdding && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
              <Plus className="h-4 w-4 text-emerald-600" />
            </div>
            Add New Project
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Title*
                </label>
                <input
                  type="text"
                  name="title"
                  value={newProject.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="e.g., E-commerce Website, Task Management App"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Description*
                </label>
                <button
                  onClick={() => generateAIDescription(false)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-xs shadow-sm disabled:opacity-50"
                  disabled={isLoading || isGeneratingDescription || !newProject.title || !newProject.technologies}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isGeneratingDescription ? 'Generating...' : 'AI Generate'}
                </button>
              </div>
              <textarea
                name="description"
                value={newProject.description}
                onChange={(e) => handleDescriptionChange(e, false)}
                className="w-full h-32 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                placeholder="Describe your project with bullet points (one per line) - what you built, key features, technologies used, and impact"
                disabled={isLoading || isGeneratingDescription}
              />
              <p className="text-xs text-gray-500 mt-2">Use a new line for each bullet point</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Technologies Used*
              </label>
              <input
                type="text"
                name="technologies"
                value={newProject.technologies}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="e.g., React, Node.js, MongoDB, TypeScript"
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
                  name="startDate"
                  value={newProject.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date <span className="text-gray-500 font-normal">(leave empty if ongoing)</span>
                </label>
                <input
                  type="month"
                  name="endDate"
                  value={newProject.endDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project URL <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  name="projectUrl"
                  value={newProject.projectUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="https://yourproject.com"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  GitHub URL <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  name="githubUrl"
                  value={newProject.githubUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
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
                className="h-4 w-4 rounded border-2 border-gray-300 text-emerald-600 focus:ring-emerald-500 bg-white"
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
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
                disabled={isLoading || !newProject.title.trim() || !newProject.description.trim() || !newProject.technologies.trim()}
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-6">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Added Yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Showcase your work by adding your personal projects, open-source contributions, or professional work. This helps demonstrate your technical skills and creativity.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold shadow-sm hover:shadow-md"
            >
              <FolderKanban className="h-5 w-5" />
              Add Your First Project
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedProjects.map((project, index) => (
              <div key={project.id}>
                {editingProject && editingProject.id === project.id ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                        <PenSquare className="h-4 w-4 text-emerald-600" />
                      </div>
                      Edit Project
                    </h3>
                    <div className="space-y-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Project Title*
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={editingProject.title}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Description*
                          </label>
                          <button
                            onClick={() => generateAIDescription(true)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-xs shadow-sm disabled:opacity-50"
                            disabled={isLoading || isGeneratingDescription || !editingProject.title || !editingProject.technologies}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {isGeneratingDescription ? 'Generating...' : 'AI Generate'}
                          </button>
                        </div>
                        <textarea
                          name="description"
                          value={editingProject.description}
                          onChange={(e) => handleDescriptionChange(e, true)}
                          className="w-full h-32 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                          placeholder="Describe your project with bullet points (one per line)"
                          disabled={isLoading || isGeneratingDescription}
                        />
                        <p className="text-xs text-gray-500 mt-2">Use a new line for each bullet point</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Technologies Used*
                        </label>
                        <input
                          type="text"
                          name="technologies"
                          value={editingProject.technologies}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                          placeholder="e.g., React, Node.js, MongoDB"
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
                            name="startDate"
                            value={editingProject.startDate}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900"
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            End Date <span className="text-gray-500 font-normal">(leave empty if ongoing)</span>
                          </label>
                          <input
                            type="month"
                            name="endDate"
                            value={editingProject.endDate}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Project URL <span className="text-gray-500 font-normal">(optional)</span>
                          </label>
                          <input
                            type="url"
                            name="projectUrl"
                            value={editingProject.projectUrl}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                            placeholder="https://yourproject.com"
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            GitHub URL <span className="text-gray-500 font-normal">(optional)</span>
                          </label>
                          <input
                            type="url"
                            name="githubUrl"
                            value={editingProject.githubUrl}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
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
                          className="h-4 w-4 rounded border-2 border-gray-300 text-emerald-600 focus:ring-emerald-500 bg-white"
                          disabled={isLoading}
                        />
                        <label htmlFor="includeProjectInResume" className="ml-3 block text-sm font-semibold text-gray-700">
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
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
                          disabled={isLoading || !editingProject.title || !editingProject.description || !editingProject.technologies}
                        >
                          <Save className="h-4 w-4" />
                          {isLoading ? 'Saving...' : 'Update Project'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md group ${
                    project.includeInResume === false ? 'border-gray-300 opacity-75' : 'border-gray-200 hover:border-emerald-300'
                  }`}>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="relative">
                            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-3 rounded-xl">
                              <FolderKanban className="h-6 w-6 text-emerald-600" />
                            </div>
                            {project.includeInResume !== false && (
                              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{project.title}</h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                              {project.startDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(project.startDate)}
                                  {' - '}
                                  {project.endDate ? formatDate(project.endDate) : 'Present'}
                                </span>
                              )}

                              {project.githubUrl && (
                                <a
                                  href={project.githubUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 transition-colors"
                                >
                                  <Github className="h-4 w-4" />
                                  GitHub
                                </a>
                              )}

                              {project.projectUrl && (
                                <a
                                  href={project.projectUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 transition-colors"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  View Project
                                </a>
                              )}
                            </div>

                            <div className="mb-4">
                              <p className="text-gray-700 text-sm font-medium mb-2">Technologies:</p>
                              <div className="flex flex-wrap gap-2">
                                {project.technologies.split(',').map((tech, index) => (
                                  <span
                                    key={index}
                                    className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-sm font-medium border border-emerald-200"
                                  >
                                    {tech.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Reorder buttons */}
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleMoveProject(index, 'up')}
                              disabled={index === 0 || isLoading}
                              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleMoveProject(index, 'down')}
                              disabled={index === sortedProjects.length - 1 || isLoading}
                              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleToggleIncludeInResume(project)}
                              className={`p-2 rounded-lg transition-all ${
                                project.includeInResume !== false
                                  ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                  : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                              }`}
                              disabled={isLoading}
                              title={project.includeInResume !== false ? "Included in Resume" : "Not in Resume"}
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEdit(project)}
                              className="p-2 rounded-lg text-gray-400 bg-gray-50 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                              disabled={isLoading}
                            >
                              <PenSquare className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(project.id)}
                              className="p-2 rounded-lg text-gray-400 bg-gray-50 hover:text-red-600 hover:bg-red-50 transition-all"
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {project.description && (
                        <div className="border-t border-gray-100 pt-4">
                          <div className="space-y-2">
                            {project.description.split('\n').map((line, i) => (
                              line.trim() ? (
                                <div key={i} className="flex items-start text-gray-700">
                                  <span className="mr-3 mt-1 text-emerald-500 font-bold">•</span>
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