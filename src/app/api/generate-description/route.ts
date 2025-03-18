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

export interface GenerationPrompt {
  type: 'experience' | 'project';
  position?: string;
  company?: string;
  title?: string;
  technologies?: string;
  additionalContext?: string;
  currentDescription?: string;
  mode?: 'replace' | 'enhance'; // Default is 'replace' if not specified
}

// Clean up the response to ensure we only get bullet points
const cleanupResponse = (text: string): string => {
  // Remove any introductory text
  let cleanText = text.replace(/^(here are|here's|here is|some|the|bullet points for|professional|resume|points|description|bullet).*?\n/i, '');
  
  // Remove any concluding text
  cleanText = cleanText.replace(/\n.*(hope this helps|these bullet points|let me know|feel free).*/i, '');
  
  // Get all lines that start with bullet points or numbers
  const lines = cleanText.split('\n');
  const bulletLines = lines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Remove bullet points, numbers, or other markers from the start
      return line.replace(/^[-•*\d\s.)\]]+\s*/, '');
    });
  
  // Remove any empty lines
  const nonEmptyLines = bulletLines.filter(line => line.trim().length > 0);
  
  // Remove any markdown or special formatting that might have been added
  const cleanedLines = nonEmptyLines.map(line => {
    // Remove markdown formatting like **bold** or *italic*
    return line
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic
      .replace(/__(.*?)__/g, '$1')     // Remove underline
      .replace(/~~(.*?)~~/g, '$1')     // Remove strikethrough
      .replace(/```(.*?)```/g, '$1')   // Remove code blocks
      .replace(/`(.*?)`/g, '$1');      // Remove inline code
  });
  
  // Return clean text
  return cleanedLines.join('\n');
};

export async function POST(request: Request) {
  try {
    const prompt: GenerationPrompt = await request.json();
    const mode = prompt.mode || 'replace';
    
    // Validate input
    if (prompt.type === 'experience' && (!prompt.position || !prompt.company)) {
      return NextResponse.json(
        { error: 'Missing required fields: position and company' },
        { status: 400 }
      );
    }
    
    if (prompt.type === 'project' && (!prompt.title || !prompt.technologies)) {
      return NextResponse.json(
        { error: 'Missing required fields: title and technologies' },
        { status: 400 }
      );
    }
    
    const groq = createGroqClient();
    
    let systemPrompt = `You are a professional resume writer who specializes in creating concise, 
    impactful bullet points for resumes. Your descriptions should be:
    - Achievement-oriented with quantifiable results where possible
    - Written in past tense using action verbs
    - Focused on skills and accomplishments
    - Each bullet point should be on a new line
    - Between 3-5 bullet points total
    - Each bullet point should be 1-2 lines maximum
    
    IMPORTANT: 
    - Return ONLY the bullet points with no introductory or concluding text
    - Do NOT include bullet markers, just the text for each point
    - Do NOT include examples, headers, labels, or meta-information
    - Do NOT include phrases like "Here are some bullet points" or "I hope this helps"
    - Just provide clean text, one bullet point per line`;
    
    let userPrompt = '';
    
    if (mode === 'enhance' && prompt.currentDescription) {
      if (prompt.type === 'experience') {
        userPrompt = `Improve these existing bullet points for a ${prompt.position} at ${prompt.company}:
        
        ${prompt.currentDescription}
        
        Enhance them to be more achievement-oriented with quantifiable results where possible.
        Don't completely change the points but improve their wording, impact, and professionalism.
        ${prompt.additionalContext ? 'Additional context: ' + prompt.additionalContext : ''}`;
      } else {
        userPrompt = `Improve these existing bullet points for the project "${prompt.title}" using ${prompt.technologies}:
        
        ${prompt.currentDescription}
        
        Enhance them to be more achievement-oriented with quantifiable results where possible.
        Don't completely change the points but improve their wording, impact, and professionalism.
        ${prompt.additionalContext ? 'Additional context: ' + prompt.additionalContext : ''}`;
      }
    } else {
      // Generate new content (default behavior)
      if (prompt.type === 'experience') {
        userPrompt = `Write 3-5 professional bullet points describing work as a ${prompt.position} at ${prompt.company}.
        ${prompt.additionalContext ? 'Additional context: ' + prompt.additionalContext : ''}`;
      } else {
        userPrompt = `Write 3-5 professional bullet points describing the project "${prompt.title}" that used these technologies: ${prompt.technologies}.
        ${prompt.additionalContext ? 'Additional context: ' + prompt.additionalContext : ''}`;
      }
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
      model: 'llama3-8b-8192',
      temperature: 0.7,
      max_tokens: 800,
      top_p: 0.9,
    });
    
    const result = response.choices[0]?.message?.content || '';
    
    // Clean up the response to ensure we only get bullet points
    const cleanResult = cleanupResponse(result);
    
    return NextResponse.json({ description: cleanResult });
    
  } catch (error) {
    console.error('Error generating description with Groq API:', error);
    return NextResponse.json(
      { error: 'Failed to generate description. Please try again later.' },
      { status: 500 }
    );
  }
} 