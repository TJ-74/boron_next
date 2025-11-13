"use client";

import { useState, useEffect } from "react";
import { submitJobPosting } from "../../lib/jobPostingApiService";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import Navbar from "@/app/components/ui/navbar";
import { useAuth } from '../../context/AuthContext';
import { getUserProfileSummary } from '../../lib/userProfileService';

interface FormData {
  recruiterName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
}

export default function RecruiterForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    recruiterName: "",
    email: "",
    phoneNumber: "",
    companyName: "",
    jobTitle: "",
    jobDescription: "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");
  const [isJobSectionOpen, setIsJobSectionOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load user profile data on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.uid) return;
      
      try {
        console.log('User profile loading disabled to prevent autofill');
        setProfileLoaded(true);
      } catch (error) {
        console.error('Failed to load user profile:', error);
        setProfileLoaded(true);
      }
    };

    loadUserProfile();
    
    // Cleanup function to reset form when component unmounts
    return () => {
      console.log('Cleaning up recruiter form...');
      setFormData({
        recruiterName: "",
        email: "",
        phoneNumber: "",
        companyName: "",
        jobTitle: "",
        jobDescription: "",
      });
      setErrors({});
      setSubmitError("");
      setIsSubmitted(false);
      setProfileLoaded(false);
    };
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.recruiterName.trim()) {
      newErrors.recruiterName = "Recruiter name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    // Phone number validation - only validate format if provided
    if (formData.phoneNumber.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phoneNumber.replace(/[\s\-\(\)]/g, ""))) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    // Job description validation - only validate length if provided
    if (formData.jobDescription.trim() && formData.jobDescription.trim().length < 50) {
      newErrors.jobDescription = "Job description must be at least 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Form submitted, starting validation...');
    console.log('📝 Form data:', formData);

    if (!validateForm()) {
      console.log('❌ Form validation failed, errors:', errors);
      return;
    }

    if (!user?.uid) {
      setSubmitError("Authentication required. Please log in and try again.");
      return;
    }

    console.log('✅ Form validation passed, starting submission...');
    
    setIsSubmitting(true);
    setSubmitError("");
    setSaveStatus('saving');

    try {
      console.log('🔥 Starting job posting submission...');
      console.log('📤 About to call submitJobPosting with data:', formData);
      console.log('👤 User ID:', user.uid);
      
      // Submit to MongoDB with user ID
      const docId = await submitJobPosting(formData, user.uid);
      console.log('🎉 Job posting submitted successfully with ID:', docId);
      
      setSubmissionId(docId);
      setIsSubmitted(true);
      setSaveStatus('success');
      
      // Reset form after successful submission - more thorough reset
      setFormData({
        recruiterName: "",
        email: "",
        phoneNumber: "",
        companyName: "",
        jobTitle: "",
        jobDescription: "",
      });
      setErrors({});
      setIsJobSectionOpen(false);
      
      // Form will remain empty - no auto-repopulation
    } catch (error) {
      console.error("💥 Submission error:", error);
      console.error("🔍 Full error object:", JSON.stringify(error, null, 2));
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
      console.error("📢 Error message to display:", errorMessage);
      setSubmitError(errorMessage);
      setSaveStatus('error');
    } finally {
      console.log('🏁 Setting isSubmitting to false');
      setIsSubmitting(false);
      
      // Reset save status after 3 seconds
      setTimeout(() => {
        if (saveStatus === 'success') {
          setSaveStatus('idle');
        }
      }, 3000);
    }
  };

  const handleNewSubmission = () => {
    setIsSubmitted(false);
    setErrors({});
    setSubmitError("");
    setSubmissionId("");
    setIsJobSectionOpen(false);
    
    // Reset form to completely empty state
    setFormData({
      recruiterName: "",
      email: "",
      phoneNumber: "",
      companyName: "",
      jobTitle: "",
      jobDescription: "",
    });
  };

  // Check if job section has any content
  const hasJobContent = formData.jobTitle.trim() || formData.jobDescription.trim();

  if (isSubmitted) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
          <Navbar />
          <div className="flex items-center justify-center p-4">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-700 p-8 max-w-lg w-full text-center mt-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Job Posted Successfully!
              </h2>
              <p className="text-gray-300 mb-6">
                Your job posting has been submitted and is now live. Reference ID: {submissionId}
              </p>
              <button
                onClick={handleNewSubmission}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Submit Another Job
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Submit Job Posting
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Connect with top talent through our streamlined platform
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
            {submitError && (
              <div className="m-6 mb-0 p-4 bg-red-900/20 border border-red-700 rounded-2xl">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-900/30 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-red-500 mb-1">Submission Error</h3>
                    <p className="text-sm text-red-400">{submitError}</p>
                  </div>
                </div>
              </div>
            )}

            <form 
              key={`recruiter-form-${profileLoaded ? 'loaded' : 'loading'}-${user?.uid || 'anonymous'}`}
              onSubmit={handleSubmit} 
              className="p-6 space-y-6" 
              autoComplete="off"
            >
              {/* Recruiter Information Section */}
              <div className="pb-6 border-b border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-white">Recruiter Information</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="lg:col-span-1">
                    <label htmlFor="recruiterName" className="block text-sm font-semibold text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="recruiterName"
                      name="recruiterName"
                      value={formData.recruiterName}
                      onChange={handleInputChange}
                      autoComplete="off"
                      className={`w-full px-3 py-3 bg-gray-900/50 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-white placeholder-gray-500 ${
                        errors.recruiterName
                          ? "border-red-500/50 bg-red-900/20 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.recruiterName && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.recruiterName}
                      </p>
                    )}
                  </div>

                  <div className="lg:col-span-1">
                    <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      autoComplete="off"
                      className={`w-full px-3 py-3 bg-gray-900/50 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-white placeholder-gray-500 ${
                        errors.phoneNumber
                          ? "border-red-500/50 bg-red-900/20 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                    {errors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.phoneNumber}
                      </p>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      autoComplete="off"
                      className={`w-full px-3 py-3 bg-gray-900/50 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-white placeholder-gray-500 ${
                        errors.email 
                          ? "border-red-500/50 bg-red-900/20 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                      placeholder="recruiter@company.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <label htmlFor="companyName" className="block text-sm font-semibold text-gray-300 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      autoComplete="off"
                      className={`w-full px-3 py-3 bg-gray-900/50 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-white placeholder-gray-500 ${
                        errors.companyName
                          ? "border-red-500/50 bg-red-900/20 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                      placeholder="e.g., Tech Solutions Inc."
                    />
                    {errors.companyName && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.companyName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsible Job Information Section */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsJobSectionOpen(!isJobSectionOpen)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 hover:from-purple-900/70 hover:to-pink-900/70 rounded-xl border border-purple-700/50 transition-all duration-200 group"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform duration-200">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-white">Job Information</h2>
                      <p className="text-xs text-gray-400">
                        {isJobSectionOpen ? 'Click to collapse' : 'Optional - Click to add job details'}
                        {hasJobContent && !isJobSectionOpen && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300 border border-purple-700/50">
                            Has content
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                        isJobSectionOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Collapsible Content */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isJobSectionOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="pt-4 space-y-4">
                    <div>
                      <label htmlFor="jobTitle" className="block text-sm font-semibold text-gray-300 mb-2">
                        Job Title
                      </label>
                      <input
                        type="text"
                        id="jobTitle"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleInputChange}
                        autoComplete="off"
                        className={`w-full px-3 py-3 bg-gray-900/50 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-white placeholder-gray-500 ${
                          errors.jobTitle
                            ? "border-red-500/50 bg-red-900/20 focus:border-red-500 focus:ring-red-500/20"
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                        placeholder="e.g., Senior Software Engineer"
                      />
                      {errors.jobTitle && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.jobTitle}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="jobDescription" className="block text-sm font-semibold text-gray-300 mb-2">
                        Job Description
                      </label>
                      <textarea
                        id="jobDescription"
                        name="jobDescription"
                        rows={6}
                        value={formData.jobDescription}
                        onChange={handleInputChange}
                        autoComplete="off"
                        className={`w-full px-3 py-3 bg-gray-900/50 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 resize-vertical text-white placeholder-gray-500 ${
                          errors.jobDescription
                            ? "border-red-500/50 bg-red-900/20 focus:border-red-500 focus:ring-red-500/20"
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                        placeholder="Provide a detailed description of the role, responsibilities, requirements, and qualifications..."
                      />
                      <div className="flex justify-between items-center mt-2">
                        {errors.jobDescription ? (
                          <p className="text-sm text-red-500 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.jobDescription}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Optional - If provided, minimum 50 characters
                          </p>
                        )}
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${formData.jobDescription.length >= 50 || formData.jobDescription.length === 0 ? 'bg-green-400' : 'bg-amber-400'}`}></div>
                          <p className="text-xs text-gray-400 font-medium">
                            {formData.jobDescription.length} chars
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform ${
                    isSubmitting
                      ? "bg-gray-700 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-2xl hover:scale-105 active:scale-95"
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting to Database...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Submit Job Posting
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Compact Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-500 text-xs">
              By submitting this form, you agree to our{" "}
              <a href="#" className="text-indigo-400 hover:text-indigo-300 font-medium">terms of service</a>
              {" "}and{" "}
              <a href="#" className="text-indigo-400 hover:text-indigo-300 font-medium">privacy policy</a>.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 