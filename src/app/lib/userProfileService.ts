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
  certificates?: Certificate[];
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

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialUrl?: string;
  includeInResume?: boolean;
}

export async function saveUserProfileSummary(profileData: UserProfileSummary): Promise<void> {
  try {
    console.log("API: saveUserProfileSummary called with profile data:", {
      ...profileData,
      // Abbreviate large arrays to keep log readable
      experiences: profileData.experiences ? `[${profileData.experiences.length} items]` : '[]',
      education: profileData.education ? `[${profileData.education.length} items]` : '[]',
      skills: profileData.skills ? `[${profileData.skills.length} items]` : '[]',
      projects: profileData.projects ? `[${profileData.projects.length} items]` : '[]'
    });
    
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    console.log("API: Profile save API response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API ERROR: Failed to save profile data:", errorData);
      throw new Error(errorData.error || 'Failed to save profile data');
    }
    
    console.log("API: Profile data saved successfully");
  } catch (error) {
    console.error('API ERROR: Error saving user profile summary:', error);
    throw new Error('Failed to save profile data');
  }
}

// New function to add a single experience
export async function addExperienceItem(uid: string, experience: Experience): Promise<UserProfileSummary | null> {
  try {
    console.log("API: addExperienceItem called with:", experience);
    
    const response = await fetch('/api/profile?arrayUpdate=true&arrayType=experience', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        experiences: [experience]
      }),
    });

    console.log("API: Experience item save response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API ERROR: Failed to save experience item:", errorData);
      throw new Error(errorData.error || 'Failed to save experience item');
    }
    
    console.log("API: Experience item saved successfully");
    
    // Fetch updated profile
    return await getUserProfileSummary(uid);
  } catch (error) {
    console.error('API ERROR: Error saving experience item:', error);
    throw new Error('Failed to save experience item');
  }
}

// New function to add a single education item
export async function addEducationItem(uid: string, education: Education): Promise<UserProfileSummary | null> {
  try {
    console.log("API: addEducationItem called with:", education);
    
    const response = await fetch('/api/profile?arrayUpdate=true&arrayType=education', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        education: [education]
      }),
    });

    console.log("API: Education item save response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API ERROR: Failed to save education item:", errorData);
      throw new Error(errorData.error || 'Failed to save education item');
    }
    
    console.log("API: Education item saved successfully");
    
    // Fetch updated profile
    return await getUserProfileSummary(uid);
  } catch (error) {
    console.error('API ERROR: Error saving education item:', error);
    throw new Error('Failed to save education item');
  }
}

// New function to add a single skill item
export async function addSkillItem(uid: string, skill: Skill): Promise<UserProfileSummary | null> {
  try {
    console.log("API: addSkillItem called with:", skill);
    
    const response = await fetch('/api/profile?arrayUpdate=true&arrayType=skill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        skills: [skill]
      }),
    });

    console.log("API: Skill item save response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API ERROR: Failed to save skill item:", errorData);
      throw new Error(errorData.error || 'Failed to save skill item');
    }
    
    console.log("API: Skill item saved successfully");
    
    // Fetch updated profile
    return await getUserProfileSummary(uid);
  } catch (error) {
    console.error('API ERROR: Error saving skill item:', error);
    throw new Error('Failed to save skill item');
  }
}

// New function to add a single project item
export async function addProjectItem(uid: string, project: Project): Promise<UserProfileSummary | null> {
  try {
    console.log("API: addProjectItem called with:", project);
    
    const response = await fetch('/api/profile?arrayUpdate=true&arrayType=project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        projects: [project]
      }),
    });

    console.log("API: Project item save response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API ERROR: Failed to save project item:", errorData);
      throw new Error(errorData.error || 'Failed to save project item');
    }
    
    console.log("API: Project item saved successfully");
    
    // Fetch updated profile
    return await getUserProfileSummary(uid);
  } catch (error) {
    console.error('API ERROR: Error saving project item:', error);
    throw new Error('Failed to save project item');
  }
}

// New function to add a single certificate item
export async function addCertificateItem(uid: string, certificate: Certificate): Promise<UserProfileSummary | null> {
  try {
    console.log("API: addCertificateItem called with:", certificate);
    
    const response = await fetch('/api/profile?arrayUpdate=true&arrayType=certificate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        certificates: [certificate]
      }),
    });

    console.log("API: Certificate item save response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API ERROR: Failed to save certificate item:", errorData);
      throw new Error(errorData.error || 'Failed to save certificate item');
    }
    
    console.log("API: Certificate item saved successfully");
    
    // Fetch updated profile
    return await getUserProfileSummary(uid);
  } catch (error) {
    console.error('API ERROR: Error saving certificate item:', error);
    throw new Error('Failed to save certificate item');
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