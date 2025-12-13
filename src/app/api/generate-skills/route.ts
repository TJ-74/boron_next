import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Create a Groq client
const createGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not defined in environment variables');
  }
  
  return new Groq({
    apiKey,
  });
};

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
  mode?: 'add' | 'suggest'; // 'add' adds new skills, 'suggest' enhances existing skills
}

// Clean up the response to ensure we get a proper skills array
const parseSkillsResponse = (text: string): Array<{name: string, domain: string}> => {
  try {
    // First, try to parse as JSON directly
    try {
      const directParse = JSON.parse(text);
      if (Array.isArray(directParse)) {
        return directParse.map(item => ({
          name: item.name || item.skill || '',
          domain: item.domain || item.category || ''
        })).filter(item => item.name && item.domain);
      }
    } catch (e) {
      // Continue with text parsing if JSON parsing fails
    }
    
    // Remove any introductory or concluding text
    let cleanText = text
      .replace(/^(here are|here's|here is|some|the|suggested|skills|for you).*?\n/i, '')
      .replace(/\n.*(hope this helps|these skills|let me know|feel free).*/i, '');
    
    // Try to extract skills in format "- SkillName (Domain)" or similar patterns
    const skills: Array<{name: string, domain: string}> = [];
    
    // Match patterns like "Domain: Skill1, Skill2, Skill3"
    const domainGroupPattern = /([A-Za-z0-9&\s]+):\s*((?:[A-Za-z0-9+#.\s]+(?:,\s*|$))+)/g;
    let domainMatch;
    while ((domainMatch = domainGroupPattern.exec(cleanText)) !== null) {
      const domain = domainMatch[1].trim();
      const skillsStr = domainMatch[2].trim();
      
      skillsStr.split(',').forEach(skill => {
        const trimmedSkill = skill.trim();
        if (trimmedSkill) {
          skills.push({
            name: trimmedSkill,
            domain: domain
          });
        }
      });
    }
    
    // If no domain groups found, look for list items with domain in parentheses
    if (skills.length === 0) {
      const skillLinePattern = /-\s*([A-Za-z0-9+#.\s]+)\s*(?:\(([A-Za-z0-9&\s]+)\))?/g;
      let match;
      
      while ((match = skillLinePattern.exec(cleanText)) !== null) {
        const name = match[1].trim();
        // Default domain to "Other" if not specified
        const domain = match[2]?.trim() || "Other";
        
        if (name) {
          skills.push({ name, domain });
        }
      }
    }
    
    // If still no skills found, try splitting by lines and guess structure
    if (skills.length === 0) {
      const lines = cleanText.split('\n').filter(line => line.trim().length > 0);
      
      lines.forEach(line => {
        // Remove bullets, numbers, and other markers
        const cleanLine = line.replace(/^[-•*\d\s.)\]]+\s*/, '').trim();
        
        // Check if line contains a colon (Domain: Skill)
        const colonSplit = cleanLine.split(':');
        if (colonSplit.length === 2) {
          const domain = colonSplit[0].trim();
          const skillsInLine = colonSplit[1].split(',');
          
          skillsInLine.forEach(skill => {
            const name = skill.trim();
            if (name) {
              skills.push({ name, domain });
            }
          });
        } else {
          // Try to find domain in parentheses
          const parenthesesMatch = cleanLine.match(/([^(]+)\s*\(([^)]+)\)/);
          if (parenthesesMatch) {
            const name = parenthesesMatch[1].trim();
            const domain = parenthesesMatch[2].trim();
            if (name && domain) {
              skills.push({ name, domain });
            }
          } else {
            // If no clear structure, assume it's a skill name and put in "Other" domain
            if (cleanLine) {
              skills.push({ name: cleanLine, domain: "Other" });
            }
          }
        }
      });
    }
    
    return skills;
  } catch (error) {
    console.error("Error parsing skills response:", error);
    return [];
  }
};

export async function POST(request: Request) {
  try {
    const prompt: SkillsGenerationPrompt = await request.json();
    const mode = prompt.mode || 'add';
    
    const groq = createGroqClient();
    
    let systemPrompt = `You are a professional career advisor who specializes in identifying technical and professional skills from experience and project descriptions. Your task is to:

    1. Analyze the provided experience and project information
    2. Identify relevant technical skills (like programming languages, frameworks, tools)
    3. Identify soft skills and domain expertise
    4. Organize skills into appropriate categories/domains
    
    IMPORTANT: 
    - Return skills in a structured format with each skill having a "name" and "domain"
    - Examples of domains: "Frontend Development", "Backend Development", "Data Science", "Project Management", "Communication", etc.
    - Be specific with skill names (e.g., "React.js" not just "JavaScript frameworks")
    - Do NOT include explanations, headers, labels, or meta-information
    - Do NOT include phrases like "Here are the skills" or "I hope this helps"`;
    
    let userPrompt = '';
    
    const experienceInfo = prompt.experiences?.map(exp => 
      `Position: ${exp.position} at ${exp.company}\nDescription: ${exp.description || 'Not provided'}`
    ).join('\n\n') || 'No experience provided';
    
    const projectInfo = prompt.projects?.map(proj => 
      `Project: ${proj.title}\nTechnologies: ${proj.technologies}\nDescription: ${proj.description || 'Not provided'}`
    ).join('\n\n') || 'No projects provided';
    
    const currentSkillsInfo = prompt.currentSkills?.map(skill => 
      `${skill.name} (${skill.domain})`
    ).join(', ') || 'No current skills provided';
    
    if (mode === 'suggest' && prompt.currentSkills && prompt.currentSkills.length > 0) {
      userPrompt = `Based on the following profile information, suggest additional skills that would complement their existing skills or fill any gaps in their skill set.
      
      Current Skills:
      ${currentSkillsInfo}
      
      Experience:
      ${experienceInfo}
      
      Projects:
      ${projectInfo}
      
      Format your response as a list of skills with their corresponding domains, like:
      - Skill Name (Domain)
      - Another Skill (Its Domain)
      
      Focus on skills that are missing from their current skill set but implied by their experience and projects.`;
    } else {
      // Generate new skills (add mode)
      userPrompt = `Based on the following profile information, identify and categorize all the technical and professional skills this person likely possesses.
      
      Experience:
      ${experienceInfo}
      
      Projects:
      ${projectInfo}
      
      ${prompt.currentSkills && prompt.currentSkills.length > 0 ? `Current Skills:\n${currentSkillsInfo}\n\nExpand on these with additional relevant skills.` : ''}
      
      Format your response as a list of skills with their corresponding domains, like:
      - Skill Name (Domain)
      - Another Skill (Its Domain)`;
    }
    
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 800,
      top_p: 0.9,
    });
    
    const result = response.choices[0]?.message?.content || '';
    
    // Parse skills from the response
    const skills = parseSkillsResponse(result);
    
    return NextResponse.json({ skills });
    
  } catch (error) {
    console.error('Error generating skills with Groq API:', error);
    return NextResponse.json(
      { error: 'Failed to generate skills. Please try again later.' },
      { status: 500 }
    );
  }
} 