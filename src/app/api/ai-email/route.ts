import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import BraveSearchService, { CompanyResearch, PersonResearch } from '@/app/lib/braveSearchService';

interface CandidateProfile {
  name: string;
  email: string;
  about?: string;
  title?: string;
  phone?: string;
  location?: string;
  experiences?: {
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description?: string;
    technologies?: string[];
  }[];
  education?: {
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate?: string;
    gpa?: string;
    description?: string;
  }[];
  skills?: {
    name: string;
    category?: string;
    proficiency?: string;
  }[];
  projects?: {
    name: string;
    description: string;
    technologies?: string[];
    githubUrl?: string;
    liveUrl?: string;
    startDate?: string;
    endDate?: string;
  }[];
  certificates?: {
    name: string;
    issuer: string;
    dateIssued: string;
    expirationDate?: string;
    credentialId?: string;
    url?: string;
  }[];
  linkedinUrl?: string;
}

interface EmailGenerationRequest {
  jobTitle: string;
  companyName: string;
  recruiterName: string;
  jobDescription?: string;
  candidateName?: string;
  emailType: 'application' | 'follow-up' | 'thank-you' | 'inquiry' | 'withdrawal';
  tone: 'professional' | 'friendly' | 'casual';
  additionalContext?: string;
  candidateProfile?: CandidateProfile;
}

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Initialize Brave Search service
const braveSearch = new BraveSearchService();

// Helper function to format research data for LLM
function formatResearchForLLM(companyResearch: CompanyResearch, recruiterResearch: PersonResearch): string {
  let researchSummary = `
**🔍 LIVE RESEARCH DATA** (Automatically gathered from Brave Search):

**COMPANY INTELLIGENCE: ${companyResearch.companyName}**
${companyResearch.description ? `Company Overview: ${companyResearch.description}` : ''}
${companyResearch.website ? `Website: ${companyResearch.website}` : ''}

**Key Company Information:**
${companyResearch.keyInfo.length > 0 ? companyResearch.keyInfo.map(info => `• ${info}`).join('\n') : '• No additional company information found'}

**Recent Company News & Updates:**
${companyResearch.recentNews.length > 0 ? companyResearch.recentNews.map(news => `• ${news}`).join('\n') : '• No recent news found'}

**RECRUITER INTELLIGENCE: ${recruiterResearch.name}**
${recruiterResearch.title ? `Title: ${recruiterResearch.title}` : ''}
${recruiterResearch.linkedIn ? `LinkedIn: ${recruiterResearch.linkedIn}` : ''}

**Recruiter Background:**
${recruiterResearch.background.length > 0 ? recruiterResearch.background.map(bg => `• ${bg}`).join('\n') : '• No recruiter background information found'}

**RESEARCH INSIGHTS FOR EMAIL PERSONALIZATION:**
Use this research to:
1. Reference specific company initiatives, values, or recent news
2. Show knowledge of the company's current direction and challenges  
3. Demonstrate genuine interest based on real company information
4. Connect your background to specific company needs or projects mentioned
5. Reference the recruiter's background or role if relevant information is available
`;

  return researchSummary;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailGenerationRequest = await request.json();
    
    const {
      jobTitle,
      companyName,
      recruiterName,
      jobDescription,
      candidateName = "Candidate",
      emailType,
      tone,
      additionalContext,
      candidateProfile
    } = body;

    // Validate required fields
    if (!jobTitle || !companyName || !recruiterName || !emailType) {
      return NextResponse.json(
        { error: 'Missing required fields: jobTitle, companyName, recruiterName, emailType' },
        { status: 400 }
      );
    }

    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      );
    }

    // Generate email content using Groq LLM
    const emailContent = await generateEmailWithGroq({
      jobTitle,
      companyName,
      recruiterName,
      jobDescription,
      candidateName,
      emailType,
      tone,
      additionalContext,
      candidateProfile
    });

    console.log('🔍 Final email content structure:', {
      hasSubject: !!emailContent.subject,
      hasBody: !!emailContent.body,
      hasSuggestedActions: !!emailContent.suggestedActions,
      hasResearchData: !!emailContent.researchData,
      researchDataKeys: emailContent.researchData ? Object.keys(emailContent.researchData) : 'none'
    });

    return NextResponse.json({
      subject: emailContent.subject,
      body: emailContent.body,
      suggestedActions: emailContent.suggestedActions,
      researchData: emailContent.researchData
    });

  } catch (error) {
    console.error('AI Email Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate email content' },
      { status: 500 }
    );
  }
}

