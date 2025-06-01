import { NextRequest, NextResponse } from 'next/server';
import type { UserProfile } from '@/app/types/profile';

interface SectionRequest {
  section: 'experience' | 'projects' | 'skills' | 'summary' | 'all';
  profile: UserProfile;
  jobDescription?: string;
  jobAnalysis?: any;
  matchAnalysis?: any;
  currentResume?: any;
  userRequest?: string; // For specific user instructions about changes
}

// Helper function to ensure consistent date formatting
function formatDateForResume(dateString?: string | null): string {
  if (!dateString || dateString === '' || dateString === null || dateString === undefined) {
    return 'Present';
  }
  
  // If it's already 'Present', return as is
  if (dateString.toLowerCase() === 'present') {
    return 'Present';
  }
  
  try {
    // Handle YYYY-MM format
    if (dateString.includes('-') && dateString.length <= 7) {
      const [year, month] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    }
    
    // Handle full date strings
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original if can't parse
    }
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  } catch (e) {
    return dateString || 'Present';
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Section Coordinator started');
    
    // Verify API key is loaded
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('❌ GROQ_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }
    console.log('✅ API key verified');

    const { section, profile, jobDescription, jobAnalysis, matchAnalysis, userRequest }: SectionRequest = await request.json();
    
    if (!section || !profile) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log(`🎯 Section-specific request: ${section.toUpperCase()}`);

    let finalJobAnalysis = jobAnalysis;
    let finalMatchAnalysis = matchAnalysis;

    // Generate job analysis if not provided
    if (!finalJobAnalysis && jobDescription) {
      console.log('📊 Generating job analysis...');
      finalJobAnalysis = await callAnalyzer(jobDescription);
    }

    // Generate match analysis if not provided
    if (!finalMatchAnalysis && finalJobAnalysis) {
      console.log('🎯 Generating match analysis...');
      console.log('Profile summary:', {
        name: profile.name,
        experiencesCount: profile.experiences?.length || 0,
        skillsCount: profile.skills?.length || 0,
        projectsCount: profile.projects?.length || 0
      });
      console.log('Job analysis keys:', Object.keys(finalJobAnalysis));
      
      try {
        finalMatchAnalysis = await callMatcher(profile, finalJobAnalysis);
        console.log('✅ Match analysis completed successfully');
      } catch (matchError) {
        console.error('❌ Match analysis failed:', matchError);
        throw matchError;
      }
    }

    let result: any = {};

    switch (section) {
      case 'experience':
        console.log('💼 Optimizing Experience section...');
        result.experience = await callExperienceOptimizer(profile, finalJobAnalysis, finalMatchAnalysis, userRequest);
        break;

      case 'projects':
        console.log('🚀 Optimizing Projects section...');
        result.projects = await callProjectsOptimizer(profile, finalJobAnalysis, finalMatchAnalysis, userRequest);
        break;

      case 'skills':
        console.log('⚡ Optimizing Skills section...');
        result.skills = await callSkillsOptimizer(profile, finalJobAnalysis, finalMatchAnalysis, userRequest);
        break;

      case 'summary':
        console.log('📝 Generating Summary section...');
        result.summary = await callSummaryGenerator(profile, finalJobAnalysis, finalMatchAnalysis, userRequest);
        break;

      case 'all':
        console.log('🔄 Generating complete resume...');
        result = await generateCompleteResume(profile, finalJobAnalysis, finalMatchAnalysis);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid section specified' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      section,
      result,
      jobAnalysis: finalJobAnalysis,
      matchAnalysis: finalMatchAnalysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in section coordinator:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process section request', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Individual section optimizers
async function callExperienceOptimizer(profile: UserProfile, jobAnalysis: any, matchAnalysis: any, userRequest?: string) {
  const apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) throw new Error('API key not configured');

  const systemPrompt = `You are an Experience Optimization Agent. Your specialized task is to rewrite and optimize work experience descriptions to maximize ATS scoring and human impact for a specific job.

${userRequest ? `SPECIFIC USER REQUEST: "${userRequest}" - Address this request while optimizing the experience section.` : ''}

YOUR MISSION:
Transform each experience entry to highlight relevant skills, achievements, and responsibilities that align with the target job requirements.

OPTIMIZATION STRATEGY:
1. KEYWORD INTEGRATION: Seamlessly incorporate exact keywords from job description
2. QUANTIFICATION: Add or enhance metrics, percentages, and measurable outcomes
3. ACTION VERBS: Use strong, industry-appropriate action verbs
4. RELEVANCE RANKING: Prioritize most relevant achievements first
5. ATS OPTIMIZATION: Ensure optimal keyword density without stuffing
6. IMPACT DEMONSTRATION: Show clear business value and results

RELEVANCE FILTERING:
- Only include experiences with strong relevance to the job (score ≥30%)
- Sort experiences by relevance score (highest first)
- Filter out irrelevant or outdated experience

Return optimized experience in this JSON format:

{
  "optimizedExperience": [
    {
      "title": "job title",
      "company": "company name", 
      "location": "location",
      "startDate": "start date",
      "endDate": "end date",
      "highlights": [
        "Optimized bullet point with keywords and metrics",
        "Achievement emphasizing relevant skills",
        "Result showing measurable impact"
      ],
      "relevanceScore": 95
    }
  ],
  "optimizationNotes": {
    "experiencesIncluded": 3,
    "experiencesFiltered": 1,
    "keywordsAdded": ["keyword1", "keyword2"],
    "overallRelevance": 92
  }
}`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Optimize the work experience for this profile:

USER EXPERIENCE:
${JSON.stringify(profile.experiences, null, 2)}

JOB REQUIREMENTS:
${JSON.stringify(jobAnalysis, null, 2)}

MATCHING INSIGHTS:
${JSON.stringify(matchAnalysis, null, 2)}

${userRequest ? `\nSPECIFIC REQUEST: ${userRequest}` : ''}

Rewrite all relevant experience entries to maximize impact for this specific job.`
        }
      ],
      temperature: 0.4,
      max_tokens: 6000,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) throw new Error('Experience agent failed');
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function callProjectsOptimizer(profile: UserProfile, jobAnalysis: any, matchAnalysis: any, userRequest?: string) {
  const apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) throw new Error('API key not configured');

  const systemPrompt = `You are a Projects Optimization Agent. Your specialized task is to select, filter, and optimize project descriptions to maximize relevance and impact for a specific job application.

${userRequest ? `SPECIFIC USER REQUEST: "${userRequest}" - Address this request while optimizing the projects section.` : ''}

YOUR MISSION:
Identify the most relevant projects and rewrite their descriptions to showcase technical skills, problem-solving abilities, and achievements that align with job requirements.

OPTIMIZATION STRATEGY:
1. RELEVANCE FILTERING: Only include projects that demonstrate job-relevant skills
2. TECHNICAL EMPHASIS: Highlight technologies mentioned in job requirements
3. IMPACT DEMONSTRATION: Show measurable outcomes and business value
4. PROBLEM-SOLVING: Emphasize challenges overcome and solutions implemented
5. KEYWORD INTEGRATION: Naturally incorporate job description keywords
6. ACHIEVEMENT FOCUS: Quantify results where possible

Return optimized projects in this JSON format:

{
  "optimizedProjects": [
    {
      "title": "project title",
      "startDate": "start date",
      "endDate": "end date", 
      "highlights": [
        "Optimized bullet point with technologies and impact",
        "Achievement emphasizing problem-solving",
        "Result showing measurable impact"
      ],
      "relevanceScore": 95
    }
  ],
  "optimizationNotes": {
    "projectsIncluded": 3,
    "projectsFiltered": 2,
    "keywordsAdded": ["keyword1", "keyword2"],
    "overallRelevance": 92
  }
}`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Optimize the projects section for this profile:

USER PROJECTS:
${JSON.stringify(profile.projects, null, 2)}

JOB REQUIREMENTS:
${JSON.stringify(jobAnalysis, null, 2)}

MATCHING INSIGHTS:
${JSON.stringify(matchAnalysis, null, 2)}

${userRequest ? `\nSPECIFIC REQUEST: ${userRequest}` : ''}

Select the most relevant projects and optimize their descriptions to maximize impact for this specific job.`
        }
      ],
      temperature: 0.4,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) throw new Error('Projects agent failed');
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function callSkillsOptimizer(profile: UserProfile, jobAnalysis: any, matchAnalysis: any, userRequest?: string) {
  const apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) throw new Error('API key not configured');

  const systemPrompt = `You are a Skills Optimization Agent. Your specialized task is to organize and optimize the skills section of a resume to maximize ATS scoring and human impact for a specific job.

${userRequest ? `SPECIFIC USER REQUEST: "${userRequest}" - Address this request while optimizing the skills section.` : ''}

YOUR MISSION:
Transform the user's skills into strategically organized categories that align perfectly with job requirements.

OPTIMIZATION STRATEGY:
1. PRIORITY MATCHING: Place job-required skills first in each category
2. STRATEGIC GROUPING: Group skills by domain/technology stack
3. ATS KEYWORDS: Include exact keyword matches from job description
4. SKILL HIERARCHY: Order from most relevant to least relevant
5. COMPLETENESS: Include both technical and soft skills as appropriate
6. INDUSTRY ALIGNMENT: Use industry-standard terminology

Return optimized skills in this JSON format:

{
  "optimizedSkills": {
    "Programming Languages": ["skill1", "skill2", "skill3"],
    "Frontend Technologies": ["skill1", "skill2"],
    "Backend Technologies": ["skill1", "skill2"],
    "Databases & Storage": ["skill1", "skill2"],
    "Cloud & DevOps": ["skill1", "skill2"],
    "Tools & Frameworks": ["skill1", "skill2"],
    "Soft Skills": ["skill1", "skill2"]
  },
  "optimizationNotes": {
    "prioritizedSkills": ["skill1", "skill2"],
    "addedKeywords": ["keyword1", "keyword2"],
    "removedIrrelevant": ["skill1", "skill2"],
    "relevanceScore": 95
  }
}`;

  const userSkills = profile.skills?.map((skill: any) => skill.name) || [];

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Optimize the skills section for this profile:

