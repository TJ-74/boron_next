'use client';

import { useState } from 'react';
import { Button } from "@/app/components/ui/button";
import { PenSquare, Plus, Code, Save, X, Trash2, Layers, Edit, ExternalLink, Github, Sparkles, FolderKanban, Calendar } from "lucide-react";
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
}

interface ProjectsSectionProps {
  projects: Project[];
  onAdd: (project: Omit<Project, 'id'>) => Promise<void>;
  onUpdate: (project: Project) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function ProjectsSection({ 
  projects, 
  onAdd, 
  onUpdate, 
  onDelete 
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProject({
      ...newProject,
      [name]: value
    });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingProject) return;
    
    const { name, value } = e.target;
    setEditingProject({
      ...editingProject,
      [name]: value
    });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-200">Projects</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsAdding(true)}
          disabled={isAdding || isEditing || isLoading}
          className="text-gray-300 border-gray-700 hover:bg-gray-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      {/* Add Project Form */}
      {isAdding && (
        <div className="bg-gray-800/70 rounded-lg p-6 border border-gray-700 mb-6">
          <h3 className="text-lg font-medium text-white mb-4">Add New Project</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Project Title*
              </label>
              <input
                type="text"
                name="title"
                value={newProject.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="e.g., E-commerce Website"
                disabled={isLoading}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-300">
                  Description*
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => generateAIDescription(false)}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 text-xs"
                  disabled={isLoading || isGeneratingDescription || !newProject.title || !newProject.technologies}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {isGeneratingDescription ? 'Generating...' : 'Generate with AI'}
                </Button>
              </div>
              <textarea
                name="description"
                value={newProject.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="Describe your project with bullet points (one per line)"
                disabled={isLoading || isGeneratingDescription}
              />
              <p className="text-xs text-gray-400 mt-1">Use a new line for each bullet point</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Technologies Used*
              </label>
              <input
                type="text"
                name="technologies"
                value={newProject.technologies}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="e.g., React, Node.js, MongoDB"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={newProject.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  End Date (leave empty if ongoing)
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={newProject.endDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Project URL
                </label>
                <input
                  type="url"
                  name="projectUrl"
                  value={newProject.projectUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                  placeholder="https://example.com"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  GitHub URL
                </label>
                <input
                  type="url"
                  name="githubUrl"
                  value={newProject.githubUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
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
                disabled={isLoading || !newProject.title.trim() || !newProject.description.trim() || !newProject.technologies.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-6 mt-6">
        {projects.length === 0 ? (
          <div className="text-center w-full py-8 text-gray-400">
            No projects added yet. Click the "Add Project" button to add your projects.
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => (
              <div key={project.id}>
                {editingProject && editingProject.id === project.id ? (
                  <div className="bg-gray-800/70 rounded-lg p-6 border border-gray-700 mb-6">
                    <h3 className="text-lg font-medium text-white mb-4">Edit Project</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Project Title*
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={editingProject.title}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                          placeholder="e.g., E-commerce Website"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-300">
                            Description*
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generateAIDescription(true)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 text-xs"
                            disabled={isLoading || isGeneratingDescription || !editingProject.title || !editingProject.technologies}
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            {isGeneratingDescription ? 'Generating...' : 'Generate with AI'}
                          </Button>
                        </div>
                        <textarea
                          name="description"
                          value={editingProject.description}
                          onChange={handleEditInputChange}
                          rows={3}
                          className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                          placeholder="Describe your project with bullet points (one per line)"
                          disabled={isLoading || isGeneratingDescription}
                        />
                        <p className="text-xs text-gray-400 mt-1">Use a new line for each bullet point</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Technologies Used*
                        </label>
                        <input
                          type="text"
                          name="technologies"
                          value={editingProject.technologies}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                          placeholder="e.g., React, Node.js, MongoDB"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Start Date
                          </label>
                          <input
                            type="date"
                            name="startDate"
                            value={editingProject.startDate}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            End Date (leave empty if ongoing)
                          </label>
                          <input
                            type="date"
                            name="endDate"
                            value={editingProject.endDate}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Project URL
                          </label>
                          <input
                            type="url"
                            name="projectUrl"
                            value={editingProject.projectUrl}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                            placeholder="https://example.com"
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            GitHub URL
                          </label>
                          <input
                            type="url"
                            name="githubUrl"
                            value={editingProject.githubUrl}
                            onChange={handleEditInputChange}
                            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
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
                          className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                          disabled={isLoading}
                        />
                        <label htmlFor="includeProjectInResume" className="ml-2 block text-sm text-gray-300">
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
                          disabled={isLoading || !editingProject.title || !editingProject.description || !editingProject.technologies}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {isLoading ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`${project.includeInResume === false ? 'opacity-60' : ''}`}>
                    <div className="bg-gray-800/70 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white flex items-center">
                            <FolderKanban className="h-5 w-5 mr-2 text-blue-400" />
                            {project.title}
                          </h3>
                          
                          <div className="mt-3 space-y-1">
                            {project.description.split('\n').map((line, i) => (
                              line.trim() ? (
                                <div key={i} className="flex items-start text-gray-300">
                                  <span className="mr-2 mt-1.5 text-blue-400">•</span>
                                  <p>{line.trim()}</p>
                                </div>
                              ) : null
                            ))}
                          </div>
                          
                          <div className="mt-4">
                            <p className="text-gray-300 text-sm font-medium">Technologies:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {project.technologies.split(',').map((tech, index) => (
                                <span 
                                  key={index} 
                                  className="bg-gray-700/70 text-blue-400 px-3 py-1 rounded-full text-sm"
                                >
                                  {tech.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="mt-4 text-sm text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                            {project.startDate && (
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>
                                  {new Date(project.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                                  {' - '}
                                  {project.endDate 
                                    ? new Date(project.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                                    : 'Present'}
                                </span>
                              </div>
                            )}
                            
                            {project.githubUrl && (
                              <a 
                                href={project.githubUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 flex items-center"
                              >
                                <Github className="h-4 w-4 mr-1" />
                                GitHub
                              </a>
                            )}
                            
                            {project.projectUrl && (
                              <a 
                                href={project.projectUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-green-400 hover:text-green-300 flex items-center"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View Project
                              </a>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleToggleIncludeInResume(project)}
                            className={`p-2 rounded-full ${project.includeInResume !== false ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-gray-300'} hover:bg-gray-700/50`}
                            disabled={isLoading}
                            title={project.includeInResume !== false ? "Included in Resume" : "Not in Resume"}
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(project)}
                            className="p-2 rounded-full text-gray-400 hover:text-blue-400 hover:bg-gray-700/50"
                            disabled={isLoading}
                          >
                            <PenSquare className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="p-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-gray-700/50"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
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