async function generateEmailWithGroq(params: EmailGenerationRequest) {
  const {
    jobTitle,
    companyName,
    recruiterName,
    jobDescription,
    candidateName,
    emailType,
    tone,
    additionalContext,
    candidateProfile
  } = params;

  // Perform automatic research on company and recruiter
  console.log(`🔍 Starting research for ${companyName} and ${recruiterName}...`);
  const research = await braveSearch.researchBoth(companyName, recruiterName);
  console.log(`✅ Research completed for ${companyName}`);
  console.log('📊 Research data:', JSON.stringify(research, null, 2));

  // Create research summary for the LLM
  const researchSummary = formatResearchForLLM(research.company, research.recruiter);

  // Create a comprehensive profile summary for the LLM
  const profileSummary = candidateProfile ? `
**CANDIDATE PROFILE**:
Name: ${candidateProfile.name}
${candidateProfile.title ? `Current Title: ${candidateProfile.title}` : ''}
${candidateProfile.location ? `Location: ${candidateProfile.location}` : ''}
${candidateProfile.email ? `Email: ${candidateProfile.email}` : ''}
${candidateProfile.phone ? `Phone: ${candidateProfile.phone}` : ''}
${candidateProfile.linkedinUrl ? `LinkedIn: ${candidateProfile.linkedinUrl}` : ''}
${candidateProfile.about ? `About: ${candidateProfile.about}` : ''}

**WORK EXPERIENCE**:
${candidateProfile.experiences?.length ? candidateProfile.experiences.map(exp => `
• ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})
  ${exp.description ? `- ${exp.description}` : ''}
  ${exp.technologies?.length ? `- Technologies: ${Array.isArray(exp.technologies) ? exp.technologies.join(', ') : exp.technologies}` : ''}
`).join('') : '- No experience data provided'}

**EDUCATION**:
${candidateProfile.education?.length ? candidateProfile.education.map(edu => `
• ${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution} (${edu.startDate} - ${edu.endDate || 'Present'})
  ${edu.gpa ? `- GPA: ${edu.gpa}` : ''}
  ${edu.description ? `- ${edu.description}` : ''}
`).join('') : '- No education data provided'}

**TECHNICAL SKILLS**:
${candidateProfile.skills?.length ? candidateProfile.skills.map(skill => `
• ${skill.name}${skill.category ? ` (${skill.category})` : ''}${skill.proficiency ? ` - ${skill.proficiency}` : ''}
`).join('') : '- No skills data provided'}

**NOTABLE PROJECTS**:
${candidateProfile.projects?.length ? candidateProfile.projects.map(project => `
• ${project.name}: ${project.description}
  ${project.technologies?.length ? `- Technologies: ${Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies}` : ''}
  ${project.githubUrl ? `- GitHub: ${project.githubUrl}` : ''}
  ${project.liveUrl ? `- Live Demo: ${project.liveUrl}` : ''}
`).join('') : '- No projects data provided'}

**CERTIFICATIONS**:
${candidateProfile.certificates?.length ? candidateProfile.certificates.map(cert => `
• ${cert.name} from ${cert.issuer} (${cert.dateIssued})
  ${cert.credentialId ? `- Credential ID: ${cert.credentialId}` : ''}
