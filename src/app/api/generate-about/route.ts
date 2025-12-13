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

// Clean up the response to ensure we only get clean text
const cleanupResponse = (text: string): string => {
  // Remove any introductory text like "Here's your about section:"
  let cleanText = text.replace(/^(here's|here is|here are|your|the|an|about|section|profile|summary).*?\n/i, '');
  
  // Remove any concluding text
  cleanText = cleanText.replace(/\n.*(hope this helps|let me know|feel free).*/i, '');
  
  // Remove any markdown or special formatting that might have been added
  cleanText = cleanText
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1')     // Remove italic
    .replace(/__(.*?)__/g, '$1')     // Remove underline
    .replace(/~~(.*?)~~/g, '$1')     // Remove strikethrough
    .replace(/```(.*?)```/g, '$1')   // Remove code blocks
    .replace(/`(.*?)`/g, '$1');      // Remove inline code
  
  return cleanText.trim();
};

export async function POST(request: Request) {
  try {
    const prompt: AboutGenerationPrompt = await request.json();
    const mode = prompt.mode || 'replace';
    
    const groq = createGroqClient();
    
    let systemPrompt = `You are a professional resume writer who specializes in creating concise, 
    impactful "About Me" sections for professional profiles and resumes. Your writing should be:
    - Professional but personable
    - Concise (150-250 words)
    - Highlight key strengths and career achievements
    - Written in first person
    - Conversational but polished

    IMPORTANT: 
    - Return ONLY the "About Me" text with no additional commentary
    - Do NOT include headers, labels, or meta-information
    - Do NOT include phrases like "Here is your About Me section" or "I hope this helps"
    - Do NOT use quotation marks around the text`;
    
    let userPrompt = '';
    const experienceInfo = prompt.experiences?.map(exp => 
      `- ${exp.position} at ${exp.company}${exp.description ? `: ${exp.description.split('\n')[0]}` : ''}`
    ).join('\n') || 'No experience provided';
    
    const skillsInfo = prompt.skills?.join(', ') || 'No skills provided';
    
    const educationInfo = prompt.education?.map(edu => 
      `- ${edu.degree} from ${edu.school}`
    ).join('\n') || 'No education provided';
    
    if (mode === 'enhance' && prompt.currentAbout) {
      userPrompt = `Please enhance this existing "About Me" section:

      "${prompt.currentAbout}"
      
      Make it more professional and impactful while maintaining the original tone and key points.
      You can reference these additional details about me:
      
      Work Experience:
      ${experienceInfo}
      
      Skills:
      ${skillsInfo}
      
      Education:
      ${educationInfo}
      
      Improve the existing text, but don't completely change its essence.`;
    } else {
      // Generate new content (default behavior)
      userPrompt = `Write a professional "About Me" section based on these details:
      
      Work Experience:
      ${experienceInfo}
      
      Skills:
      ${skillsInfo}
      
      Education:
      ${educationInfo}
      
      Make it sound professional yet conversational, written in first person.`;
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
    
    // Clean up the response
    const cleanResult = cleanupResponse(result);
    
    return NextResponse.json({ about: cleanResult });
    
  } catch (error) {
    console.error('Error generating about section with Groq API:', error);
    return NextResponse.json(
      { error: 'Failed to generate about section. Please try again later.' },
      { status: 500 }
    );
  }
} 