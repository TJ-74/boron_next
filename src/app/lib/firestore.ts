import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';

export interface RecruiterFormData {
  id?: string;
  recruiterName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  createdAt?: any;
  updatedAt?: any;
  status?: string;
}

// Get all job postings
export const getAllJobPostings = async (): Promise<RecruiterFormData[]> => {
  try {
    const jobPostingsRef = collection(db, 'jobPostings');
    const q = query(jobPostingsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const jobPostings: RecruiterFormData[] = [];
    querySnapshot.forEach((doc) => {
      jobPostings.push({
        id: doc.id,
        ...doc.data()
      } as RecruiterFormData);
    });
    
    return jobPostings;
  } catch (error) {
    console.error('Error fetching job postings:', error);
    throw new Error('Failed to fetch job postings');
  }
};

// Update a job posting
export const updateJobPosting = async (
  id: string, 
  data: Partial<RecruiterFormData>
): Promise<void> => {
  try {
    const jobPostingRef = doc(db, 'jobPostings', id);
    await updateDoc(jobPostingRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating job posting:', error);
    throw new Error('Failed to update job posting');
  }
};

// Delete a job posting
export const deleteJobPosting = async (id: string): Promise<void> => {
  try {
    const jobPostingRef = doc(db, 'jobPostings', id);
    await deleteDoc(jobPostingRef);
  } catch (error) {
    console.error('Error deleting job posting:', error);
    throw new Error('Failed to delete job posting');
  }
}; 