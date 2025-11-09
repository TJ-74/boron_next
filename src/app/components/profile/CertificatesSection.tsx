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
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center">
            <Award className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Certifications & Credentials</h2>
            <p className="text-sm text-gray-500">Showcase your professional achievements</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          disabled={isAdding || isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Certificate
        </button>
      </div>

      {/* Add Certificate Form */}
      {isAdding && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <Plus className="h-4 w-4 text-amber-600" />
            </div>
            Add New Certificate
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Certificate Name
                </label>
                <input
                  type="text"
                  value={newCertificate.name}
                  onChange={(e) => setNewCertificate({...newCertificate, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="AWS Certified Solutions Architect"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Issuing Organization
                </label>
                <input
                  type="text"
                  value={newCertificate.issuer}
                  onChange={(e) => setNewCertificate({...newCertificate, issuer: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Amazon Web Services"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Issue Date
                </label>
                <input
                  type="month"
                  value={newCertificate.issueDate}
                  onChange={(e) => setNewCertificate({...newCertificate, issueDate: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-gray-900"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expiry Date (Optional)
                </label>
                <input
                  type="month"
                  value={newCertificate.expiryDate}
                  onChange={(e) => setNewCertificate({...newCertificate, expiryDate: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-gray-900"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Credential URL (Optional)
              </label>
              <input
                type="url"
                value={newCertificate.credentialUrl}
                onChange={(e) => setNewCertificate({...newCertificate, credentialUrl: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="https://www.credly.com/badges/..."
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="includeInResume"
                checked={newCertificate.includeInResume}
                onChange={(e) => setNewCertificate({...newCertificate, includeInResume: e.target.checked})}
                className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 bg-white"
                disabled={isLoading}
              />
              <label htmlFor="includeInResume" className="text-sm font-semibold text-gray-700">
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
                disabled={!newCertificate.name || !newCertificate.issuer || !newCertificate.issueDate || isLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Certificate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List of Certificates */}
      <div className="space-y-4">
        {certificates.length === 0 && !isAdding && (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Certifications Added Yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Showcase your professional achievements and credentials. Add certifications to highlight your expertise and qualifications.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all font-semibold shadow-sm hover:shadow-md"
            >
              <Plus className="h-5 w-5" />
              Add Your First Certificate
            </button>
          </div>
        )}

        {certificates.map(certificate => (
          <div
            key={certificate.id}
            className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md group ${
              certificate.includeInResume ? 'border-gray-200' : 'border-gray-300 opacity-75'
            }`}
          >
            {editingId === certificate.id ? (
              // Edit mode
              <div className="p-6">
                <h4 className="text-sm font-bold text-gray-900 mb-4">Edit Certificate</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Certificate Name
                      </label>
                      <input
                        type="text"
                        value={editCertificate?.name}
                        onChange={(e) => setEditCertificate(prev => prev ? {...prev, name: e.target.value} : null)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-gray-900 text-sm"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Issuing Organization
                      </label>
                      <input
                        type="text"
                        value={editCertificate?.issuer}
                        onChange={(e) => setEditCertificate(prev => prev ? {...prev, issuer: e.target.value} : null)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-gray-900 text-sm"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Issue Date
                      </label>
                      <input
                        type="month"
                        value={editCertificate?.issueDate}
                        onChange={(e) => setEditCertificate(prev => prev ? {...prev, issueDate: e.target.value} : null)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-gray-900 text-sm"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Expiry Date (Optional)
                      </label>
                      <input
                        type="month"
                        value={editCertificate?.expiryDate}
                        onChange={(e) => setEditCertificate(prev => prev ? {...prev, expiryDate: e.target.value} : null)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-gray-900 text-sm"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Credential URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={editCertificate?.credentialUrl}
                      onChange={(e) => setEditCertificate(prev => prev ? {...prev, credentialUrl: e.target.value} : null)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-gray-900 text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`includeInResume-${certificate.id}`}
                      checked={editCertificate?.includeInResume}
                      onChange={(e) => setEditCertificate(prev => prev ? {...prev, includeInResume: e.target.checked} : null)}
                      className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 bg-white"
                      disabled={isLoading}
                    />
                    <label htmlFor={`includeInResume-${certificate.id}`} className="text-sm font-semibold text-gray-700">
                      Include in Resume
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={cancelEditing}
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium text-xs"
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={!editCertificate?.name || !editCertificate?.issuer || !editCertificate?.issueDate || isLoading}
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all font-medium text-xs shadow-sm disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin h-3 w-3 mr-1 border border-white border-t-transparent rounded-full"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-3 w-3" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // View mode
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-3 rounded-xl">
                        <Award className="h-6 w-6 text-amber-600" />
                      </div>
                      {certificate.includeInResume && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {certificate.name}
                        </h3>
                        {certificate.credentialUrl && (
                          <a
                            href={certificate.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-all"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </a>
                        )}
                      </div>

                      <p className="text-gray-600 font-medium mb-2">
                        Issued by {certificate.issuer}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(certificate.issueDate)}</span>
                        </div>
                        {certificate.expiryDate && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>Expires {formatDate(certificate.expiryDate)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleToggleIncludeInResume(certificate)}
                      className={`p-2 rounded-lg transition-all ${
                        certificate.includeInResume
                          ? 'text-green-600 bg-green-50 hover:bg-green-100'
                          : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                      }`}
                      disabled={isLoading}
                      title={certificate.includeInResume ? "Included in Resume" : "Not in Resume"}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => startEditing(certificate)}
                      className="p-2 rounded-lg text-gray-400 bg-gray-50 hover:text-amber-600 hover:bg-amber-50 transition-all"
                      disabled={isLoading}
                    >
                      <PenSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(certificate.id)}
                      className="p-2 rounded-lg text-gray-400 bg-gray-50 hover:text-red-600 hover:bg-red-50 transition-all"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 