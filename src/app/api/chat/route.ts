import { NextRequest, NextResponse } from 'next/server';
import type { UserProfile } from '@/app/types/profile';

// Function to generate a system prompt based on user profile data
function generateSystemPrompt(profile: UserProfile): string {
  return `You are Boron Bot, an AI assistant that helps users understand their resume information.
You have the following information about the user's profile:

NAME: ${profile.name}
TITLE: ${profile.title || 'Not specified'}
ABOUT: ${profile.about || 'Not specified'}

EDUCATION: ${profile.education.length} entries
${profile.education.map((edu, i) => 
  `${i+1}. ${edu.degree} from ${edu.school} (${edu.startDate} - ${edu.endDate}) GPA: ${edu.cgpa}`
).join('\n')}

EXPERIENCE: ${profile.experiences.length} entries
${profile.experiences.map((exp, i) => 
  `${i+1}. ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate}) in ${exp.location}`
).join('\n')}

SKILLS: ${profile.skills.length} entries
${Object.entries(profile.skills.reduce((acc: Record<string, string[]>, skill) => {
  if (!acc[skill.domain]) acc[skill.domain] = [];
  acc[skill.domain].push(skill.name);
  return acc;
}, {})).map(([domain, skills]) => `${domain}: ${skills.join(', ')}`).join('\n')}

PROJECTS: ${profile.projects.length} entries
${profile.projects.map((proj, i) => 
  `${i+1}. ${proj.title} (${proj.technologies}) (${proj.startDate} - ${proj.endDate})`
).join('\n')}

When responding to user queries, focus on providing information about their profile.
Keep responses professional, concise, and relevant to resume/profile information.
DO NOT share private contact information like email or phone number.
Use a friendly, helpful tone and format responses clearly with line breaks where appropriate.`;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, profile } = await request.json();
    
    if (!profile || !messages || !messages.length) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Groq API endpoint
    const apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      // Fallback to local response if no API key is available
      return NextResponse.json({
        message: generateFallbackResponse(messages[messages.length - 1].content, profile)
      });
    }

    // Create system prompt from profile data
    const systemPrompt = generateSystemPrompt(profile);
    
    // Prepare messages for Groq API
    const apiMessages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Call Groq API
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // Using Llama 3 model from Groq
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      // Fall back to local response generator if API fails
      return NextResponse.json({
        message: generateFallbackResponse(messages[messages.length - 1].content, profile)
      });
    }

    const data = await response.json();
    return NextResponse.json({ message: data.choices[0].message.content });
    
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Fallback response generator (copied from the original ChatBot component)
function generateFallbackResponse(userInput: string, profile: UserProfile): string {
  const input = userInput.toLowerCase();

  // Check for greetings
  if (
    input.includes('hello') ||
    input.includes('hi') ||
    input.includes('hey') ||
    input === 'yo'
  ) {
    return `Hello again! How can I help you with your profile information?`;
  }

  // Experience related queries
  if (
    input.includes('experience') ||
    input.includes('work') ||
    input.includes('job') ||
    input.includes('career')
  ) {
    if (profile.experiences.length === 0) {
      return `You don't have any work experience listed in your profile yet.`;
    }

    let response = `You have ${profile.experiences.length} work experience entries on your profile:\n\n`;
    
    profile.experiences.forEach((exp, index) => {
      response += `${index + 1}. ${exp.position} at ${exp.company}`;
      response += `\n   ${formatDate(exp.startDate)} - ${formatDate(exp.endDate)}`;
      response += `\n   ${exp.location}\n\n`;
    });

    return response;
  }

  // Education queries
  if (
    input.includes('education') ||
    input.includes('school') ||
    input.includes('college') ||
    input.includes('university') ||
    input.includes('degree')
  ) {
    if (profile.education.length === 0) {
      return `You don't have any education entries listed in your profile yet.`;
    }

    let response = `You have ${profile.education.length} education entries on your profile:\n\n`;
    
    profile.education.forEach((edu, index) => {
      response += `${index + 1}. ${edu.degree} from ${edu.school}`;
      response += `\n   ${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`;
      if (edu.cgpa) response += `\n   GPA: ${edu.cgpa}`;
      response += '\n\n';
    });

    return response;
  }

  // Skills queries
  if (
    input.includes('skill') ||
    input.includes('abilities') ||
    input.includes('what can i do') ||
    input.includes('what am i good at')
  ) {
    if (profile.skills.length === 0) {
      return `You don't have any skills listed in your profile yet.`;
    }

    // Group skills by domain
    const skillsByDomain: Record<string, string[]> = {};
    profile.skills.forEach(skill => {
      if (!skillsByDomain[skill.domain]) {
        skillsByDomain[skill.domain] = [];
      }
      skillsByDomain[skill.domain].push(skill.name);
    });

    let response = `You have ${profile.skills.length} skills across ${Object.keys(skillsByDomain).length} domains:\n\n`;
    
    Object.entries(skillsByDomain).forEach(([domain, skills]) => {
      response += `• ${domain}: ${skills.join(', ')}\n`;
    });

    return response;
  }

  // Default response if no patterns match
  return `I'm not sure how to answer that question about your profile. You can ask me about your experience, education, skills, projects, or summary. Type "help" for more options.`;
}

// Helper function to format dates nicely
function formatDate(dateString?: string): string {
  if (!dateString) return 'Present';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (e) {
    return dateString;
  }
} 