`).join('') : '- No certifications provided'}
` : '**CANDIDATE PROFILE**: Limited profile information available';

  // Create a comprehensive prompt for the LLM
  const systemPrompt = `You are an expert career advisor and professional email writer specializing in crafting unique, compelling job application emails. Your goal is to create personalized, engaging emails that feel authentic and conversational while showcasing why the candidate is perfect for the role.

CORE PHILOSOPHY:
- AVOID generic corporate language and templates
- Create unique, memorable emails that stand out
- Follow AIDA framework: Attention, Interest, Desire, Action
- Make emails feel like genuine human conversations
- Use storytelling to connect experiences to job requirements
- Show personality while maintaining professionalism
- Focus on specific achievements and real examples

AIDA FRAMEWORK APPLICATION:
🔴 ATTENTION: Open with engaging, personalized hook (not "Dear Sir/Madam")
🟡 INTEREST: Share compelling background/experience that relates to the role
🟢 DESIRE: Demonstrate specific value and unique fit for the position
🔵 ACTION: Clear, confident call-to-action for next steps

EMAIL TONE REQUIREMENTS:
- NEVER use phrases like "I am writing to express my interest" or "I hope this email finds you well"
- START conversationally: "Hi [Name], I came across your [job posting/company]..." 
- Use authentic, natural language that reflects the candidate's personality
- Include specific details from their background in storytelling format
- Show genuine enthusiasm without sounding desperate
- End with confident, action-oriented language

Always respond with a JSON object containing:
- subject: Creative, attention-grabbing subject line (avoid "Application for...")
- body: Complete email body with natural flow and personality
- suggestedActions: Array of 3 strategic follow-up actions`;

  const userPrompt = `Create a UNIQUE, conversational ${emailType} email that follows AIDA framework and avoids all generic corporate language. Make it feel like a genuine human conversation that showcases this candidate's perfect fit for the role.

**JOB OPPORTUNITY**:
- Position: ${jobTitle}
- Company: ${companyName}
- Recruiter: ${recruiterName}
- Job Description: ${jobDescription || 'Not provided'}

${researchSummary}

${profileSummary}

**EMAIL SPECIFICATIONS**:
- Type: ${emailType}
- Tone: ${tone}
- Additional Context: ${additionalContext || 'None provided'}

**CRITICAL REQUIREMENTS - AIDA FRAMEWORK**:

🔴 **ATTENTION (Opening Hook)**:
- Start with natural, conversational opener: "Hi ${recruiterName}, I came across [specific reference]..."
- NO generic greetings like "Dear Sir/Madam" or "I hope this email finds you well"
- Reference something specific about the company/role if possible
- Make it feel personal and authentic

🟡 **INTEREST (Compelling Background)**:
- Tell a brief story from their experience that relates to the role
- Use specific examples from their work/projects/achievements
- Show how they discovered the opportunity or company
- Make it engaging and memorable

🟢 **DESIRE (Value Proposition)**:
- Connect their unique skills/experience directly to job needs
- Highlight 2-3 most relevant qualifications with specific examples
- Show what makes them different from other candidates
- Demonstrate understanding of company/role challenges

🔵 **ACTION (Confident Next Steps)**:
- Clear, confident call-to-action
- Show availability and enthusiasm
- Suggest specific next steps (call, meeting, portfolio review)
- End with energy and confidence

**TONE-SPECIFIC REQUIREMENTS FOR ${tone}**:
${getToneGuidelines(tone)}

**FORBIDDEN PHRASES** (NEVER USE):
- "I am writing to express my interest"
- "I hope this email finds you well" 
- "I would like to apply for"
- "Please find my resume attached"
- "I look forward to hearing from you"
- "Thank you for your time and consideration"

**REQUIRED ELEMENTS**:
1. Natural conversation starter with ${recruiterName}'s name
2. Specific reference to how they found the opportunity
3. 2-3 concrete examples from their background with storytelling
4. Clear demonstration of opportunity-seeking mindset
5. Humble, grateful closing with resume and LinkedIn mention
6. Contact information naturally integrated

**REQUIRED CLOSING SECTION**:
End the email with a humble, grateful tone similar to:
"I would be so grateful if you looked at my resume and let me know if I'm fit for this job. I'm attaching my resume and LinkedIn profile${candidateProfile?.linkedinUrl ? ` : ${candidateProfile.linkedinUrl}` : ' (available upon request)'}.

Thank you so much for your time."

${candidateProfile?.email || candidateProfile?.phone ? `Include contact: ${candidateProfile?.email || ''} ${candidateProfile?.phone || ''}` : ''}

**OUTPUT FORMAT**:
Respond only with valid JSON:
{
  "subject": "Creative, attention-grabbing subject (no 'Application for...' or 'Re:')",
  "body": "Complete conversational email with natural flow and \\n for line breaks",
  "suggestedActions": ["Strategic follow-up action 1", "Strategic follow-up action 2", "Strategic follow-up action 3"]
}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8, // Slightly higher for more creative, personalized content
      max_tokens: 2000, // Increased for more detailed emails
      response_format: { type: "json_object" }
    });

    const response = chatCompletion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from Groq API');
    }

    const emailData = JSON.parse(response);
    
    // Validate the response structure
    if (!emailData.subject || !emailData.body || !emailData.suggestedActions) {
      throw new Error('Invalid response format from Groq API');
    }

    return {
      subject: emailData.subject,
      body: emailData.body,
      suggestedActions: Array.isArray(emailData.suggestedActions) ? emailData.suggestedActions : [],
      researchData: research
    };

  } catch (error) {
    console.error('Groq API Error:', error);
    
    // Fallback to a enhanced template if Groq fails
    const fallbackResult = generateFallbackEmail(params);
    return {
      ...fallbackResult,
      researchData: research
    };
  }
}

function getEmailTypeInstructions(emailType: string): string {
  const instructions = {
    application: `APPLICATION EMAIL - "I Found This Amazing Opportunity":
    - Open: "Hi [Name], I came across the [job title] role at [company] and couldn't help but get excited..."
    - Share WHY this specific role/company caught your attention
    - Tell a brief story about relevant experience that directly connects
    - Show you've researched the company (mention recent news, values, projects)
    - Position yourself as actively exploring opportunities, not desperately job hunting
    - Include 2-3 specific examples of relevant work/achievements
    - End with confidence: "I'd love to explore this further - are you free for a quick chat this week?"`,

    'follow-up': `FOLLOW-UP EMAIL - "Still Excited About This":
    - Reference your previous email/application with specific detail
    - Add NEW value: recent achievement, relevant project, or industry insight
    - Show continued research about the company (mention something new you discovered)
    - Reiterate 1-2 key qualifications with fresh examples
    - Demonstrate persistent interest without being pushy
    - Include: "I know you're busy, but I'm still very interested in [specific aspect] of this role"
    - End: "Any updates on the timeline? Happy to provide additional info if helpful!"`,

    'thank-you': `THANK-YOU EMAIL - "Great Conversation!":
    - Reference specific moments from the interview/conversation
    - Share a follow-up thought or resource related to your discussion
    - Reinforce 1-2 key points that align with what you learned about their needs
    - Address any concerns or questions that came up during the interview
    - Show you were actively listening and thinking about the role
    - Include: "Our conversation about [specific topic] really confirmed this is the right fit"
    - End: "Excited about the next steps - when should I expect to hear about [specific next step]?"`,

    inquiry: `INQUIRY EMAIL - "Exploring Opportunities":
    - Start: "Hi [Name], I've been following [company] and am impressed by [specific recent achievement/project]"
    - Explain you're actively exploring opportunities and why this company interests you
    - Share relevant background that would be valuable to them (even if no current opening)
    - Ask about potential future opportunities or advice about the industry
    - Show you're not just mass-emailing but specifically interested in this company
    - Include: "Even if nothing's available now, I'd love to stay on your radar"
    - End: "Would you have 15 minutes for a brief conversation about opportunities in the near future?"`,

    withdrawal: `WITHDRAWAL EMAIL - "Difficult Decision":
    - Be direct but gracious about your decision
    - Share the specific reason (if appropriate) - new opportunity, timing, etc.
    - Reinforce positive aspects of your experience with them
    - Express genuine appreciation for their time and consideration
    - Keep the door open for future opportunities
    - Include: "This was a difficult decision because I was genuinely excited about [specific aspect]"
    - End: "I hope our paths cross again in the future - please keep me in mind for future opportunities"`
  };
  
  return instructions[emailType as keyof typeof instructions] || "Create a unique, conversational email that shows genuine interest and authentic personality while demonstrating clear value proposition and opportunity-seeking mindset.";
}

function getToneGuidelines(tone: string): string {
  const guidelines = {
    professional: `PROFESSIONAL TONE - Sophisticated but Warm:
    - Use confident, articulate language without being stiff
    - Start: "Hi [Name], I came across [specific detail] and wanted to reach out..."
    - Show expertise through specific examples, not buzzwords and latest education and experience
    - Maintain warmth while demonstrating competence
    - Use industry-appropriate terminology naturally
    - End with humble gratitude similar to this: "I would be so grateful if you looked at my resume and let me know if I'm fit for this job. I'm attaching my resume and LinkedIn profile. Thank you so much for your time."
    - Personality: Competent professional who is humble and appreciative`,

    friendly: `FRIENDLY TONE - Warm and Approachable:
    - Use conversational, warm language that shows personality
    - Start: "Hi [Name]! I was browsing [platform/company page] and your [specific role] caught my attention..."
    - Share brief personal stories add latest education and experience insights that connect to the role/company
    - Use contractions and natural speech patterns
    - Show genuine enthusiasm without being overly casual
    - Include light personal touches that feel authentic
    - End with sincere gratitude similar to this: "I would be so grateful if you looked at my resume and let me know if I'm fit for this job. I'm attaching my resume and LinkedIn profile. Thank you so much for your time."
    - Personality: Approachable expert who is grateful and humble`,

    casual: `CASUAL TONE - Authentic and Conversational:
    - Write like you're talking to a colleague or friend in the industry
    - Start: "Hey [Name], I stumbled across [company/role] and thought 'this looks like my kind of challenge!'"
    - Use informal language, contractions, and even appropriate emojis sparingly
    - Share personal anecdotes or authentic insights about your journey and latest education and experience
    - Be direct about what you want and what you offer
    - Show personality and humor where appropriate
    - End with genuine appreciation similar to this: "I would be so grateful if you looked at my resume and let me know if I'm fit for this job. I'm attaching my resume and LinkedIn profile. Thank you so much for your time."
    - Personality: Confident, authentic person who brings both skills and humility`
  };
  
  return guidelines[tone as keyof typeof guidelines] || "Use natural, conversational language that reflects genuine interest and authentic personality while maintaining appropriate professionalism and ending with humble gratitude.";
}

function generateFallbackEmail(params: EmailGenerationRequest): { subject: string; body: string; suggestedActions: string[] } {
  const { jobTitle, companyName, recruiterName, candidateName, emailType, candidateProfile } = params;
  
  // Create more personalized content based on available profile data
  const skills = candidateProfile?.skills?.slice(0, 3).map(s => s.name).join(', ') || 'relevant technical skills';
  const latestExperience = candidateProfile?.experiences?.[0];
  const experienceText = latestExperience 
    ? `Currently working as ${latestExperience.position} at ${latestExperience.company}, where I've been ${latestExperience.description ? latestExperience.description.slice(0, 80) + '...' : 'developing my expertise in this field'}.`
    : 'gaining valuable experience in my current role.';
  
  const projectText = candidateProfile?.projects?.length 
    ? `I recently worked on ${candidateProfile.projects[0].name}, which ${candidateProfile.projects[0].description ? candidateProfile.projects[0].description.slice(0, 60) + '...' : 'was an interesting challenge'}.`
    : '';

  // Create conversational subject lines
  const subjects = {
    application: `${candidateName} here - excited about the ${jobTitle} role!`,
    'follow-up': `Following up on ${jobTitle} - still very interested!`,
    'thank-you': `Thanks for the great conversation about ${jobTitle}`,
    inquiry: `${candidateName} - exploring opportunities at ${companyName}`,
    withdrawal: `Update on ${jobTitle} application`
  };

  // Create conversational email bodies
  const emailBodies = {
    application: `Hi ${recruiterName},

I came across the ${jobTitle} position at ${companyName} and couldn't help but get excited - this looks like exactly the kind of challenge I'm looking for!

${experienceText} My background includes experience with ${skills}, which seems to align perfectly with what you're looking for.

${projectText ? projectText + '\n\n' : ''}I would be so grateful if you looked at my resume and let me know if I'm fit for this job. I'm attaching my resume and LinkedIn profile${candidateProfile?.linkedinUrl ? ` : ${candidateProfile.linkedinUrl}` : ' (available upon request)'}.

Thank you so much for your time.

Best regards,
${candidateName}
${candidateProfile?.email ? candidateProfile.email : ''}
${candidateProfile?.phone ? candidateProfile.phone : ''}`,

    'follow-up': `Hi ${recruiterName},

Just wanted to circle back on the ${jobTitle} role we discussed. I'm still very excited about the opportunity and wanted to see if there were any updates.

Since we last spoke, I've been thinking about how my experience with ${skills} could really contribute to ${companyName}'s goals. ${projectText}

I would be so grateful if you looked at my resume and let me know if I'm fit for this job. I'm attaching my resume and LinkedIn profile${candidateProfile?.linkedinUrl ? ` : ${candidateProfile.linkedinUrl}` : ' (available upon request)'}.

Thank you so much for your time.

Best regards,
${candidateName}`,

    inquiry: `Hi ${recruiterName},

I've been following ${companyName} and am really impressed by what you're building. I'm currently exploring new opportunities and wondered if you might have any openings that could be a good fit.

${experienceText} I work primarily with ${skills} and am particularly interested in ${jobTitle ? `roles like ${jobTitle}` : 'opportunities to grow in this space'}.

I would be so grateful if you looked at my resume and let me know if I'm fit for any current or future opportunities. I'm attaching my resume and LinkedIn profile${candidateProfile?.linkedinUrl ? ` : ${candidateProfile.linkedinUrl}` : ' (available upon request)'}.

Thank you so much for your time.

Best regards,
${candidateName}`,

    'thank-you': `Hi ${recruiterName},

Thanks for taking the time to chat about the ${jobTitle} role yesterday - I really enjoyed our conversation!

Our discussion about ${companyName}'s direction really confirmed this would be an exciting opportunity. I'm particularly excited about the potential to contribute my ${skills} experience to the team.

I would be so grateful if you looked at my resume and let me know about the next steps. I'm attaching my resume and LinkedIn profile${candidateProfile?.linkedinUrl ? ` : ${candidateProfile.linkedinUrl}` : ' (available upon request)'}.

Thank you so much for your time.

Best regards,
${candidateName}`,

    withdrawal: `Hi ${recruiterName},

I wanted to reach out with an update on the ${jobTitle} position. After much consideration, I've decided to pursue another opportunity that aligns more closely with my current career goals.

This was honestly a difficult decision because I was genuinely excited about ${companyName} and the work you're doing. I really appreciated your time and the insights you shared about the role.

I hope our paths cross again in the future - please keep me in mind for other opportunities!

Thank you so much for your time.

Best wishes,
${candidateName}`
  };
  
  return {
    subject: subjects[emailType as keyof typeof subjects] || `${candidateName} - interested in opportunities at ${companyName}`,
    body: emailBodies[emailType as keyof typeof emailBodies] || emailBodies.application,
    suggestedActions: [
      'Follow up within 5-7 days if no response',
      'Connect with recruiter on LinkedIn with personalized note',
      'Research company news and developments for follow-up topics'
    ]
  };
} 