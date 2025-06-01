import { NextRequest, NextResponse } from 'next/server';
import type { UserProfile, Education, Certificate } from '@/app/types/profile';

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
    const { profile, jobDescription } = await request.json();
    
    if (!profile || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('🚀 Starting Multi-Agent Resume Generation...');

    // Step 1: Analyze Job Description
    console.log('📊 Step 1: Analyzing job description...');
    const jobAnalysis = await callAnalyzer(jobDescription);
    console.log('✅ Job analysis complete');

    // Step 2: Match Profile to Job Requirements
    console.log('🎯 Step 2: Matching profile to requirements...');
    const matchAnalysis = await callMatcher(profile, jobAnalysis);
    console.log('✅ Profile matching complete');

    // Step 3: Optimize Experience Descriptions
    console.log('💼 Step 3: Optimizing experience descriptions...');
    const experienceOptimization = await callExperienceOptimizer(profile, jobAnalysis, matchAnalysis);
    console.log('✅ Experience optimization complete');

    // Step 4: Generate Summary and Final Assembly
    console.log('📝 Step 4: Generating summary and assembling final resume...');
    const summaryAndSkillsResponse = await generateSummaryAndSkills(
      profile, 
      jobAnalysis, 
      matchAnalysis
    );

    // Step 5: Assemble Final Resume
    console.log('🔧 Step 5: Assembling final resume...');
    const finalResume = assembleResume(
      profile,
      jobAnalysis,
      matchAnalysis,
      experienceOptimization,
      summaryAndSkillsResponse
    );

    console.log('🎉 Multi-Agent Resume Generation Complete!');

    return NextResponse.json({ 
      resumeData: finalResume,
      agentInsights: {
        jobAnalysis,
        matchAnalysis,
        experienceOptimization,
        summaryAndSkills: summaryAndSkillsResponse,
        processingSteps: [
          'Job Description Analysis',
          'Profile Matching',
          'Experience Optimization', 
          'Summary Generation',
          'Final Assembly'
        ]
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in coordinator agent:', error);
    return NextResponse.json(
      { 
        error: 'Failed to coordinate resume generation', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function generateSummaryAndSkills(profile: UserProfile, jobAnalysis: any, matchAnalysis: any) {
  const apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  const apiKey = process.env.GROQ_API_KEY;

  const systemPrompt = `You are a Summary and Skills Optimization Agent. Create a powerful professional summary and organize skills strategically for maximum ATS and human impact.

SUMMARY REQUIREMENTS:
- 2-3 impactful sentences
- Include years of experience (if applicable)
- Highlight top 3-4 relevant skills from job requirements
- Show unique value proposition
- Use industry-appropriate terminology
- Be specific and quantifiable where possible

SKILLS ORGANIZATION:
- Group by relevance to job requirements
- Prioritize "must-have" skills first
- Include exact keyword matches from job description
- Balance technical and soft skills
- Ensure ATS optimization

Return in JSON format:

{
  "summary": "Compelling 2-3 sentence professional summary",
  "skills": {
    "Technical Skills": ["skill1", "skill2", "skill3"],
    "Programming Languages": ["lang1", "lang2"],
    "Frameworks & Tools": ["tool1", "tool2"],
    "Soft Skills": ["skill1", "skill2"]
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
          content: `Generate optimized summary and skills:

PROFILE: ${JSON.stringify(profile, null, 2)}
JOB ANALYSIS: ${JSON.stringify(jobAnalysis, null, 2)}
MATCH ANALYSIS: ${JSON.stringify(matchAnalysis, null, 2)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  
  if (!data.choices?.[0]?.message?.content) {
    console.error('Invalid response from summary generation:', data);
    throw new Error('Invalid response from summary generation agent');
  }
  
  return JSON.parse(data.choices[0].message.content);
}

function assembleResume(
  profile: UserProfile,
  jobAnalysis: any,
  matchAnalysis: any,
  experienceOptimization: any,
  summaryAndSkills: any
) {
  // Filter included education and certificates
  const includedEducation = profile.education ? 
    profile.education.filter((edu: Education) => edu.includeInResume !== false) : [];
  const includedCertificates = profile.certificates ? 
    profile.certificates.filter((cert: Certificate) => cert.includeInResume !== false) : [];

  // Filter relevant experiences based on job requirements
  const relevantExperiences = filterRelevantExperiences(
    profile.experiences || [], 
    jobAnalysis, 
    matchAnalysis
  );

  // Filter relevant projects based on job requirements
  const relevantProjects = filterRelevantProjects(
    profile.projects || [], 
    jobAnalysis, 
    matchAnalysis
  );

  // Use optimized experience if available, otherwise use filtered relevant experiences
  const finalExperiences = experienceOptimization?.optimizedExperience?.map((exp: any) => ({
    ...exp,
    startDate: formatDateForResume(exp.startDate),
    endDate: formatDateForResume(exp.endDate)
  })) || 
    relevantExperiences.map(exp => ({
      title: exp.position,
      company: exp.company,
      location: exp.location,
      startDate: formatDateForResume(exp.startDate),
      endDate: formatDateForResume(exp.endDate),
      highlights: exp.description
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => enhanceBulletPoint(line, jobAnalysis))
    }));

  // Optimize relevant projects using similar logic to experience
  const optimizedProjects = relevantProjects.map(project => ({
    title: project.title,
    startDate: formatDateForResume(project.startDate),
    endDate: formatDateForResume(project.endDate),
    highlights: project.description
      .split('\n')
      .filter((line: string) => line.trim())
      .map((line: string) => enhanceBulletPoint(line, jobAnalysis))
  }));

  return {
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
    summary: summaryAndSkills.summary,
    skills: summaryAndSkills.skills,
    experience: finalExperiences,
    projects: optimizedProjects,
    education: includedEducation.map((edu: Education) => ({
      degree: edu.degree,
      school: edu.school,
      location: '',
      startDate: formatDateForResume(edu.startDate),
      endDate: formatDateForResume(edu.endDate),
      gpa: edu.cgpa
    })),
    certificates: includedCertificates.map((cert: Certificate) => ({
      name: cert.name,
      issuer: cert.issuer,
      date: formatDateForResume(cert.issueDate),
      credentialUrl: cert.credentialUrl
    }))
  };
}

function filterRelevantExperiences(experiences: any[], jobAnalysis: any, matchAnalysis: any): any[] {
  if (!experiences || experiences.length === 0) return [];

  return experiences.filter(exp => {
    const relevanceScore = calculateExperienceRelevance(exp, jobAnalysis, matchAnalysis);
    // Include experiences with relevance score >= 30% (adjust threshold as needed)
    return relevanceScore >= 30;
  }).sort((a, b) => {
    // Sort by relevance score (highest first)
    const scoreA = calculateExperienceRelevance(a, jobAnalysis, matchAnalysis);
    const scoreB = calculateExperienceRelevance(b, jobAnalysis, matchAnalysis);
    return scoreB - scoreA;
  });
}

function filterRelevantProjects(projects: any[], jobAnalysis: any, matchAnalysis: any): any[] {
  if (!projects || projects.length === 0) return [];

  return projects.filter(project => {
    const relevanceScore = calculateProjectRelevance(project, jobAnalysis, matchAnalysis);
    // Include projects with relevance score >= 25% (lower threshold for projects)
    return relevanceScore >= 25;
  }).sort((a, b) => {
    // Sort by relevance score (highest first)
    const scoreA = calculateProjectRelevance(a, jobAnalysis, matchAnalysis);
    const scoreB = calculateProjectRelevance(b, jobAnalysis, matchAnalysis);
    return scoreB - scoreA;
  });
}

function calculateExperienceRelevance(experience: any, jobAnalysis: any, matchAnalysis: any): number {
  let relevanceScore = 0;
  const expText = `${experience.position} ${experience.company} ${experience.description}`.toLowerCase();
  
  // Check for required technical skills (high weight)
  const requiredSkills = jobAnalysis?.technicalSkills?.required || [];
  const requiredMatches = requiredSkills.filter((skill: string) => 
    expText.includes(skill.toLowerCase())
  ).length;
  relevanceScore += (requiredMatches / Math.max(requiredSkills.length, 1)) * 40;

  // Check for preferred technical skills (medium weight)
  const preferredSkills = jobAnalysis?.technicalSkills?.preferred || [];
  const preferredMatches = preferredSkills.filter((skill: string) => 
    expText.includes(skill.toLowerCase())
  ).length;
  relevanceScore += (preferredMatches / Math.max(preferredSkills.length, 1)) * 25;

  // Check for key responsibilities alignment (medium weight)
  const keyResponsibilities = jobAnalysis?.keyResponsibilities || [];
  const responsibilityMatches = keyResponsibilities.filter((resp: string) => 
    expText.includes(resp.toLowerCase())
  ).length;
  relevanceScore += (responsibilityMatches / Math.max(keyResponsibilities.length, 1)) * 20;

  // Check for industry terms (low weight)
  const industryTerms = jobAnalysis?.industryTerms || [];
  const industryMatches = industryTerms.filter((term: string) => 
    expText.includes(term.toLowerCase())
  ).length;
  relevanceScore += (industryMatches / Math.max(industryTerms.length, 1)) * 15;

  return Math.min(relevanceScore, 100);
}

function calculateProjectRelevance(project: any, jobAnalysis: any, matchAnalysis: any): number {
  let relevanceScore = 0;
  const projectText = `${project.title} ${project.description} ${project.technologies}`.toLowerCase();
  
  // Check for required technical skills (high weight)
  const requiredSkills = jobAnalysis?.technicalSkills?.required || [];
  const requiredMatches = requiredSkills.filter((skill: string) => 
    projectText.includes(skill.toLowerCase())
  ).length;
  relevanceScore += (requiredMatches / Math.max(requiredSkills.length, 1)) * 45;

  // Check for preferred technical skills (medium weight)
  const preferredSkills = jobAnalysis?.technicalSkills?.preferred || [];
  const preferredMatches = preferredSkills.filter((skill: string) => 
    projectText.includes(skill.toLowerCase())
  ).length;
  relevanceScore += (preferredMatches / Math.max(preferredSkills.length, 1)) * 30;

  // Check for project types mentioned in job description
  const projectTypes = jobAnalysis?.projectTypes || [];
  const projectTypeMatches = projectTypes.filter((type: string) => 
    projectText.includes(type.toLowerCase())
  ).length;
  relevanceScore += (projectTypeMatches / Math.max(projectTypes.length, 1)) * 25;

  return Math.min(relevanceScore, 100);
}

function enhanceBulletPoint(originalText: string, jobAnalysis: any): string {
  // Simple enhancement logic - in a real implementation, this could be more sophisticated
  let enhanced = originalText.trim();
  
  // Add action verb if missing
  const actionVerbs = ['Developed', 'Implemented', 'Created', 'Built', 'Designed', 'Optimized'];
  if (!actionVerbs.some(verb => enhanced.startsWith(verb))) {
    enhanced = `Developed ${enhanced.toLowerCase()}`;
  }
  
  return enhanced;
}

// Helper function to call analyzer directly
async function callAnalyzer(jobDescription: string) {
  const apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key not configured');
  }

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

PRIORITIZATION:
- Mark skills as "required", "preferred", or "nice-to-have"
- Rank skills by frequency and emphasis in the job description
- Identify deal-breaker requirements vs. flexible requirements

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
}

Be thorough and extract every relevant detail. This analysis will be used by other specialized agents to create the perfect resume.`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
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

  if (!response.ok) {
    throw new Error('Analyzer agent failed');
  }

  const data = await response.json();
  
  if (!data.choices?.[0]?.message?.content) {
    console.error('Invalid response from analyzer agent:', data);
    throw new Error('Invalid response from analyzer agent');
  }
  
  return JSON.parse(data.choices[0].message.content);
}

// Helper function to call matcher directly
async function callMatcher(profile: UserProfile, jobAnalysis: any) {
  const apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  // Format user profile for analysis
  const formattedProfile = {
    name: profile.name,
    title: profile.title,
    skills: profile.skills?.map(skill => skill.name) || [],
    experience: profile.experiences?.map(exp => ({
      position: exp.position,
      company: exp.company,
      duration: `${exp.startDate} - ${exp.endDate || 'Present'}`,
      description: exp.description
    })) || [],
    education: profile.education?.map(edu => ({
      degree: edu.degree,
      school: edu.school,
      duration: `${edu.startDate} - ${edu.endDate || 'Present'}`
    })) || [],
    projects: profile.projects?.map(proj => ({
      title: proj.title,
      duration: `${proj.startDate} - ${proj.endDate || 'Present'}`,
      description: proj.description
    })) || []
  };

  const systemPrompt = `You are a Profile Matcher Agent. Your specialized task is to analyze a user's profile against job requirements and identify:

1. STRENGTH AREAS (where user profile strongly matches job requirements)
2. SKILL GAPS (missing or weak areas that need attention)
3. HIDDEN STRENGTHS (transferable skills the user might not emphasize)
4. OPTIMIZATION OPPORTUNITIES (how to better present existing experience)
5. COMPETITIVE ADVANTAGES (unique aspects that differentiate the candidate)

Your analysis will be used by other agents to optimize different sections of the resume.

MATCHING CRITERIA:
- Direct skill matches (exact technology/tool matches)
- Experience level alignment
- Industry experience relevance
- Project type similarities
- Responsibility overlaps
- Soft skill alignments
- Educational background fit

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
  "hiddenStrengths": {
    "transferableSkills": ["skill1", "skill2"],
    "relevantExperience": ["experience area1", "experience area2"],
    "uniqueValue": ["differentiator1", "differentiator2"]
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
    "experienceToEmphasize": ["experience area1", "experience area2"],
    "gapsToAddress": ["how to handle gap1", "how to handle gap2"]
  }
}

Be thorough and strategic in your matching analysis.`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
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
    throw new Error('Matcher agent failed');
  }

  const data = await response.json();
  
  if (!data.choices?.[0]?.message?.content) {
    console.error('Invalid response from matcher agent:', data);
    throw new Error('Invalid response from matcher agent');
  }
  
  return JSON.parse(data.choices[0].message.content);
}

// Helper function to call experience optimizer directly
async function callExperienceOptimizer(profile: UserProfile, jobAnalysis: any, matchAnalysis: any) {
  const apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const systemPrompt = `You are an Experience Optimization Agent. Your specialized task is to rewrite and optimize work experience descriptions to maximize ATS scoring and human impact for a specific job.

YOUR MISSION:
Transform each experience entry to highlight relevant skills, achievements, and responsibilities that align with the target job requirements.

OPTIMIZATION STRATEGY:
1. KEYWORD INTEGRATION: Seamlessly incorporate exact keywords from job description
2. QUANTIFICATION: Add or enhance metrics, percentages, and measurable outcomes
3. ACTION VERBS: Use strong, industry-appropriate action verbs
4. RELEVANCE RANKING: Prioritize most relevant achievements first
5. ATS OPTIMIZATION: Ensure optimal keyword density without stuffing
6. IMPACT DEMONSTRATION: Show clear business value and results

REWRITING RULES:
- Start each bullet with a powerful action verb
- Include specific technologies/tools from job requirements
- Add quantifiable results wherever possible
- Match industry terminology exactly
- Demonstrate progression and growth
- Show problem-solving and initiative
- Highlight team collaboration and leadership

For each experience entry, you must:
1. Analyze the original description for core achievements
2. Map achievements to job requirements
3. Rewrite with enhanced keywords and metrics
4. Ensure all significant accomplishments are preserved
5. Add context that showcases relevant skills

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
        "Optimized bullet point 1 with keywords and metrics",
        "Optimized bullet point 2 emphasizing relevant skills",
        "Optimized bullet point 3 showing measurable impact"
      ],
      "optimizationNotes": {
        "keywordsAdded": ["keyword1", "keyword2"],
        "metricsEnhanced": ["metric area1", "metric area2"],
        "relevanceScore": 95
      }
    }
  ],
  "overallStrategy": {
    "primaryFocus": "main optimization strategy used",
    "keywordDensity": "optimal",
    "impactLevel": "high"
  }
}

CRITICAL: Process ALL experience entries and preserve all meaningful achievements while optimizing for the target role.`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Optimize the work experience for this profile:

USER EXPERIENCE:
${JSON.stringify(profile.experiences, null, 2)}

JOB REQUIREMENTS:
${JSON.stringify(jobAnalysis, null, 2)}

MATCHING INSIGHTS:
${JSON.stringify(matchAnalysis, null, 2)}

Rewrite all experience entries to maximize relevance and impact for this specific job.`
        }
      ],
      temperature: 0.4,
      max_tokens: 6000,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error('Experience agent failed');
  }

  const data = await response.json();
  
  if (!data.choices?.[0]?.message?.content) {
    console.error('Invalid response from experience agent:', data);
    throw new Error('Invalid response from experience agent');
  }
  
  return JSON.parse(data.choices[0].message.content);
} 