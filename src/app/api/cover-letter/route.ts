import { NextRequest, NextResponse } from 'next/server';
import type { UserProfile } from '@/app/types/profile';

function generateSystemPrompt(profile: UserProfile, jobDescription: string): string {
  // Format profile information
  const formattedName = profile.name;
  const formattedTitle = profile.title || '';
  const formattedSummary = profile.about || '';
  
  // Format education
  const formattedEducation = profile.education 
    ? profile.education.map(edu => 
        `- ${edu.degree} from ${edu.school} (${edu.startDate}-${edu.endDate || 'Present'})`
      ).join('\n')
    : '';
  
  // Format experience
  const formattedExperience = profile.experiences
    ? profile.experiences.map(exp => {
        return `- ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'}):\n  * ${exp.description}`;
      }).join('\n')
    : '';
  
  // Format skills
  const formattedSkills = profile.skills
    ? profile.skills.map(skill => skill.name).join(', ')
    : '';
  
  // Format projects
  const formattedProjects = profile.projects
    ? profile.projects.map(project => {
        return `- ${project.title}:\n  * ${project.description}\n  * Technologies: ${project.technologies}`;
      }).join('\n')
    : '';

  // Clean job description (remove extra whitespace)
  const cleanedJobDescription = jobDescription.replace(/\s+/g, ' ').trim();

  // Create the system prompt
  return `You are a professional cover letter writer. Your task is to create a tailored, compelling cover letter based on the job description and candidate profile provided.

CANDIDATE PROFILE:
Name: ${formattedName}
Title: ${formattedTitle}
Summary: ${formattedSummary}

Education:
${formattedEducation}

Experience:
${formattedExperience}

Skills: ${formattedSkills}

Projects:
${formattedProjects}

JOB DESCRIPTION:
${cleanedJobDescription}

INSTRUCTIONS FOR COVER LETTER CREATION:
1. Format and Content:
   - Include the date at the top (current date)
   - Include the candidate's name and contact information at the top right
   - Use proper business letter formatting with appropriate salutation and closing
   - Length should be approximately 350-450 words in 3-4 paragraphs
   - Do not include recipient's address (leave this for the candidate to add)
   - Use "Hiring Manager" or "Hiring Team" for the salutation if no specific name is provided

2. Structure:
   - Opening paragraph: Introduce the candidate, state the position applied for, and include a compelling hook that shows enthusiasm
   - Body paragraphs: Highlight 2-3 specific achievements and skills from the candidate's profile that directly relate to the job requirements
   - Closing paragraph: Reiterate interest, thank the reader, and include a call to action for an interview

3. Writing Style:
   - Professional but conversational tone (avoid overly formal language)
   - Be specific and results-oriented, using metrics when available from the profile
   - Avoid clichés and generic statements
   - Use active voice and strong action verbs
   - Demonstrate genuine interest in the company and position

4. Personalization:
   - Reference specific requirements from the job description and how the candidate meets them
   - If the job description mentions company values or culture, address how the candidate aligns with these
   - Demonstrate understanding of the industry and role

5. Special Instructions:
   - Include only truthful information that is present in the candidate's profile
   - Do not fabricate experience, skills, or achievements
   - Emphasize transferable skills if the candidate is changing careers or industries
   - Be concise and impactful - every sentence should serve a purpose

The final cover letter should be polished, compelling, and tailored specifically to the job, highlighting the candidate's most relevant qualifications and genuine interest in the position.`;
}

export async function POST(request: NextRequest) {
  try {
    const { profile, jobDescription } = await request.json();
    
    if (!profile || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Groq API endpoint
    const apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Create system prompt from profile and job description
    const systemPrompt = generateSystemPrompt(profile, jobDescription);
    
    // Prepare messages for Groq API
    const apiMessages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Please generate a professional cover letter for me based on my profile and this job description: "${jobDescription.substring(0, 100)}..."`
      }
    ];

    // Call Groq API
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Using Llama 3.3 70B model from Groq
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to generate cover letter' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Clean up the generated cover letter text to remove any preamble
    let coverLetterText = data.choices[0].message.content;
    
    // Remove any "Here is a professional cover letter..." lines
    coverLetterText = coverLetterText
      .replace(/^(here is|here's|i've created|i have created|below is|attached is|this is) (a|the|your) (professional|personalized|tailored|customized)? ?cover letter[^]*?:\n*/i, '')
      .replace(/^cover letter[^]*?:\n*/i, '')
      .trim();
    
    return NextResponse.json({ 
      coverLetter: coverLetterText 
    });
    
  } catch (error) {
    console.error('Error generating cover letter:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 