USER SKILLS:
${JSON.stringify(userSkills, null, 2)}

JOB REQUIREMENTS:
${JSON.stringify(jobAnalysis, null, 2)}

MATCHING INSIGHTS:
${JSON.stringify(matchAnalysis, null, 2)}

${userRequest ? `\nSPECIFIC REQUEST: ${userRequest}` : ''}

Create a strategically organized skills section that maximizes relevance and impact for this specific job.`
        }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) throw new Error('Skills agent failed');
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function callSummaryGenerator(profile: UserProfile, jobAnalysis: any, matchAnalysis: any, userRequest?: string) {
  const apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) throw new Error('API key not configured');

  const systemPrompt = `You are a Summary Generation Agent. Create a powerful professional summary that captures the candidate's value proposition for the specific job.

${userRequest ? `SPECIFIC USER REQUEST: "${userRequest}" - Address this request while generating the summary.` : ''}

SUMMARY REQUIREMENTS:
- 2-3 impactful sentences
- Include years of experience (if applicable)
- Highlight top 3-4 relevant skills from job requirements
- Show unique value proposition
- Use industry-appropriate terminology
- Be specific and quantifiable where possible

Return in JSON format:
{
  "summary": "Compelling 2-3 sentence professional summary",
  "optimizationNotes": {
    "keySkillsHighlighted": ["skill1", "skill2"],
    "industryTermsUsed": ["term1", "term2"],
    "valueProposition": "unique selling point"
  }
}`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Generate optimized summary:

PROFILE: ${JSON.stringify(profile, null, 2)}
JOB ANALYSIS: ${JSON.stringify(jobAnalysis, null, 2)}
MATCH ANALYSIS: ${JSON.stringify(matchAnalysis, null, 2)}

${userRequest ? `\nSPECIFIC REQUEST: ${userRequest}` : ''}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) throw new Error('Summary agent failed');
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function generateCompleteResume(profile: UserProfile, jobAnalysis: any, matchAnalysis: any) {
  console.log('🔄 Generating all sections...');
  
  const [experience, projects, skills, summary] = await Promise.all([
    callExperienceOptimizer(profile, jobAnalysis, matchAnalysis),
    callProjectsOptimizer(profile, jobAnalysis, matchAnalysis),
    callSkillsOptimizer(profile, jobAnalysis, matchAnalysis),
    callSummaryGenerator(profile, jobAnalysis, matchAnalysis)
  ]);

  // Apply consistent date formatting to experience entries
  const formattedExperience = experience.optimizedExperience?.map((exp: any) => ({
    ...exp,
    startDate: formatDateForResume(exp.startDate),
    endDate: formatDateForResume(exp.endDate)
  })) || [];

  // Apply consistent date formatting to project entries
  const formattedProjects = projects.optimizedProjects?.map((project: any) => ({
    ...project,
    startDate: formatDateForResume(project.startDate),
    endDate: formatDateForResume(project.endDate)
  })) || [];

  return {
    experience: formattedExperience,
    projects: formattedProjects,
    skills: skills.optimizedSkills,
    summary: summary.summary
  };
}

// Helper functions (using direct calls to avoid URL issues)
async function callAnalyzer(jobDescription: string) {
  const apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) throw new Error('API key not configured');

  const systemPrompt = `You are a Job Description Analyzer Agent. Your specialized task is to thoroughly analyze job descriptions and extract all relevant information that will be used by other agents to optimize resumes.

