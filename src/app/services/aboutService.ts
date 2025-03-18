export interface AboutGenerationPrompt {
  experiences?: Array<{
    position: string;
    company: string;
    description?: string;
  }>;
  skills?: string[];
  education?: Array<{
    school: string;
    degree: string;
  }>;
  currentAbout?: string;
  mode?: 'replace' | 'enhance'; // Default is 'replace' if not specified
}

// Fallback mock generator for development or when API fails
const generateMockAbout = (prompt: AboutGenerationPrompt): string => {
  // If enhance mode with current about, just slightly modify it
  if (prompt.mode === 'enhance' && prompt.currentAbout) {
    return prompt.currentAbout + "\n\nI'm passionate about delivering high-quality results and continuously improving my skills.";
  }

  // Default replace behavior - generate a generic about
  const experience = prompt.experiences?.[0];
  const skill = prompt.skills?.[0] || "professional skills";
  const education = prompt.education?.[0];
  
  return `I am a seasoned ${experience?.position || "professional"} with experience at ${experience?.company || "leading companies"} in the industry. My expertise in ${skill} allows me to deliver exceptional results. ${education ? `I hold a ${education.degree} from ${education.school}.` : ""} I'm passionate about tackling complex challenges and driving innovation in everything I do. My collaborative approach and attention to detail have helped me consistently exceed expectations throughout my career.`;
};

export const generateAbout = async (prompt: AboutGenerationPrompt): Promise<string> => {
  try {
    const apiUrl = '/api/generate-about';
    
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
      return generateMockAbout(prompt);
    }
    
    const data = await response.json();
    return data.about;
  } catch (error) {
    console.error('Error generating about:', error);
    console.warn('Using mock generator as fallback');
    return generateMockAbout(prompt);
  }
}; 