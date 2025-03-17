// Interface for user profile summary
export interface UserProfileSummary {
  uid: string;
  name: string;
  email: string;
  about: string;
  profileImage?: string;
  phone?: string;
  location?: string;
  title?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  experiences?: Experience[];
  education?: Education[];
  skills?: Skill[];
  projects?: Project[];
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  includeInResume?: boolean;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  cgpa: string;
  includeInResume?: boolean;
}

export interface Skill {
  id: string;
  name: string;
  domain: string;
  includeInResume?: boolean;
}

export interface Project {
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

export async function saveUserProfileSummary(profileData: UserProfileSummary): Promise<void> {
  try {
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save profile data');
    }
  } catch (error) {
    console.error('Error saving user profile summary:', error);
    throw new Error('Failed to save profile data');
  }
}

export async function getUserProfileSummary(uid: string): Promise<UserProfileSummary | null> {
  try {
    const response = await fetch(`/api/profile?uid=${encodeURIComponent(uid)}`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch profile data');
    }
    
    const data = await response.json();
    return data.profile as UserProfileSummary;
  } catch (error) {
    console.error('Error fetching user profile summary:', error);
    throw new Error('Failed to fetch profile data');
  }
} 