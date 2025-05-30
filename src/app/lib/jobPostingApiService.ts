export interface JobPosting {
  _id?: string;
  uid: string; // User ID from Firebase Auth
  recruiterName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  status: string;
  // Profile information
  profileImage?: string;
  title?: string;
  location?: string;
  linkedinUrl?: string;
}

export interface JobPostingInput {
  recruiterName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
}

// Submit a new job posting via API
export const submitJobPosting = async (
  jobData: JobPostingInput,
  uid: string
): Promise<string> => {
  console.log('API Client: Submitting job posting for user:', uid);
  console.log('API Client: Job data:', jobData);
  
  try {
    const response = await fetch('/api/job-postings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...jobData, uid }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit job posting');
    }

    const result = await response.json();
    console.log('API Client: Job posting submitted successfully with ID:', result.id);
    
    return result.id;
  } catch (error) {
    console.error('API Client: Error submitting job posting:', error);
    throw new Error(`Failed to submit job posting: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get all job postings via API (optionally filtered by user)
export const getAllJobPostings = async (uid?: string): Promise<JobPosting[]> => {
  try {
    const url = uid ? `/api/job-postings?uid=${uid}` : '/api/job-postings';
    console.log('API Client: Fetching job postings from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch job postings');
    }

    const jobPostings = await response.json();
    console.log(`API Client: Fetched ${jobPostings.length} job postings`);
    
    return jobPostings;
  } catch (error) {
    console.error('API Client: Error fetching job postings:', error);
    throw new Error('Failed to fetch job postings');
  }
};

// Update a job posting via API
export const updateJobPosting = async (
  id: string, 
  updateData: Partial<JobPostingInput>,
  uid?: string
): Promise<void> => {
  try {
    console.log('API Client: Updating job posting with ID:', id);
    console.log('API Client: Update data:', updateData);
    
    const requestBody: any = { id, ...updateData };
    if (uid) {
      requestBody.uid = uid;
    }
    
    const response = await fetch('/api/job-postings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update job posting');
    }

    console.log('API Client: Job posting updated successfully');
  } catch (error) {
    console.error('API Client: Error updating job posting:', error);
    throw new Error('Failed to update job posting');
  }
};

// Delete a job posting via API
export const deleteJobPosting = async (id: string, uid?: string): Promise<void> => {
  try {
    console.log('API Client: Deleting job posting with ID:', id);
    
    const url = uid ? `/api/job-postings?id=${id}&uid=${uid}` : `/api/job-postings?id=${id}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete job posting');
    }

    console.log('API Client: Job posting deleted successfully');
  } catch (error) {
    console.error('API Client: Error deleting job posting:', error);
    throw new Error('Failed to delete job posting');
  }
};

// Mark a job posting as completed/archived via API
export const markJobPostingAsCompleted = async (id: string, uid?: string): Promise<void> => {
  try {
    console.log('API Client: Marking job posting as completed with ID:', id);
    
    const requestBody: any = { id, status: 'completed' };
    if (uid) {
      requestBody.uid = uid;
    }
    
    const response = await fetch('/api/job-postings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to mark job posting as completed');
    }

    console.log('API Client: Job posting marked as completed successfully');
  } catch (error) {
    console.error('API Client: Error marking job posting as completed:', error);
    throw new Error('Failed to mark job posting as completed');
  }
};

// Get archived job postings via API (optionally filtered by user)
export const getArchivedJobPostings = async (uid?: string): Promise<JobPosting[]> => {
  try {
    const baseUrl = uid ? `/api/job-postings?uid=${uid}` : '/api/job-postings';
    const url = `${baseUrl}${uid ? '&' : '?'}status=completed`;
    console.log('API Client: Fetching archived job postings from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch archived job postings');
    }

    const jobPostings = await response.json();
    console.log(`API Client: Fetched ${jobPostings.length} archived job postings`);
    
    return jobPostings;
  } catch (error) {
    console.error('API Client: Error fetching archived job postings:', error);
    throw new Error('Failed to fetch archived job postings');
  }
}; 