ANALYSIS REQUIREMENTS:
1. Extract technical skills and tools (programming languages, frameworks, databases, etc.)
2. Identify soft skills and competencies
3. Find industry-specific terminology and buzzwords
4. Determine experience level requirements
5. Extract key responsibilities and duties
6. Identify project types and methodologies
7. Find performance metrics and KPIs mentioned
8. Determine team collaboration requirements
9. Extract education and certification requirements
10. Identify company culture indicators

Return your analysis in the following JSON format:

{
  "technicalSkills": {
    "required": ["skill1", "skill2"],
    "preferred": ["skill3", "skill4"],
    "niceToHave": ["skill5", "skill6"]
  },
  "softSkills": ["communication", "leadership", "problem-solving"],
  "experienceLevel": {
    "years": "3-5",
    "level": "mid-senior",
    "specificRequirements": ["requirement1", "requirement2"]
  },
  "keyResponsibilities": ["responsibility1", "responsibility2"],
  "industryTerms": ["term1", "term2"],
  "projectTypes": ["web applications", "microservices"],
  "methodologies": ["agile", "scrum"],
  "metrics": ["performance improvements", "user engagement"],
  "teamRequirements": ["cross-functional collaboration", "mentoring"],
  "education": ["bachelor's degree", "computer science"],
  "certifications": ["aws", "pmp"],
  "companyValues": ["innovation", "customer-first"],
  "atsKeywords": ["keyword1", "keyword2"],
  "priority": {
    "mustHave": ["critical skill1", "critical skill2"],
    "shouldHave": ["important skill1", "important skill2"],
    "couldHave": ["optional skill1", "optional skill2"]
  }
}`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Analyze this job description thoroughly:\n\n${jobDescription}`
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) throw new Error('Analyzer agent failed');
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function callMatcher(profile: UserProfile, jobAnalysis: any) {
  const apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in environment variables');
  }

  try {
    const formattedProfile = {
      name: profile.name,
      title: profile.title,
      skills: profile.skills?.map((skill: any) => skill.name) || [],
      experience: profile.experiences?.map((exp: any) => ({
        position: exp.position,
        company: exp.company,
        duration: `${exp.startDate} - ${exp.endDate || 'Present'}`,
        description: exp.description
      })) || [],
      education: profile.education?.map((edu: any) => ({
        degree: edu.degree,
        school: edu.school,
        duration: `${edu.startDate} - ${edu.endDate || 'Present'}`
      })) || [],
      projects: profile.projects?.map((proj: any) => ({
        title: proj.title,
        duration: `${proj.startDate} - ${proj.endDate || 'Present'}`,
        description: proj.description
      })) || []
    };

    const systemPrompt = `You are a Profile Matcher Agent. Your specialized task is to analyze a user's profile against job requirements and identify strengths, gaps, and optimization opportunities.

Return your analysis in the following JSON format:

{
  "matchScore": 85,
  "strengths": {
    "directMatches": ["skill1", "skill2"],
    "experienceAlignments": ["responsibility1", "responsibility2"],
    "projectSimilarities": ["project type1", "project type2"],
    "educationFit": ["degree relevance", "certification match"]
  },
  "gaps": {
    "criticalMissing": ["must-have skill1", "must-have skill2"],
    "preferredMissing": ["preferred skill1", "preferred skill2"],
    "experienceGaps": ["gap area1", "gap area2"]
  },
  "optimizationOpportunities": {
    "emphasizeMore": ["area to highlight1", "area to highlight2"],
    "reframe": ["experience to reframe1", "experience to reframe2"],
    "quantify": ["area needing metrics1", "area needing metrics2"]
  },
  "competitiveAdvantages": ["advantage1", "advantage2"],
  "recommendations": {
    "priorityFocus": ["what to emphasize most"],
    "skillsToHighlight": ["skill1", "skill2"],
    "experienceToEmphasize": ["experience area1", "experience area2"]
  }
}`;

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Analyze this profile against the job requirements:

USER PROFILE:
${JSON.stringify(formattedProfile, null, 2)}

JOB ANALYSIS:
${JSON.stringify(jobAnalysis, null, 2)}

Provide a comprehensive matching analysis.`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Matcher API error response:', errorText);
      throw new Error(`Matcher agent failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid API response structure:', data);
      throw new Error('Invalid response structure from matcher agent');
    }

    try {
      return JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse matcher response:', data.choices[0].message.content);
      console.error('Parse error:', parseError);
      
      // Return a fallback response if JSON parsing fails
      return {
        matchScore: 70,
        strengths: {
          directMatches: [],
          experienceAlignments: [],
          projectSimilarities: [],
          educationFit: []
        },
        gaps: {
          criticalMissing: [],
          preferredMissing: [],
          experienceGaps: []
        },
        optimizationOpportunities: {
          emphasizeMore: [],
          reframe: [],
          quantify: []
        },
        competitiveAdvantages: [],
        recommendations: {
          priorityFocus: [],
          skillsToHighlight: [],
          experienceToEmphasize: []
        }
      };
    }
  } catch (error) {
    console.error('Error in callMatcher:', error);
    throw new Error(`Matcher agent failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 