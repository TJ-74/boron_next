import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface JobPosting {
  recruiterName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
}

export const submitJobPosting = async (jobData: JobPosting): Promise<string> => {
  console.log('Submitting job posting:', jobData);
  
  try {
    // Check if Firebase is properly configured
    if (!db) {
      throw new Error('Firebase database not initialized. Please check your Firebase configuration.');
    }
    
    console.log('Firebase DB instance:', db);
    
    const jobPostingRef = collection(db, 'jobPostings');
    console.log('Collection reference created:', jobPostingRef);
    
    // Add additional metadata
    const jobPostingWithMetadata = {
      ...jobData,
      createdAt: serverTimestamp(),
      status: 'pending', // Can be used for approval workflow if needed
      updatedAt: serverTimestamp(),
    };

    console.log('Saving job posting with metadata:', jobPostingWithMetadata);
    
    const docRef = await addDoc(jobPostingRef, jobPostingWithMetadata);
    console.log('Job posting saved successfully with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error submitting job posting:', error);
    console.error('Error details:', error);
    
    // Check for specific Firebase errors
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.message.includes('Firebase')) {
        throw new Error('Firebase configuration error. Please check your environment variables and Firebase setup.');
      } else if (error.message.includes('permission-denied')) {
        throw new Error('You do not have permission to post jobs. Please check your authentication.');
      } else if (error.message.includes('network')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('not initialized')) {
        throw new Error('Database not properly configured. Please contact support.');
      }
    }
    
    throw new Error(`Failed to submit job posting: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 