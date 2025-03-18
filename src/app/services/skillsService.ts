export interface SkillsGenerationPrompt {
  experiences?: Array<{
    position: string;
    company: string;
    description?: string;
  }>;
  projects?: Array<{
    title: string;
    technologies: string;
    description?: string;
  }>;
  currentSkills?: Array<{
    name: string;
    domain: string;
  }>;
  mode?: 'add' | 'suggest';
}

// Fallback mock generator for development or when API fails
const generateMockSkills = (prompt: SkillsGenerationPrompt): Array<{name: string, domain: string}> => {
  const mockSkills: Array<{name: string, domain: string}> = [];
  
  // If in suggest mode and we already have skills, return some complementary skills
  if (prompt.mode === 'suggest' && prompt.currentSkills && prompt.currentSkills.length > 0) {
    // Find domains we already have
    const existingDomains = [...new Set(prompt.currentSkills.map(s => s.domain))];
    
    // For each domain, suggest a couple more skills
    existingDomains.forEach(domain => {
      if (domain === 'Frontend Development') {
        mockSkills.push({ name: 'Next.js', domain });
        mockSkills.push({ name: 'Tailwind CSS', domain });
      } else if (domain === 'Backend Development') {
        mockSkills.push({ name: 'Express.js', domain });
        mockSkills.push({ name: 'MongoDB', domain });
      } else if (domain === 'DevOps') {
        mockSkills.push({ name: 'Docker', domain });
        mockSkills.push({ name: 'AWS', domain });
      } else {
        mockSkills.push({ name: `Advanced ${domain}`, domain });
      }
    });
    
    // Add a couple new domains
    mockSkills.push({ name: 'Unit Testing', domain: 'Quality Assurance' });
    mockSkills.push({ name: 'Jest', domain: 'Quality Assurance' });
    
    return mockSkills;
  }
  
  // Default is to generate skills based on experiences and projects
  if (prompt.experiences?.length) {
    // Generate tech skills based on first experience
    const exp = prompt.experiences[0];
    if (exp.position.toLowerCase().includes('frontend') || exp.position.toLowerCase().includes('ui')) {
      mockSkills.push({ name: 'React', domain: 'Frontend Development' });
      mockSkills.push({ name: 'JavaScript', domain: 'Frontend Development' });
      mockSkills.push({ name: 'HTML/CSS', domain: 'Frontend Development' });
    } else if (exp.position.toLowerCase().includes('backend')) {
      mockSkills.push({ name: 'Node.js', domain: 'Backend Development' });
      mockSkills.push({ name: 'Express', domain: 'Backend Development' });
      mockSkills.push({ name: 'SQL', domain: 'Backend Development' });
    } else if (exp.position.toLowerCase().includes('full')) {
      mockSkills.push({ name: 'React', domain: 'Frontend Development' });
      mockSkills.push({ name: 'Node.js', domain: 'Backend Development' });
    }
    
    // Add soft skills
    mockSkills.push({ name: 'Team Leadership', domain: 'Leadership' });
    mockSkills.push({ name: 'Project Management', domain: 'Management' });
  }
  
  if (prompt.projects?.length) {
    // Extract technologies from first project
    const proj = prompt.projects[0];
    const techs = proj.technologies.split(',').map(t => t.trim());
    
    techs.forEach(tech => {
      // Determine domain based on technology
      let domain = 'Other';
      if (['react', 'angular', 'vue', 'html', 'css', 'javascript'].some(t => tech.toLowerCase().includes(t))) {
        domain = 'Frontend Development';
      } else if (['node', 'express', 'python', 'django', 'sql', 'mongodb', 'postgres'].some(t => tech.toLowerCase().includes(t))) {
        domain = 'Backend Development';
      } else if (['aws', 'docker', 'kubernetes', 'ci/cd', 'jenkins'].some(t => tech.toLowerCase().includes(t))) {
        domain = 'DevOps';
      }
      
      mockSkills.push({ name: tech, domain });
    });
  }
  
  // If we still don't have skills, add some generic ones
  if (mockSkills.length === 0) {
    mockSkills.push({ name: 'JavaScript', domain: 'Frontend Development' });
    mockSkills.push({ name: 'React', domain: 'Frontend Development' });
    mockSkills.push({ name: 'Node.js', domain: 'Backend Development' });
    mockSkills.push({ name: 'SQL', domain: 'Backend Development' });
    mockSkills.push({ name: 'Problem Solving', domain: 'Soft Skills' });
    mockSkills.push({ name: 'Communication', domain: 'Soft Skills' });
  }
  
  return mockSkills;
};

export const generateSkills = async (prompt: SkillsGenerationPrompt): Promise<Array<{name: string, domain: string}>> => {
  try {
    const apiUrl = '/api/generate-skills';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prompt),
    });
    
    if (!response.ok) {
      // If the API fails, use the mock generator as fallback
      console.warn('API call failed, using mock generator instead');
      return generateMockSkills(prompt);
    }
    
    const data = await response.json();
    return data.skills;
  } catch (error) {
    console.error('Error generating skills:', error);
    console.warn('Using mock generator as fallback');
    return generateMockSkills(prompt);
  }
}; 