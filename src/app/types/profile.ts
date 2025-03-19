export interface ProfileInfo {
  name: string;
  email: string;
  profileImage?: string;
  phone?: string;
  location?: string;
  title?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
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

export interface UserProfile extends ProfileInfo {
  about: string;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
} 