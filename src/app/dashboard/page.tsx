"use client";

import { useState, useEffect } from "react";
import { getAllJobPostings, deleteJobPosting, updateJobPosting, markJobPostingAsCompleted, getArchivedJobPostings, JobPosting } from "../lib/jobPostingApiService";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import Navbar from "@/app/components/ui/navbar";
import { useAuth } from '../context/AuthContext';
import { getUserProfileSummary } from '../lib/userProfileService';

interface EditFormData {
  recruiterName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [editingPost, setEditingPost] = useState<JobPosting | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    recruiterName: "",
    email: "",
    phoneNumber: "",
    companyName: "",
    jobTitle: "",
    jobDescription: "",
  });
  const [editErrors, setEditErrors] = useState<Partial<EditFormData>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'my' | 'archived'>('all'); // Toggle between all posts, user's posts, and archived posts
  
  // AI Email Generation states
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedPosting, setSelectedPosting] = useState<JobPosting | null>(null);
  const [emailGeneration, setEmailGeneration] = useState({
    candidateName: '',
    emailType: 'application' as 'application' | 'follow-up' | 'thank-you' | 'inquiry' | 'withdrawal',
    tone: 'professional' as 'professional' | 'friendly' | 'casual',
    additionalContext: ''
  });
  const [generatedEmail, setGeneratedEmail] = useState<{
    subject: string;
    body: string;
    suggestedActions: string[];
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [researchStatus, setResearchStatus] = useState<{
    isResearching: boolean;
    status: string;
  }>({ isResearching: false, status: '' });
  // Add new state for research data and editable email
  const [researchData, setResearchData] = useState<{
    company: any;
    recruiter: any;
  } | null>(null);
  const [editableEmail, setEditableEmail] = useState<{
    subject: string;
    body: string;
  }>({ subject: '', body: '' });

  // Profile data state
  const [userProfile, setUserProfile] = useState<{
    name: string; 
    email: string;
    about?: string;
    title?: string;
    phone?: string;
    location?: string;
    experiences?: any[];
    education?: any[];
    skills?: any[];
    projects?: any[];
    certificates?: any[];
    linkedinUrl?: string;
  } | null>(null);
  
  // Toast notification state
  const [toast, setToast] = useState<{message: string; type: 'success' | 'info' | 'warning'} | null>(null);

  // Archive states
  const [archiveConfirm, setArchiveConfirm] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000); // Auto-hide after 4 seconds
  };

  useEffect(() => {
    if (user) {
      fetchJobPostings();
    }
  }, [user, viewMode]);

  // Fetch user profile data for auto-populating candidate name
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.uid) return;
      
      try {
        const profileData = await getUserProfileSummary(user.uid);
        if (profileData) {
          setUserProfile({
            name: profileData.name,
            email: profileData.email,
            about: profileData.about,
            title: profileData.title,
            phone: profileData.phone,
            location: profileData.location,
            experiences: profileData.experiences || [],
            education: profileData.education || [],
            skills: profileData.skills || [],
            projects: profileData.projects || [],
            certificates: profileData.certificates || [],
            linkedinUrl: profileData.linkedinUrl,
          });
        } else {
          // Fallback to Firebase auth data
          setUserProfile({
            name: user.displayName || 'Candidate',
            email: user.email || '',
            about: '',
            title: '',
            phone: '',
            location: '',
            experiences: [],
            education: [],
            skills: [],
            projects: [],
            certificates: [],
            linkedinUrl: '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Fallback to Firebase auth data
        setUserProfile({
          name: user.displayName || 'Candidate',
          email: user.email || '',
          about: '',
          title: '',
          phone: '',
          location: '',
          experiences: [],
          education: [],
          skills: [],
          projects: [],
          certificates: [],
          linkedinUrl: '',
        });
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchJobPostings = async () => {
    try {
      setLoading(true);
      let postings: JobPosting[];
      
      if (viewMode === 'archived') {
        // Fetch archived posts only
        const uid = user?.uid; // Always filter archived posts by current user
        postings = await getArchivedJobPostings(uid);
      } else {
        // Pass user ID only if viewing 'my' posts
        const uid = viewMode === 'my' ? user?.uid : undefined;
        postings = await getAllJobPostings(uid);
      }
      
      setJobPostings(postings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job postings");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (posting: JobPosting) => {
    setEditingPost(posting);
    setEditFormData({
      recruiterName: posting.recruiterName,
      email: posting.email,
      phoneNumber: posting.phoneNumber,
      companyName: posting.companyName,
      jobTitle: posting.jobTitle,
      jobDescription: posting.jobDescription,
    });
    setEditErrors({});
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (editErrors[name as keyof EditFormData]) {
      setEditErrors(prev => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateEditForm = (): boolean => {
    const newErrors: Partial<EditFormData> = {};

    if (!editFormData.recruiterName.trim()) {
      newErrors.recruiterName = "Recruiter name is required";
    }

    if (!editFormData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!editFormData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    // Phone number validation - only validate format if provided
    if (editFormData.phoneNumber.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(editFormData.phoneNumber.replace(/[\s\-\(\)]/g, ""))) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    // Job description validation - only validate length if provided
    if (editFormData.jobDescription.trim() && editFormData.jobDescription.trim().length < 50) {
      newErrors.jobDescription = "Job description must be at least 50 characters";
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!editingPost || !editingPost._id || !validateEditForm()) return;

    setIsUpdating(true);
    try {
      // Pass user ID for authorization
      await updateJobPosting(editingPost._id, editFormData, user?.uid);
      await fetchJobPostings(); // Refresh the list
      setEditingPost(null);
      setEditFormData({
        recruiterName: "",
        email: "",
        phoneNumber: "",
        companyName: "",
        jobTitle: "",
        jobDescription: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update job posting");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      // Pass user ID for authorization
      await deleteJobPosting(id, user?.uid);
      await fetchJobPostings(); // Refresh the list
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete job posting");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async (id: string) => {
    setIsArchiving(true);
    try {
      // Pass user ID for authorization
      await markJobPostingAsCompleted(id, user?.uid);
      await fetchJobPostings(); // Refresh the list
      setArchiveConfirm(null);
      showToast('Job posting marked as completed and moved to archive!', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive job posting");
    } finally {
      setIsArchiving(false);
    }
  };

  // AI Email Generation Functions
  const handleEmailGeneration = (posting: JobPosting) => {
    setSelectedPosting(posting);
    setEmailModalOpen(true);
    setGeneratedEmail(null);
    setResearchData(null);
    setEditableEmail({ subject: '', body: '' });
    setEmailGeneration({
      candidateName: userProfile?.name || user?.displayName || '',
      emailType: 'application',
      tone: 'professional',
      additionalContext: ''
    });
  };

  const generateAIEmail = async () => {
    if (!selectedPosting) return;

    setIsGenerating(true);
    setResearchStatus({ isResearching: true, status: 'Researching company and recruiter...' });
    
    try {
      const response = await fetch('/api/ai-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle: selectedPosting.jobTitle || 'Open Position',
          companyName: selectedPosting.companyName,
          recruiterName: selectedPosting.recruiterName,
          jobDescription: selectedPosting.jobDescription,
          candidateName: emailGeneration.candidateName || 'Candidate',
          emailType: emailGeneration.emailType,
          tone: emailGeneration.tone,
          additionalContext: emailGeneration.additionalContext,
          // Include complete user profile for personalized email generation
          candidateProfile: userProfile ? {
            name: userProfile.name,
            email: userProfile.email,
            about: userProfile.about,
            title: userProfile.title,
            phone: userProfile.phone,
            location: userProfile.location,
            linkedinUrl: userProfile.linkedinUrl,
            experiences: userProfile.experiences,
            education: userProfile.education,
            skills: userProfile.skills,
            projects: userProfile.projects,
            certificates: userProfile.certificates
          } : null
        }),
      });

      // Update status to show AI generation phase
      setResearchStatus({ isResearching: true, status: 'Generating personalized email with research insights...' });

      if (!response.ok) {
        throw new Error('Failed to generate email');
      }

      const emailData = await response.json();
      console.log('📧 Received email data:', emailData);
      console.log('🔍 Research data received:', emailData.researchData);
      
      setGeneratedEmail(emailData);
      setEditableEmail({
        subject: emailData.subject,
        body: emailData.body
      });
      
      // Store research data if available
      if (emailData.researchData) {
        console.log('✅ Setting research data:', emailData.researchData);
        setResearchData(emailData.researchData);
      } else {
        console.log('❌ No research data in response');
      }
      
      setResearchStatus({ isResearching: false, status: 'Complete! Email generated with live company research.' });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate email");
      setResearchStatus({ isResearching: false, status: '' });
    } finally {
      setIsGenerating(false);
      // Clear research status after a delay
      setTimeout(() => {
        setResearchStatus({ isResearching: false, status: '' });
      }, 3000);
    }
  };

  const copyEmailToClipboard = async () => {
    if (!editableEmail.subject || !editableEmail.body) return;
    
    const emailContent = `Subject: ${editableEmail.subject}\n\n${editableEmail.body}`;
    
    try {
      await navigator.clipboard.writeText(emailContent);
      showToast('Email content copied to clipboard!', 'success');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = emailContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('Email content copied to clipboard!', 'success');
    }
  };

  const openEmailClient = async () => {
    if (!editableEmail.subject || !editableEmail.body || !selectedPosting) return;
    
    const to = encodeURIComponent(selectedPosting.email);
    const subject = encodeURIComponent(editableEmail.subject);
    const body = encodeURIComponent(editableEmail.body);
    
    // Check if the mailto URL might be too long (most browsers limit ~2000 chars)
    const mailtoUrl = `mailto:${to}?subject=${subject}&body=${body}`;
    
    if (mailtoUrl.length > 2000) {
      // For long emails, copy to clipboard and open email with just recipient and subject
      try {
        await navigator.clipboard.writeText(editableEmail.body);
        
        // Open email client with just recipient and subject
        const shortMailtoUrl = `mailto:${to}?subject=${subject}`;
        window.open(shortMailtoUrl);
        
        showToast('Email body copied to clipboard! Paste it into the email that just opened.', 'info');
      } catch (error) {
        // If clipboard fails, fallback to copy button
        showToast('Email is too long for direct opening. Please use "Copy to Clipboard" button and paste manually into your email client.', 'warning');
      }
    } else {
      // For shorter emails, use the traditional mailto approach
      window.open(mailtoUrl);
    }
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "Unknown";
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
          <Navbar />
          <div className="flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Loading Dashboard</h2>
              <p className="text-gray-400 text-sm">Fetching job postings from database...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
          <Navbar />
          <div className="flex items-center justify-center p-4">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-700 p-8 max-w-lg w-full text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Error Loading Data</h2>
              <p className="text-gray-300 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError("");
                  fetchJobPostings();
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Job Postings Dashboard
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto mb-6">
              {viewMode === 'archived' 
                ? 'View and manage your completed job applications and archived posts'
                : viewMode === 'my'
                ? 'Manage your personal job postings and applications'
                : 'Manage and view all job postings submitted through the recruiter form'
              }
            </p>
            
            {/* View Mode Toggle */}
            <div className="flex justify-center">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 border border-gray-700">
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    viewMode === 'all'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  All Posts {viewMode === 'all' ? `(${jobPostings.length})` : ''}
                </button>
                <button
                  onClick={() => setViewMode('my')}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    viewMode === 'my'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  My Posts {viewMode === 'my' ? `(${jobPostings.length})` : ''}
                </button>
                <button
                  onClick={() => setViewMode('archived')}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    viewMode === 'archived'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  Archived Posts {viewMode === 'archived' ? `(${jobPostings.length})` : ''}
                </button>
              </div>
            </div>
          </div>

          {/* Job Postings List */}
          {jobPostings.length === 0 ? (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-700 p-10 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {viewMode === 'archived' 
                  ? 'No Archived Posts Yet'
                  : viewMode === 'my'
                  ? 'No Personal Posts Yet'
                  : 'No Job Postings Yet'
                }
              </h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {viewMode === 'archived' 
                  ? 'Completed job applications will appear here once you mark them as done.'
                  : viewMode === 'my'
                  ? 'Your personal job postings will appear here once you create them.'
                  : 'Job postings will appear here once recruiters start submitting them through the form.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {jobPostings.map((posting, index) => (
                <div
                  key={posting._id || `posting-${index}`}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-700 overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                              <span className="text-white font-bold text-sm">{index + 1}</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white mb-1">
                                {posting.jobTitle || "Untitled Position"}
                              </h3>
                              <div className="flex items-center text-gray-400">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs">
                                  Posted on {formatDate(posting.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                              viewMode === 'archived' 
                                ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
                                : 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                                viewMode === 'archived' ? 'bg-gray-400' : 'bg-emerald-400'
                              }`}></div>
                              {viewMode === 'archived' ? 'Completed' : 'Active'}
                            </span>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center space-x-1">
                              {viewMode !== 'archived' && (
                                <button
                                  onClick={() => posting._id && setArchiveConfirm(posting._id)}
                                  className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                  title="Mark as Done"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={() => handleEmailGeneration(posting)}
                                className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                title="Generate Application Email"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </button>
                              {posting.linkedinUrl && (
                                <a
                                  href={posting.linkedinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                  title="View LinkedIn profile"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                  </svg>
                                </a>
                              )}
                              {viewMode !== 'archived' && (
                                <>
                                  <button
                                    onClick={() => handleEdit(posting)}
                                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                    title="Edit job posting"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => posting._id && setDeleteConfirm(posting._id)}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                    title="Delete job posting"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Recruiter Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                          <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-xl p-3 border border-blue-700/30">
                            <div className="flex items-center mb-1">
                              <svg className="w-3 h-3 text-blue-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <h4 className="text-xs font-semibold text-blue-300">Recruiter</h4>
                            </div>
                            <div className="flex items-center">
                              {posting.profileImage && (
                                <img
                                  src={posting.profileImage}
                                  alt={posting.recruiterName}
                                  className="w-6 h-6 rounded-full mr-2 object-cover border border-blue-500/30"
                                />
                              )}
                              <div>
                                <p className="text-white font-medium text-sm">{posting.recruiterName}</p>
                                {posting.title && (
                                  <p className="text-blue-300 text-xs">{posting.title}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-teal-900/30 to-cyan-900/30 rounded-xl p-3 border border-teal-700/30">
                            <div className="flex items-center mb-1">
                              <svg className="w-3 h-3 text-teal-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <h4 className="text-xs font-semibold text-teal-300">Company</h4>
                            </div>
                            <div className="flex items-center">
                              <p className="text-white font-medium text-sm">{posting.companyName}</p>
                              {posting.location && (
                                <span className="ml-auto text-xs text-teal-300">{posting.location}</span>
                              )}
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-3 border border-purple-700/30">
                            <div className="flex items-center mb-1">
                              <svg className="w-3 h-3 text-purple-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <h4 className="text-xs font-semibold text-purple-300">Email</h4>
                            </div>
                            <button
                              onClick={() => handleEmailGeneration(posting)}
                              className="text-purple-300 hover:text-purple-200 font-medium transition-colors text-sm truncate block w-full text-left"
                              title="Generate Application Email"
                            >
                              {posting.email}
                            </button>
                          </div>

                          <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/30 rounded-xl p-3 border border-emerald-700/30">
                            <div className="flex items-center mb-1">
                              <svg className="w-3 h-3 text-emerald-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <h4 className="text-xs font-semibold text-emerald-300">Phone</h4>
                            </div>
                            <a
                              href={`tel:${posting.phoneNumber}`}
                              className="text-emerald-300 hover:text-emerald-200 font-medium transition-colors text-sm"
                            >
                              {posting.phoneNumber || "Not provided"}
                            </a>
                          </div>
                        </div>

                        {/* Job Description */}
                        {posting.jobDescription && (
                          <div>
                            <div className="flex items-center mb-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg flex items-center justify-center mr-2">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <h4 className="text-sm font-bold text-white">Job Description</h4>
                            </div>
                            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-600">
                              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">
                                {posting.jobDescription}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Modal */}
          {editingPost && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">Edit Job Posting</h2>
                      <p className="text-gray-400">Update the job posting information below</p>
                    </div>
                    <button
                      onClick={() => setEditingPost(null)}
                      className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-colors duration-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-white mb-3">Recruiter Name *</label>
                        <input
                          type="text"
                          name="recruiterName"
                          value={editFormData.recruiterName}
                          onChange={handleEditInputChange}
                          className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-white font-medium placeholder-gray-500 bg-gray-900 ${
                            editErrors.recruiterName
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                              : "border-gray-600 hover:border-gray-500"
                          }`}
                          placeholder="Enter recruiter name"
                        />
                        {editErrors.recruiterName && (
                          <p className="mt-2 text-sm font-medium text-red-400 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {editErrors.recruiterName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-white mb-3">Phone Number</label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={editFormData.phoneNumber}
                          onChange={handleEditInputChange}
                          className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-white font-medium placeholder-gray-500 bg-gray-900 ${
                            editErrors.phoneNumber
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                              : "border-gray-600 hover:border-gray-500"
                          }`}
                          placeholder="+1 (555) 123-4567"
                        />
                        {editErrors.phoneNumber && (
                          <p className="mt-2 text-sm font-medium text-red-400 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {editErrors.phoneNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-white mb-3">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={editFormData.email}
                        onChange={handleEditInputChange}
                        className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-white font-medium placeholder-gray-500 bg-gray-900 ${
                          editErrors.email
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : "border-gray-600 hover:border-gray-500"
                        }`}
                        placeholder="recruiter@company.com"
                      />
                      {editErrors.email && (
                        <p className="mt-2 text-sm font-medium text-red-400 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {editErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-white mb-3">Company Name *</label>
                      <input
                        type="text"
                        name="companyName"
                        value={editFormData.companyName}
                        onChange={handleEditInputChange}
                        className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-white font-medium placeholder-gray-500 bg-gray-900 ${
                          editErrors.companyName
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : "border-gray-600 hover:border-gray-500"
                        }`}
                        placeholder="e.g., Tech Solutions Inc."
                      />
                      {editErrors.companyName && (
                        <p className="mt-2 text-sm font-medium text-red-400 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {editErrors.companyName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-white mb-3">Job Title</label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={editFormData.jobTitle}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-4 border-2 border-gray-600 bg-gray-900 hover:border-gray-500 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-white font-medium placeholder-gray-500"
                        placeholder="e.g., Senior Software Engineer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-white mb-3">Job Description</label>
                      <textarea
                        name="jobDescription"
                        rows={6}
                        value={editFormData.jobDescription}
                        onChange={handleEditInputChange}
                        className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 resize-vertical text-white font-medium placeholder-gray-500 bg-gray-900 ${
                          editErrors.jobDescription
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : "border-gray-600 hover:border-gray-500"
                        }`}
                        placeholder="Provide a detailed description of the role, responsibilities, requirements, and qualifications..."
                      />
                      {editErrors.jobDescription && (
                        <p className="mt-2 text-sm font-medium text-red-400 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {editErrors.jobDescription}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-sm font-medium text-gray-400">
                          {editFormData.jobDescription.trim() ? "Minimum 50 characters if provided" : "Optional field"}
                        </p>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            editFormData.jobDescription.length >= 50 || editFormData.jobDescription.length === 0 
                              ? 'bg-green-400' 
                              : 'bg-amber-400'
                          }`}></div>
                          <p className="text-sm font-bold text-white">
                            {editFormData.jobDescription.length} characters
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-600">
                    <button
                      onClick={() => setEditingPost(null)}
                      className="px-8 py-4 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition-colors duration-200 border border-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className={`px-8 py-4 rounded-xl font-bold text-white transition-all duration-300 ${
                        isUpdating
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transform hover:scale-105"
                      }`}
                    >
                      {isUpdating ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </div>
                      ) : (
                        "Update Job Posting"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Delete Job Posting</h3>
                      <p className="text-sm text-gray-400">This action cannot be undone.</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-6">
                    Are you sure you want to delete this job posting? All associated data will be permanently removed.
                  </p>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(deleteConfirm)}
                      disabled={isDeleting}
                      className={`px-4 py-2 rounded-lg font-medium text-white transition-all duration-300 ${
                        isDeleting
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-lg"
                      }`}
                    >
                      {isDeleting ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Deleting...
                        </div>
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Archive Confirmation Modal */}
          {archiveConfirm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Mark as Done</h3>
                      <p className="text-sm text-gray-400">Move this job posting to archive.</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-6">
                    Are you sure you want to mark this job posting as completed? It will be moved to your archived posts.
                  </p>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setArchiveConfirm(null)}
                      className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleArchive(archiveConfirm)}
                      disabled={isArchiving}
                      className={`px-4 py-2 rounded-lg font-medium text-white transition-all duration-300 ${
                        isArchiving
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-lg"
                      }`}
                    >
                      {isArchiving ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Archiving...
                        </div>
                      ) : (
                        "Mark as Done"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Email Generation Modal */}
      {emailModalOpen && selectedPosting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 w-full max-w-7xl max-h-[95vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    📧 Apply via Email Generator
                  </h2>
                  <p className="text-gray-400">
                    Generate a professional application email for the {selectedPosting.jobTitle} position at {selectedPosting.companyName}
                  </p>
                </div>
                <button
                  onClick={() => setEmailModalOpen(false)}
                  className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left Side: Email Configuration */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Configuration</h3>
                  
                  {/* Profile Info Banner */}
                  <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 rounded-xl p-4 border border-emerald-700/30">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-emerald-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="text-sm font-semibold text-emerald-300 mb-1">🔍 AI-Powered Research</h4>
                        <p className="text-xs text-emerald-100/80 leading-relaxed">
                          Automatically researches company & recruiter using live data from Brave Search for highly personalized emails.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-white mb-3">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={emailGeneration.candidateName}
                        onChange={(e) => setEmailGeneration(prev => ({ ...prev, candidateName: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-900 hover:border-gray-500 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-white font-medium placeholder-gray-500"
                        placeholder="e.g., John Smith"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-white mb-3">
                        Email Type
                      </label>
                      <select
                        value={emailGeneration.emailType}
                        onChange={(e) => setEmailGeneration(prev => ({ 
                          ...prev, 
                          emailType: e.target.value as typeof emailGeneration.emailType 
                        }))}
                        className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-900 hover:border-gray-500 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-white font-medium"
                      >
                        <option value="application">Application</option>
                        <option value="follow-up">Follow-up</option>
                        <option value="thank-you">Thank You</option>
                        <option value="inquiry">Inquiry</option>
                        <option value="withdrawal">Withdrawal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-white mb-3">
                        Tone
                      </label>
                      <select
                        value={emailGeneration.tone}
                        onChange={(e) => setEmailGeneration(prev => ({ 
                          ...prev, 
                          tone: e.target.value as typeof emailGeneration.tone 
                        }))}
                        className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-900 hover:border-gray-500 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-white font-medium"
                      >
                        <option value="professional">Professional</option>
                        <option value="friendly">Friendly</option>
                        <option value="casual">Casual</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-white mb-3">
                        Additional Context
                      </label>
                      <textarea
                        rows={4}
                        value={emailGeneration.additionalContext}
                        onChange={(e) => setEmailGeneration(prev => ({ ...prev, additionalContext: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-900 hover:border-gray-500 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-white font-medium placeholder-gray-500 resize-vertical"
                        placeholder="Any specific details or personalized notes..."
                      />
                    </div>

                    <button
                      onClick={generateAIEmail}
                      disabled={isGenerating}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${
                        isGenerating
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl transform hover:scale-105"
                      }`}
                    >
                      {isGenerating ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {researchStatus.isResearching ? researchStatus.status : 'Generating Email...'}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          🔍 Research & Generate Email
                        </div>
                      )}
                    </button>

                    {/* Research Status Display */}
                    {researchStatus.status && (
                      <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-xl p-3 border border-blue-700/30 text-center">
                        <p className="text-blue-300 text-sm font-medium">
                          ✨ {researchStatus.status}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle: Email Editor */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Email Editor</h3>
                  
                  {generatedEmail ? (
                    <div className="space-y-6">
                      {/* Subject Editor */}
                      <div>
                        <label className="block text-sm font-bold text-gray-300 mb-3">Subject Line:</label>
                        <input
                          type="text"
                          value={editableEmail.subject}
                          onChange={(e) => setEditableEmail(prev => ({ ...prev, subject: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-900 hover:border-gray-500 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-white font-medium placeholder-gray-500"
                          placeholder="Enter email subject..."
                        />
                      </div>

                      {/* Email Body Editor */}
                      <div>
                        <label className="block text-sm font-bold text-gray-300 mb-3">Email Body:</label>
                        <textarea
                          rows={16}
                          value={editableEmail.body}
                          onChange={(e) => setEditableEmail(prev => ({ ...prev, body: e.target.value }))}
                          className="w-full px-4 py-4 border-2 border-gray-600 bg-gray-900 hover:border-gray-500 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-white font-medium placeholder-gray-500 resize-vertical leading-relaxed"
                          placeholder="Email content will appear here..."
                        />
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-gray-400">Edit the email content above before sending</p>
                          <p className="text-xs text-gray-400">{editableEmail.body.length} characters</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <button
                          onClick={openEmailClient}
                          className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Open in Email Client
                        </button>
                        
                        <button
                          onClick={copyEmailToClipboard}
                          className="w-full py-3 px-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy to Clipboard
                        </button>

                        <button
                          onClick={generateAIEmail}
                          disabled={isGenerating}
                          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Regenerate Email
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-xl p-8 border border-gray-600 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">Ready to Generate</h4>
                      <p className="text-gray-400 text-sm">
                        Configure your settings and click "Research & Generate Email" to create your personalized application email.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Side: Research Data & Suggestions */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Research & Insights</h3>
                  
                  {researchData ? (
                    <div className="space-y-4">
                      {/* Company Research */}
                      <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-xl p-4 border border-blue-700/30">
                        <h4 className="text-sm font-bold text-blue-300 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Company Intelligence
                        </h4>
                        {researchData.company.description && (
                          <div className="mb-3">
                            <p className="text-xs text-blue-200 font-medium mb-1">Overview:</p>
                            <p className="text-xs text-blue-100 leading-relaxed">{researchData.company.description}</p>
                          </div>
                        )}
                        {researchData.company.recentNews?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-blue-200 font-medium mb-1">Recent News:</p>
                            <div className="space-y-1">
                              {researchData.company.recentNews.slice(0, 2).map((news: string, index: number) => (
                                <p key={index} className="text-xs text-blue-100 leading-relaxed">• {news}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        {researchData.company.keyInfo?.length > 0 && (
                          <div>
                            <p className="text-xs text-blue-200 font-medium mb-1">Key Info:</p>
                            <div className="space-y-1">
                              {researchData.company.keyInfo.slice(0, 3).map((info: string, index: number) => (
                                <p key={index} className="text-xs text-blue-100 leading-relaxed">• {info}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Recruiter Research */}
                      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-700/30">
                        <h4 className="text-sm font-bold text-purple-300 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Recruiter Background
                        </h4>
                        {researchData.recruiter.title && (
                          <div className="mb-2">
                            <p className="text-xs text-purple-200 font-medium">Title: <span className="text-purple-100">{researchData.recruiter.title}</span></p>
                          </div>
                        )}
                        {researchData.recruiter.linkedIn && (
                          <div className="mb-2">
                            <a 
                              href={researchData.recruiter.linkedIn} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-purple-300 hover:text-purple-200 underline"
                            >
                              LinkedIn Profile
                            </a>
                          </div>
                        )}
                        {researchData.recruiter.background?.length > 0 && (
                          <div>
                            <p className="text-xs text-purple-200 font-medium mb-1">Background:</p>
                            <div className="space-y-1">
                              {researchData.recruiter.background.slice(0, 2).map((bg: string, index: number) => (
                                <p key={index} className="text-xs text-purple-100 leading-relaxed">• {bg}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Suggested Actions */}
                      {generatedEmail?.suggestedActions && (
                        <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/30 rounded-xl p-4 border border-emerald-700/30">
                          <h4 className="text-sm font-bold text-emerald-300 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Follow-up Actions
                          </h4>
                          <div className="space-y-2">
                            {generatedEmail.suggestedActions.map((action, index) => (
                              <div key={index} className="flex items-start">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                                <p className="text-xs text-emerald-100 leading-relaxed">{action}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-xl p-6 border border-gray-600 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-2">Research Results</h4>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        Company and recruiter research data will appear here after email generation.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className={`rounded-xl shadow-lg border p-4 max-w-sm ${
            toast.type === 'success' 
              ? 'bg-emerald-900/90 border-emerald-700 text-emerald-100' 
              : toast.type === 'warning'
              ? 'bg-amber-900/90 border-amber-700 text-amber-100'
              : 'bg-blue-900/90 border-blue-700 text-blue-100'
          } backdrop-blur-sm`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {toast.type === 'success' && (
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {toast.type === 'warning' && (
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                {toast.type === 'info' && (
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="ml-4 inline-flex text-gray-400 hover:text-gray-300 focus:outline-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
} 