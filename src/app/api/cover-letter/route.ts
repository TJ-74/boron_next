import { NextRequest, NextResponse } from 'next/server';
import type { UserProfile } from '@/app/types/profile';
import { MODEL_CONFIG, makeApiCall, isGeminiModel, convertToGeminiFormat, parseGeminiResponse } from '../config/models';

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

CRITICAL FORMATTING REQUIREMENTS - YOU MUST FOLLOW THIS EXACT STRUCTURE:

Your output MUST use double line breaks (blank lines) between each section. Format exactly like this example:

[Date]
Month Day, Year

Dear Hiring Manager,

[First paragraph - 2-3 sentences introducing the candidate and position]

[Second paragraph - 4-6 sentences highlighting achievements and skills]

[Third paragraph - 4-6 sentences with more specific examples]

[Closing paragraph - 2-3 sentences reiterating interest]

Sincerely,
[Candidate Name]

INSTRUCTIONS FOR COVER LETTER CREATION:
1. Format and Content (CRITICAL - MUST FIT ON ONE PAGE):
   - Start with the date on its own line (current date in format: Month Day, Year)
   - Add TWO blank lines after the date
   - Do NOT include contact info (email, phone, location) at the top
   - Use "Dear Hiring Manager," or "Dear Hiring Team," for the salutation on its own line
   - Add ONE blank line after salutation
   - Length MUST be approximately 250-350 words in 3-4 body paragraphs to fit on one page
   - Do not include recipient's address (leave this for the candidate to add)
   - End with "Sincerely," or "Best regards," on its own line, followed by a blank line, then the candidate's name

2. Structure (CONCISE - ONE PAGE ONLY):
   - Opening paragraph (2-3 sentences): Introduce the candidate, state the position applied for, and include a compelling hook
   - Body paragraphs (2 paragraphs, 4-6 sentences each): Highlight 2-3 specific achievements and skills that directly relate to the job requirements
   - Closing paragraph (2-3 sentences): Reiterate interest, thank the reader, and include a call to action for an interview
   - Use ONE blank line between each paragraph

3. Writing Style:
   - Professional but conversational tone (avoid overly formal language)
   - Be specific and results-oriented, using metrics when available from the profile
   - Avoid clichés and generic statements
   - Use active voice and strong action verbs
   - Demonstrate genuine interest in the company and position
   - Keep sentences concise and impactful

4. Personalization:
   - Reference specific requirements from the job description and how the candidate meets them
   - If the job description mentions company values or culture, address how the candidate aligns with these
   - Demonstrate understanding of the industry and role

5. Special Instructions:
   - Include only truthful information that is present in the candidate's profile
   - Do not fabricate experience, skills, or achievements
   - Emphasize transferable skills if the candidate is changing careers or industries
   - Be concise and impactful - every sentence should serve a purpose
   - MUST fit on one page - prioritize brevity and impact over length

6. Output Format (CRITICAL - MUST FOLLOW):
   - Return plain text cover letter
   - Use **bold** syntax for important keywords, skills, metrics, and role names
   - Do NOT include any preamble like "Here is your cover letter:" or similar
   - Use blank lines (double line breaks) to separate ALL sections:
     * After date
     * After salutation
     * Between EVERY body paragraph
     * Before closing
   - Write in plain English prose, not as structured data
   - Example structure:
     
     December 18, 2024
     
     Dear Hiring Manager,
     
     I am writing to express my strong interest in the **Software Engineer** position at your company...
     
     In my previous role at Tech Corp, I successfully led a team of 5 engineers...
     
     I am excited about the opportunity to bring my expertise to your team...
     
     Sincerely,
     John Doe

The final cover letter should be polished, compelling, tailored specifically to the job, in plain text format with proper blank line separation, MUST fit on a single page, and use **bold** for emphasis.`;
}

export async function POST(request: NextRequest) {
  try {
    const { profile, resumeData, jobDescription } = await request.json();
    
    // Use either profile or convert resumeData to profile format
    let userProfile = profile;
    
    if (!userProfile && resumeData) {
      // Convert resumeData to profile format
      userProfile = {
        name: resumeData.header?.name || '',
        title: resumeData.header?.title || '',
        email: resumeData.header?.contact?.email || '',
        phone: resumeData.header?.contact?.phone || '',
        about: resumeData.summary || '',
        education: resumeData.education || [],
        experiences: resumeData.experience?.map((exp: any) => ({
          position: exp.title,
          company: exp.company,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.endDate,
          description: exp.highlights?.join('\n') || ''
        })) || [],
        skills: [],
        projects: resumeData.projects || []
      };
    }
    
    if (!userProfile || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create system prompt from profile and job description
    const systemPrompt = generateSystemPrompt(userProfile, jobDescription);
    
    // Using Llama 3.3 70B for reliable text generation
    // This model is better for plain text output without JSON formatting
    const model = 'llama-3.3-70b-versatile';
    
    // User content
    const userContent = `Please generate a professional cover letter for me based on my profile and this job description. 

