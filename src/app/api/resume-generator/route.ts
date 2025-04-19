import { NextRequest, NextResponse } from 'next/server';
import type { UserProfile, Education, Certificate } from '@/app/types/profile';

function generateSystemPrompt(profile: UserProfile, jobDescription: string): string {
  // Format only necessary information
  const formattedSummary = profile.about || '';
  
  // Format experience with all bullet points
  const formattedExperience = profile.experiences
    ? profile.experiences.map(exp => {
        const bulletPoints = exp.description
          .split('\n')
          .filter(point => point.trim())
          .map(point => `    * ${point.trim()}`);
        
        return `- ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'}):\n${bulletPoints.join('\n')}`;
      }).join('\n')
    : '';
  
  // Format skills
  const formattedSkills = profile.skills
    ? profile.skills.map(skill => skill.name).join(', ')
    : '';
  
  // Format projects with all bullet points
  const formattedProjects = profile.projects
    ? profile.projects.map(project => {
        const bulletPoints = project.description
          .split('\n')
          .filter(point => point.trim())
          .map(point => `    * ${point.trim()}`);
        
        return `- ${project.title} (${project.startDate} - ${project.endDate || 'Present'}):\n${bulletPoints.join('\n')}`;
      }).join('\n')
    : '';

  return `You are a professional resume writer specializing in ATS optimization. Your task is to create highly targeted resume content that maximizes ATS matching scores while remaining readable and impactful for human reviewers.

CANDIDATE INFORMATION:
Summary: ${formattedSummary}

Experience:
${formattedExperience}

Skills: ${formattedSkills}

Projects:
${formattedProjects}

JOB DESCRIPTION:
${jobDescription}

INSTRUCTIONS:
1. First, analyze the job description to extract:
   - Required technical skills and tools
   - Key responsibilities and duties
   - Industry-specific terminology
   - Required years of experience
   - Soft skills and competencies
   - Project management methodologies
   - Performance metrics and KPIs
   - Team collaboration requirements

2. For each experience and project:
   IMPORTANT: You must process and rewrite ALL bullet points from the original description
   For EACH bullet point:
   - Review the original content carefully
   - Identify the core achievement or responsibility
   - Match it with relevant job requirements
   - Rewrite using the following structure:
     a) Start with a strong action verb
     b) Include specific technical skills from the job description
     c) Add measurable results where applicable
     d) Incorporate exact keywords from the job posting
   - Maintain the original meaning while enhancing relevance
   - Do not skip or omit any significant information
   - Ensure each point demonstrates a unique skill or achievement

3. Bullet Point Transformation Rules:
   - Keep ALL relevant information from the original points
   - Transform EACH point to match job requirements
   - Use this formula for each point: Action Verb + Skill/Tool from JD + Task + Quantified Result
   - Include specific numbers, percentages, or metrics whenever present
   - Maintain technical accuracy while incorporating job-specific terminology
   - Preserve project scope and impact details
   - Add context that matches job requirements

4. ATS Optimization Rules:
   - Use exact skill names as they appear in the job posting
   - Include both full terms and acronyms
   - Match job posting terminology exactly
   - Use standard section headings
   - Keep bullets clear and concise
   - Maintain proper formatting

5. Complete Processing Requirements:
   - Process EVERY bullet point in the original content
   - Ensure no information is lost during transformation
   - Maintain chronological significance
   - Preserve technical complexity
   - Keep project scope details
   - Retain team size and collaboration information
   - Include all relevant metrics and results

Return the resume content in the following JSON format:

{
  "summary": "highly targeted summary using key job description terminology",
  "skills": {
    "domain (from job requirements)": ["skill1 (exact match from JD)", "skill2 (exact match from JD)"]
  },
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "location": "location",
      "startDate": "date",
      "endDate": "date",
      "highlights": [
        // Transform and include ALL original bullet points
        // Do not skip any points
        // Each point should follow the structure:
        "Implemented [technology from JD] to [specific task from original] resulting in [quantified result]",
        "Developed [feature type from JD] using [required skill] improving [metric] by [number]",
        "Managed [project type from JD] leading [team size] team to deliver [outcome]",
        // Continue with ALL remaining points...
      ]
    }
  ],
  "projects": [
    {
      "title": "project name",
      "startDate": "date",
      "endDate": "date",
      "highlights": [
        // Transform and include ALL original bullet points
        // Do not skip any points
        // Each point should follow the structure:
        "Built [specific feature] using [required technology from JD] achieving [measurable outcome]",
        "Architected [system type from JD] implementing [required skill] resulting in [metric]",
        "Led development of [project component] utilizing [methodology from JD] delivering [result]",
        // Continue with ALL remaining points...
      ]
    }
  ]
}

IMPORTANT:
- Process and transform ALL bullet points from the original content
- Do not skip or omit any points
- Maintain all relevant technical details and achievements
- Use exact terminology from the job description
- Include specific technical skills mentioned in the job posting
- Quantify results and achievements whenever possible
- Focus on recent and relevant accomplishments
- Maintain ATS-friendly formatting
- Use standard bullet point structure
- Keep content truthful and accurate
- Format dates as "MMM YYYY"
- Use "Present" for current positions

Remember: Your task is to enhance and optimize ALL existing content, not to reduce or simplify it. Every piece of relevant information from the original description must be preserved and improved.`;
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

    const apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = generateSystemPrompt(profile, jobDescription);
    
    const apiMessages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: 'Generate the tailored resume content in JSON format based on my profile and the job description provided. Return ONLY the JSON object, no markdown formatting or additional text.'
      }
    ];

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: apiMessages,
        temperature: 0.5,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate resume', details: errorData },
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
    
    // Get the generated resume content and parse it as JSON
    let resumeContent = data.choices[0].message.content;
    
    try {
      // First try to parse it directly
      const aiGeneratedContent = JSON.parse(resumeContent);
      
      // Filter included education and certificates
      const includedEducation = profile.education ? profile.education.filter((edu: Education) => edu.includeInResume !== false) : [];
      const includedCertificates = profile.certificates ? profile.certificates.filter((cert: Certificate) => cert.includeInResume !== false) : [];
      
      // Combine AI-generated content with profile data
      const resumeData = {
        header: {
          name: profile.name,
          title: profile.title || '',
          contact: {
            email: profile.email,
            phone: profile.phone || '',
            linkedin: profile.linkedinUrl || '',
            github: profile.githubUrl || '',
            portfolio: profile.portfolioUrl || ''
          }
        },
        ...aiGeneratedContent,
        education: includedEducation.map((edu: Education) => ({
          degree: edu.degree,
          school: edu.school,
          location: '',  // Add location if available in your schema
          startDate: edu.startDate,
          endDate: edu.endDate,
          gpa: edu.cgpa
        })),
        certificates: includedCertificates.map((cert: Certificate) => ({
          name: cert.name,
          issuer: cert.issuer,
          date: cert.issueDate,
          credentialUrl: cert.credentialUrl
        }))
      };
      
      return NextResponse.json({ resumeData });
    } catch (firstError) {
      console.error('First parse attempt failed:', firstError);
      
      try {
        // Clean up the content and try again
    resumeContent = resumeContent
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, '')
          .replace(/^\s*{\s*/, '{')
          .replace(/\s*}\s*$/, '}')
      .trim();
    
        const aiGeneratedContent = JSON.parse(resumeContent);
        
        // Filter included education and certificates
        const includedEducation = profile.education ? profile.education.filter((edu: Education) => edu.includeInResume !== false) : [];
        const includedCertificates = profile.certificates ? profile.certificates.filter((cert: Certificate) => cert.includeInResume !== false) : [];
        
        // Combine AI-generated content with profile data
        const resumeData = {
          header: {
            name: profile.name,
            title: profile.title || '',
            contact: {
              email: profile.email,
              phone: profile.phone || '',
              linkedin: profile.linkedinUrl || '',
              github: profile.githubUrl || '',
              portfolio: profile.portfolioUrl || ''
            }
          },
          ...aiGeneratedContent,
          education: includedEducation.map((edu: Education) => ({
            degree: edu.degree,
            school: edu.school,
            location: '',  // Add location if available in your schema
            startDate: edu.startDate,
            endDate: edu.endDate,
            gpa: edu.cgpa
          })),
          certificates: includedCertificates.map((cert: Certificate) => ({
            name: cert.name,
            issuer: cert.issuer,
            date: cert.issueDate,
            credentialUrl: cert.credentialUrl
          }))
        };
        
        return NextResponse.json({ resumeData });
      } catch (secondError) {
        console.error('Second parse attempt failed:', secondError);
        console.error('Raw content:', resumeContent);
        return NextResponse.json(
          { error: 'Failed to parse resume data', content: resumeContent },
          { status: 500 }
        );
      }
    }
    
  } catch (error) {
    console.error('Error generating resume:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 