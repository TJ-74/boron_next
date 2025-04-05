'use client';

import { useState } from 'react';
import { Button } from "@/app/components/ui/button";
import { PenSquare, Plus, Award, Save, X, Trash2, Link as LinkIcon, Calendar, Check } from "lucide-react";

interface Certificate {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialUrl?: string;
  includeInResume?: boolean;
}

interface CertificatesSectionProps {
  certificates: Certificate[];
  onAdd: (certificate: Omit<Certificate, 'id'>) => Promise<void>;
  onUpdate: (certificate: Certificate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CertificatesSection({ 
  certificates, 
  onAdd, 
  onUpdate, 
  onDelete 
}: CertificatesSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [newCertificate, setNewCertificate] = useState<Omit<Certificate, 'id'>>({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialUrl: '',
    includeInResume: true
  });
  
  const [editCertificate, setEditCertificate] = useState<Certificate | null>(null);

  const handleAdd = async () => {
    setIsLoading(true);
    try {
      await onAdd(newCertificate);
      setIsAdding(false);
      setNewCertificate({
        name: '',
        issuer: '',
        issueDate: '',
        expiryDate: '',
        credentialUrl: '',
        includeInResume: true
      });
    } catch (error) {
      console.error('Failed to add certificate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editCertificate) return;
    
    setIsLoading(true);
    try {
      await onUpdate(editCertificate);
      setEditingId(null);
      setEditCertificate(null);
    } catch (error) {
      console.error('Failed to update certificate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certificate?')) return;
    
    setIsLoading(true);
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Failed to delete certificate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (certificate: Certificate) => {
    setEditingId(certificate.id);
    setEditCertificate({ ...certificate });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditCertificate(null);
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setNewCertificate({
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      credentialUrl: '',
      includeInResume: true
    });
  };

  const handleToggleIncludeInResume = async (certificate: Certificate) => {
    setIsLoading(true);
    try {
      const updatedCertificate = { 
        ...certificate, 
        includeInResume: !certificate.includeInResume 
      };
      await onUpdate(updatedCertificate);
    } catch (error) {
      console.error('Failed to update certificate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      // Format dates from YYYY-MM to MMM YYYY
      const [year, month] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } catch (e) {
      return dateString; // Return as is if format is not YYYY-MM
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-200">Certifications</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsAdding(true)}
          disabled={isAdding || isLoading}
          className="text-gray-300 border-gray-700 hover:bg-gray-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Certificate
        </Button>
      </div>

      {/* Add Certificate Form */}
      {isAdding && (
        <div className="bg-gray-800/70 rounded-lg p-6 border border-gray-700 mb-6">
          <h3 className="text-lg font-medium text-white mb-4">Add New Certificate</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Certificate Name
              </label>
              <input
                type="text"
                value={newCertificate.name}
                onChange={(e) => setNewCertificate({...newCertificate, name: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="AWS Certified Solutions Architect"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Issuing Organization
              </label>
              <input
                type="text"
                value={newCertificate.issuer}
                onChange={(e) => setNewCertificate({...newCertificate, issuer: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="Amazon Web Services"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Issue Date
                </label>
                <input
                  type="month"
                  value={newCertificate.issueDate}
                  onChange={(e) => setNewCertificate({...newCertificate, issueDate: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="month"
                  value={newCertificate.expiryDate}
                  onChange={(e) => setNewCertificate({...newCertificate, expiryDate: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Credential URL (Optional)
              </label>
              <input
                type="url"
                value={newCertificate.credentialUrl}
                onChange={(e) => setNewCertificate({...newCertificate, credentialUrl: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                placeholder="https://www.credly.com/badges/..."
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeInResume"
                checked={newCertificate.includeInResume}
                onChange={(e) => setNewCertificate({...newCertificate, includeInResume: e.target.checked})}
                className="h-4 w-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                disabled={isLoading}
              />
              <label htmlFor="includeInResume" className="text-sm font-medium text-gray-300">
                Include in Resume
              </label>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelAdding}
                disabled={isLoading}
                className="text-gray-300 border-gray-700 hover:bg-gray-800"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleAdd}
                disabled={!newCertificate.name || !newCertificate.issuer || !newCertificate.issueDate || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">◌</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List of Certificates */}
      <div className="space-y-4">
        {certificates.length === 0 && !isAdding && (
          <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-dashed border-gray-700">
            <Award className="h-12 w-12 mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400">No certifications added yet.</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAdding(true)}
              className="mt-4 text-blue-400 border-blue-900 hover:bg-blue-900/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Certificate
            </Button>
          </div>
        )}

        {certificates.map(certificate => (
          <div 
            key={certificate.id} 
            className={`bg-gray-800/50 rounded-lg p-5 border ${certificate.includeInResume ? 'border-gray-700' : 'border-gray-700/50'} transition-all duration-200 ${!certificate.includeInResume ? 'opacity-70' : ''}`}
          >
            {editingId === certificate.id ? (
              // Edit mode
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Certificate Name
                  </label>
                  <input
                    type="text"
                    value={editCertificate?.name}
                    onChange={(e) => setEditCertificate(prev => prev ? {...prev, name: e.target.value} : null)}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Issuing Organization
                  </label>
                  <input
                    type="text"
                    value={editCertificate?.issuer}
                    onChange={(e) => setEditCertificate(prev => prev ? {...prev, issuer: e.target.value} : null)}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Issue Date
                    </label>
                    <input
                      type="month"
                      value={editCertificate?.issueDate}
                      onChange={(e) => setEditCertificate(prev => prev ? {...prev, issueDate: e.target.value} : null)}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="month"
                      value={editCertificate?.expiryDate}
                      onChange={(e) => setEditCertificate(prev => prev ? {...prev, expiryDate: e.target.value} : null)}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Credential URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={editCertificate?.credentialUrl}
                    onChange={(e) => setEditCertificate(prev => prev ? {...prev, credentialUrl: e.target.value} : null)}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`includeInResume-${certificate.id}`}
                    checked={editCertificate?.includeInResume}
                    onChange={(e) => setEditCertificate(prev => prev ? {...prev, includeInResume: e.target.checked} : null)}
                    className="h-4 w-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                    disabled={isLoading}
                  />
                  <label htmlFor={`includeInResume-${certificate.id}`} className="text-sm font-medium text-gray-300">
                    Include in Resume
                  </label>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelEditing}
                    disabled={isLoading}
                    className="text-gray-300 border-gray-700 hover:bg-gray-800"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleUpdate}
                    disabled={!editCertificate?.name || !editCertificate?.issuer || !editCertificate?.issueDate || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin mr-2">◌</span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              // View mode
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Award className="h-5 w-5 mr-2 text-blue-400" />
                    {certificate.name}
                    {certificate.credentialUrl && (
                      <a 
                        href={certificate.credentialUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </a>
                    )}
                  </h3>
                  <div className="mt-2 md:mt-0 text-sm text-gray-400">
                    {formatDate(certificate.issueDate)}
                    {certificate.expiryDate && ` - ${formatDate(certificate.expiryDate)}`}
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  Issued by {certificate.issuer}
                </p>
                
                <div className="flex flex-col md:flex-row justify-between mt-4">
                  <div className="flex items-center space-x-2 mb-2 md:mb-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleIncludeInResume(certificate)}
                      disabled={isLoading}
                      className={`text-xs ${certificate.includeInResume ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-gray-300'}`}
                    >
                      {certificate.includeInResume ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Included in Resume
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Not in Resume
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(certificate)}
                      disabled={isLoading}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                    >
                      <PenSquare className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(certificate.id)}
                      disabled={isLoading}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 