CRITICAL OUTPUT REQUIREMENTS:
- Write in PLAIN TEXT only - no JSON, no markdown, no code blocks
- Use blank lines (double line breaks) to separate ALL sections and paragraphs
- Write complete sentences and paragraphs, not bullet points or structured data
- Include: Date, Salutation, 3-4 Body Paragraphs, Closing, Signature
- DO NOT INCLUDE contact info (email, phone, location) at the top
- Start writing the cover letter immediately - no preamble text`;

    // Call API using makeApiCall utility
    let coverLetterText: string;
    try {
      coverLetterText = await makeApiCall(
        model,
        systemPrompt,
        userContent,
        {
          temperature: 0.7,
          maxTokens: 1500, // Increased to ensure full cover letter generation
          responseFormat: 'text'
        }
      );
    } catch (error: any) {
      console.error('Error calling API:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to generate cover letter' },
        { status: 500 }
      );
    }
    
    if (!coverLetterText || typeof coverLetterText !== 'string') {
      return NextResponse.json(
        { error: 'Invalid response from API' },
        { status: 500 }
      );
    }
    
    // Log raw output for debugging
    console.log('Raw cover letter length:', coverLetterText.length);
    console.log('Raw cover letter preview:', coverLetterText.substring(0, 200));
    
    // Remove any "Here is a professional cover letter..." lines
    coverLetterText = coverLetterText
      .replace(/^(here is|here's|i've created|i have created|below is|attached is|this is) (a|the|your) (professional|personalized|tailored|customized)? ?cover letter[^]*?:\n*/i, '')
      .replace(/^cover letter[^]*?:\n*/i, '')
      .replace(/^#\s*.*?\n+/gm, '') // Remove markdown headings
      .trim();
    
    // Normalize line breaks
    coverLetterText = coverLetterText
      .replace(/\r\n/g, '\n')  // Normalize Windows line breaks
      .replace(/\r/g, '\n');    // Normalize Mac line breaks
    
    // Simple approach: Split by blank lines and convert each to a paragraph
    const paragraphs = coverLetterText
      .split(/\n\n+/)  // Split by one or more blank lines
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);
    
    console.log('Number of paragraphs found:', paragraphs.length);
    
    // Convert each paragraph to HTML
    let htmlParts: string[] = [];
    
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i];
      const lines = para.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0);
      
      // Check if this is contact info (contains email, phone, or multiple short lines)
      const hasEmail = lines.some((line: string) => line.includes('@'));
      const hasPhone = lines.some((line: string) => /\(\d{3}\)\s*\d{3}[-\s]?\d{4}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(line));
      const isContactInfo = (hasEmail || hasPhone) && lines.length > 1 && lines.length <= 5;
      
      // Check if this is a closing with signature (e.g., "Sincerely,\nJohn Doe")
      const isClosingWithSignature = lines.length === 2 && 
        /^(Sincerely|Best regards|Yours sincerely|Regards|Respectfully),?$/i.test(lines[0]);
      
      let cleanPara: string;
      
      // Preserve line breaks for contact info and closing with signature
      if (isContactInfo || isClosingWithSignature) {
        cleanPara = lines.join('<br>');
      } else {
        // Join lines with spaces for regular paragraphs
        cleanPara = lines.join(' ');
      }
      
      // Determine spacing based on position and content
      let marginBottom = '0.75em';
      let marginTop = '0';
      
      const firstLine = lines[0] || '';
      
      // Check if it's a salutation
      if (/^Dear\s+/i.test(firstLine)) {
        marginBottom = '1em';
      }
      // Check if it's a closing
      else if (/^(Sincerely|Best regards|Yours sincerely|Regards|Respectfully),?\s*/i.test(firstLine)) {
        marginTop = '1.5em';
        marginBottom = '0.5em';
      }
      // Check if it's a date
      else if (/^(January|February|March|April|May|June|July|August|September|October|November|December)/i.test(firstLine) || /^\d{1,2}[\s\/\-,]+\d{4}/.test(firstLine)) {
        marginBottom = '0.5em';
      }
      // Check if it's contact info
      else if (isContactInfo) {
        marginBottom = '1em';
      }
      
      // Convert bold markdown (**text**) to HTML strong tags
      const formattedPara = cleanPara.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      htmlParts.push(`<p style="color: #111827; margin-top: ${marginTop}; margin-bottom: ${marginBottom}; text-align: left; line-height: 1.5;">${formattedPara}</p>`);
    }
    
    console.log('Number of HTML parts generated:', htmlParts.length);
    
    const htmlCoverLetter = `
      <div style="max-width: 100%; margin: 0 auto; padding: 0;">
        ${htmlParts.join('\n')}
      </div>
    `;
    
    return NextResponse.json({ 
      coverLetter: htmlCoverLetter 
    });
    
  } catch (error) {
    console.error('Error generating cover letter:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 