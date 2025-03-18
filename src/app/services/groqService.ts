export interface GenerationPrompt {
  type: 'experience' | 'project';
  position?: string;
  company?: string;
  title?: string;
  technologies?: string;
  additionalContext?: string;
  currentDescription?: string;
  mode?: 'replace' | 'enhance';
}

// Fallback mock generator for development or when API fails
const generateMockDescription = (prompt: GenerationPrompt): string => {
  // If enhance mode with current description, just return it slightly modified
  if (prompt.mode === 'enhance' && prompt.currentDescription) {
    const lines = prompt.currentDescription.split('\n').filter(line => line.trim().length > 0);
    return lines.map(line => {
      // Just add some common resume action words to the beginning if they're not there already
      const actionWords = ['Successfully ', 'Effectively ', 'Proactively ', 'Strategically '];
      const randomAction = actionWords[Math.floor(Math.random() * actionWords.length)];
      
      // If line already starts with an action word, leave it as is
      for (const word of actionWords) {
        if (line.startsWith(word)) {
          return line;
        }
      }
      
      // Otherwise add a random action word
      return randomAction + line.charAt(0).toLowerCase() + line.slice(1);
    }).join('\n');
  }

  // Default replace behavior
  if (prompt.type === 'experience') {
    const position = prompt.position || 'professional';
    const company = prompt.company || 'company';
    
    const bulletPoints = [
      `Led cross-functional teams to deliver key projects for ${company}`,
      `Implemented process improvements that increased team productivity by 20%`,
      `Collaborated with stakeholders to define and prioritize product requirements`,
      `Managed project timelines and resources to ensure on-time delivery`,
      `Mentored junior ${position.toLowerCase()} team members`,
      `Developed and implemented strategies that improved ${company}'s operational efficiency`,
      `Spearheaded initiatives that resulted in 15% cost reduction`,
      `Created documentation and processes that improved team onboarding`
    ];
    
    return bulletPoints
      .sort(() => Math.random() - 0.5)
      .slice(0, 4)
      .join('\n');
  } else {
    const title = prompt.title || 'project';
    const techList = prompt.technologies ? 
      prompt.technologies.split(',').map(t => t.trim()) : 
      ['technology'];
    
    const bulletPoints = [
      `Designed and developed ${title} using ${techList.slice(0, 2).join(' and ')}`,
      `Implemented responsive design ensuring compatibility across all devices and browsers`,
      `Created robust backend API endpoints to handle data processing and storage`,
      `Optimized application performance resulting in 40% faster load times`,
      `Integrated third-party services and APIs to enhance functionality`,
      `Collaborated with design team to implement UI/UX best practices`,
      `Set up CI/CD pipeline for automated testing and deployment`,
      `Utilized ${techList[0]} for frontend components and state management`
    ];
    
    return bulletPoints
      .sort(() => Math.random() - 0.5)
      .slice(0, 4)
      .join('\n');
  }
};

export const generateDescription = async (prompt: GenerationPrompt): Promise<string> => {
  try {
    const apiUrl = '/api/generate-description';
    
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
      return generateMockDescription(prompt);
    }
    
    const data = await response.json();
    return data.description;
  } catch (error) {
    console.error('Error generating description:', error);
    console.warn('Using mock generator as fallback');
    return generateMockDescription(prompt);
  }
}; 