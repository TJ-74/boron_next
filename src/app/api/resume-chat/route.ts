import { NextRequest, NextResponse } from 'next/server';
import type { UserProfile } from '@/app/types/profile';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function generateSystemPrompt(profile: UserProfile): string {
  const formattedExperience = profile.experiences
    ? profile.experiences.map(exp => `- ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})`).join('\n')
    : 'No experience listed';
  
  const formattedSkills = profile.skills
    ? profile.skills.map(skill => skill.name).join(', ')
    : 'No skills listed';
  
  const formattedEducation = profile.education
    ? profile.education.map(edu => `- ${edu.degree} from ${edu.school} (${edu.startDate} - ${edu.endDate || 'Present'})`).join('\n')
    : 'No education listed';

  return `You are a professional resume assistant specializing in helping users create tailored resumes. You have access to the user's profile information and can help them understand what information you need to create the perfect resume.

USER'S PROFILE SUMMARY:
Name: ${profile.name}
Title: ${profile.title || 'Not specified'}
Email: ${profile.email}

Experience:
${formattedExperience}

Skills: ${formattedSkills}

Education:
${formattedEducation}

Your role is to:
1. Help users provide job descriptions for resume tailoring
2. Ask clarifying questions about the position they're applying for
3. Guide them through the resume creation process
4. Provide helpful advice about resume optimization
5. Explain what information you need to create a great resume

IMPORTANT GUIDELINES:
- Be friendly, professional, and helpful
- Ask specific questions when you need more information
- Explain why certain information is important for resume tailoring
- Provide guidance on what makes a good job description for resume matching
- Be encouraging and supportive throughout the process
- Keep responses concise but informative

When a user provides a substantial job description (usually 100+ characters with job-specific terms like "requirements", "responsibilities", "qualifications", etc.), you should:
1. Acknowledge that you received the job description
2. Briefly explain what you'll do with it
3. Respond with: "GENERATE_RESUME:[job description]" - this is a special command that will trigger resume generation

For shorter messages or general questions, provide helpful conversational responses to guide them toward providing a complete job description.

Remember: Your goal is to help users provide the best possible job description so you can create the most targeted resume for their needs.`;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, profile } = await request.json();
    
    if (!messages || !profile) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = generateSystemPrompt(profile);
    
    const apiMessages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...messages
    ];

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to get response from AI' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: 'Invalid response from AI model' },
        { status: 500 }
      );
    }

    const aiResponse = data.choices[0].message.content;
    
    // Check if the AI wants to generate a resume
    if (aiResponse.includes('GENERATE_RESUME:')) {
      const jobDescription = aiResponse.split('GENERATE_RESUME:')[1].trim();
      return NextResponse.json({ 
        message: "Perfect! I'll analyze this job description and create a tailored resume for you. Give me a moment to process this...",
        generateResume: true,
        jobDescription: jobDescription
      });
    }
    
    return NextResponse.json({ message: aiResponse });
    
  } catch (error) {
    console.error('Error in resume chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
} 