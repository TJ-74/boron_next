export interface JobPosting {
  recruiterName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
}

export const submitJobPostingMock = async (jobData: JobPosting): Promise<string> => {
  console.log('🧪 Mock service: Submitting job posting:', jobData);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate occasional failures for testing error handling
  if (Math.random() < 0.1) { // 10% chance of failure
    throw new Error('Mock error: Simulated network failure');
  }
  
  // Generate a mock document ID
  const mockId = 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  console.log('🎯 Mock service: Job posting saved with ID:', mockId);
  
  return mockId;
}; 