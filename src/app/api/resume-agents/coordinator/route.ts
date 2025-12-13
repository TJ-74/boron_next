import { NextRequest, NextResponse } from 'next/server';
import type { UserProfile, Education, Certificate } from '@/app/types/profile';
import { MODEL_CONFIG, makeApiCall, getApiEndpoint, getApiKey } from '../../config/models';

/**
 * AGENTIC AI RESUME GENERATOR - COORDINATOR
 * ==========================================
 * 
 * This is a sophisticated multi-agent AI system that creates the PERFECT resume
 * tailored to any job description. The system uses 6 specialized AI agents that
 * work together in a coordinated pipeline.
 * 
 * AGENT PIPELINE:
 * ---------------
 * 1. JOB ANALYZER AGENT
 *    - Extracts all technical skills, soft skills, and requirements from job description
 *    - Identifies must-have vs nice-to-have skills
 *    - Extracts ATS keywords and industry terminology
 * 
 * 2. PROFILE MATCHER AGENT
 *    - Analyzes candidate's profile against job requirements
 *    - Identifies strengths, gaps, and hidden strengths
 *    - Provides strategic recommendations for optimization
 * 
 * 3. PROJECT OPTIMIZER AGENT
 *    - Selects the BEST 3-4 projects from those marked for resume
 *    - Rewrites project descriptions to highlight relevant technologies
 *    - Emphasizes skills and achievements that match job requirements
 * 
 * 4. EXPERIENCE OPTIMIZER AGENT
 *    - Rewrites ALL experience descriptions marked for resume
 *    - Integrates job-specific keywords naturally
 *    - Adds metrics and quantifiable achievements
 *    - Uses powerful action verbs and industry terminology
 * 
 * 5. SKILLS ENHANCEMENT AGENT
 *    - Includes all existing skills marked for resume
 *    - Adds CRITICAL missing skills from job requirements
 *    - Only adds skills the candidate likely has based on experience/projects
 *    - Organizes skills strategically for maximum ATS impact
 * 
 * 6. SUMMARY GENERATOR AGENT
 *    - Creates a compelling 3-4 sentence professional summary
 *    - Integrates key achievements and skills from optimized sections
 *    - Positions candidate as the perfect fit for the role
 *    - Optimized for both ATS and human readers
 * 
 * KEY FEATURES:
 * -------------
 * ✅ Only uses items marked with includeInResume: true (or !== false)
 * ✅ Preserves resume template structure
 * ✅ Adds missing critical skills intelligently
 * ✅ Rewrites experience descriptions with job-specific keywords
 * ✅ Selects and optimizes best projects
 * ✅ Generates perfect summary tailored to job
 * ✅ Maintains all original metadata (dates, companies, etc.)
 * ✅ ATS-optimized with natural keyword integration
 * 
 * USAGE:
 * ------
 * POST /api/resume-agents/coordinator
 * Body: { profile: UserProfile, jobDescription: string }
 * 
 * Returns: { resumeData: ResumeData, agentInsights: {...}, timestamp: string }
 */

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

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper to send progress updates
          const sendUpdate = (type: string, message: string, data?: any) => {
            const update = JSON.stringify({ type, message, data }) + '\n';
            controller.enqueue(encoder.encode(update));
          };

          console.log('🚀 Starting Multi-Agent Resume Generation...');
          sendUpdate('start', '🚀 Starting Multi-Agent Resume Generation...');

          // Step 1: Analyze Job Description
          console.log('📊 Step 1: Analyzing job description...');
          sendUpdate('progress', '📊 Step 1: Analyzing job description...', { step: 1, total: 5 });
          const jobAnalysis = await callAnalyzer(jobDescription);
          console.log('✅ Job analysis complete');
          sendUpdate('progress', '✅ Job analysis complete', { step: 1, total: 5, status: 'complete' });

          // Step 2: Match Profile to Job Requirements
          console.log('🎯 Step 2: Matching profile to requirements...');
          sendUpdate('progress', '🎯 Step 2: Matching profile to requirements...', { step: 2, total: 5 });
          const matchAnalysis = await callMatcher(profile, jobAnalysis);
          console.log('✅ Profile matching complete');
          sendUpdate('progress', '✅ Profile matching complete', { step: 2, total: 5, status: 'complete' });

          // Step 3: Run Project, Experience, and Skills optimization in PARALLEL
          console.log('🚀 Step 3: Optimizing projects, experience, and skills in parallel...');
          sendUpdate('progress', '🚀 Step 3: Optimizing projects, experience, and skills in parallel...', { step: 3, total: 5 });
          
          const [projectOptimization, experienceOptimization, skillsEnhancement] = await Promise.all([
            callProjectOptimizer(profile, jobAnalysis, matchAnalysis),
            callExperienceOptimizer(profile, jobAnalysis, matchAnalysis),
            enhanceSkills(profile, jobAnalysis, matchAnalysis)
          ]);
          
          console.log('✅ Parallel optimization complete');
          sendUpdate('progress', '✅ Parallel optimization complete', { step: 3, total: 5, status: 'complete' });

          // Step 4: Generate Perfect Summary
          console.log('📝 Step 4: Generating perfect summary...');
          sendUpdate('progress', '📝 Step 4: Generating perfect summary...', { step: 4, total: 5 });
          const summaryGeneration = await generatePerfectSummary(
            profile, 
            jobAnalysis, 
            matchAnalysis,
            experienceOptimization,
            projectOptimization,
            skillsEnhancement
          );
          console.log('✅ Summary generation complete');
          sendUpdate('progress', '✅ Summary generation complete', { step: 4, total: 5, status: 'complete' });

          // Step 5: Assemble Final Resume
          console.log('🔧 Step 5: Assembling final resume...');
          sendUpdate('progress', '🔧 Step 5: Assembling final resume...', { step: 5, total: 5 });
          const finalResume = assembleResume(
            profile,
            jobAnalysis,
            matchAnalysis,
            experienceOptimization,
            projectOptimization,
            skillsEnhancement,
            summaryGeneration
          );
          console.log('✅ Final assembly complete');
          sendUpdate('progress', '✅ Final assembly complete', { step: 5, total: 5, status: 'complete' });

          console.log('🎉 Multi-Agent Resume Generation Complete!');
          
          // Send final result
          sendUpdate('complete', '🎉 Multi-Agent Resume Generation Complete!', {
            resumeData: finalResume,
            agentInsights: {
              jobAnalysis,
              matchAnalysis,
              projectOptimization,
              experienceOptimization,
              skillsEnhancement,
              summaryGeneration,
              processingSteps: [
                'Job Description Analysis',
                'Profile Matching',
                'Parallel Optimization (Projects, Experience, Skills)',
                'Summary Generation',
                'Final Assembly'
              ]
            },
            timestamp: new Date().toISOString()
          });

          controller.close();
        } catch (error) {
          console.error('Error in coordinator agent:', error);
          const errorUpdate = JSON.stringify({ 
            type: 'error', 
            message: 'Failed to coordinate resume generation',
            error: error instanceof Error ? error.message : 'Unknown error'
          }) + '\n';
          controller.enqueue(encoder.encode(errorUpdate));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
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

// NEW AGENT: Project Optimizer - Selects best projects and writes compelling descriptions
async function callProjectOptimizer(profile: UserProfile, jobAnalysis: any, matchAnalysis: any) {
  const model = MODEL_CONFIG.projectOptimizer;

  // Only include projects marked for resume
  const includedProjects = profile.projects?.filter(proj => proj.includeInResume !== false) || [];

  const systemPrompt = `You are a Project Selection and Optimization Agent. Your mission is to select the BEST projects that align with the job requirements and write compelling, achievement-focused descriptions.

YOUR TASKS:
1. ANALYZE each project's relevance to the job requirements
2. SELECT the top 3-4 most relevant projects (or all if fewer than 4)
3. REWRITE project descriptions to highlight:
   - Technologies that match job requirements
   - Problem-solving and technical complexity
   - Measurable impact and results
   - Relevant skills demonstrated
   - Team collaboration (if applicable)

SELECTION CRITERIA:
- Technology stack alignment with job requirements
- Project complexity and scale
- Relevance to target role responsibilities
- Demonstration of required skills
- Uniqueness and innovation

DESCRIPTION WRITING RULES:
- Start with the problem or goal
- Highlight technologies used (especially those matching job requirements)
- Emphasize your specific contributions
- Include quantifiable outcomes when possible
- Use action verbs and technical terminology
- Keep descriptions concise but impactful (2-4 bullet points per project)

FORMATTING REQUIREMENT:
- Use markdown bold (**word**) to emphasize important keywords in highlights such as:
  * Key technologies and frameworks used
  * Critical metrics and achievements (percentages, numbers)
  * Important technical methodologies or patterns
  * Impactful action verbs and outcomes
- Example: "Built a **real-time chat application** using **React**, **Node.js**, and **WebSocket**, serving **10,000+ users** with **99.9% uptime**"

Return in JSON format:

{
  "selectedProjects": [
    {
      "title": "Project Title",
      "startDate": "start date from original",
      "endDate": "end date from original",
      "technologies": "tech stack from original",
      "projectUrl": "url if available",
      "githubUrl": "github url if available",
      "highlights": [
        "Compelling bullet point 1 with **bold** markdown on relevant keywords",
        "Compelling bullet point 2 showing **impact** with **bold** metrics",
        "Compelling bullet point 3 demonstrating **skills** in **bold**"
      ],
      "relevanceScore": 95,
      "keywordsMatched": ["keyword1", "keyword2"]
    }
  ],
  "selectionReasoning": "Brief explanation of why these projects were chosen"
}

CRITICAL: Only select projects that are marked as includeInResume. Preserve all original metadata (dates, URLs, technologies).`;

  const userContent = `Select and optimize the best projects for this job:

AVAILABLE PROJECTS (marked for resume):
${JSON.stringify(includedProjects, null, 2)}

JOB REQUIREMENTS:
${JSON.stringify(jobAnalysis, null, 2)}

MATCHING INSIGHTS:
${JSON.stringify(matchAnalysis, null, 2)}

Select the best 3-4 projects and write compelling descriptions that will make the candidate stand out.`;

  return await makeApiCall(
    model,
    systemPrompt,
    userContent,
    {
      temperature: 0.4,
      maxTokens: 4000,
      responseFormat: 'json_object'
    }
  );
}

// NEW AGENT: Skills Enhancement - Adds missing critical skills and organizes existing ones
async function enhanceSkills(profile: UserProfile, jobAnalysis: any, matchAnalysis: any) {
  const model = MODEL_CONFIG.skillsEnhancer;

  // Only include skills marked for resume
  const includedSkills = profile.skills?.filter(skill => skill.includeInResume !== false) || [];

  const systemPrompt = `You are a Skills Enhancement Agent. Your mission is to create the PERFECT skills section by:
1. Including all existing skills marked for resume
2. Adding CRITICAL missing skills from job requirements
3. Organizing skills strategically for maximum impact

SKILL ADDITION RULES:
- ONLY add skills that are CRITICAL "must-have" requirements from the job
- Add skills that the candidate likely has based on their experience/projects
- DO NOT add skills the candidate has no evidence of having
- Prioritize exact keyword matches from job description
- Add 3-7 critical missing skills maximum

ORGANIZATION STRATEGY:
- Group by domain/category (Technical Skills, Programming Languages, Tools & Frameworks, Soft Skills, etc.)
- Put most relevant skills first within each category
- Ensure ATS keyword optimization
- Balance breadth and depth

Return in JSON format:

{
  "enhancedSkills": {
    "Technical Skills": ["skill1", "skill2"],
    "Programming Languages": ["lang1", "lang2"],
    "Frameworks & Tools": ["tool1", "tool2"],
    "Databases": ["db1", "db2"],
    "Cloud & DevOps": ["cloud1", "devops1"],
    "Soft Skills": ["skill1", "skill2"]
  },
  "addedSkills": [
    {
      "skill": "New Skill Name",
      "domain": "Category",
      "reasoning": "Why this skill was added based on job requirements and candidate's background"
    }
  ],
  "organizationStrategy": "Brief explanation of how skills were organized"
}

CRITICAL: Include ALL existing skills that are marked for resume. Only add skills that are truly critical and the candidate likely possesses.`;

  const userContent = `Enhance the skills section for this profile:

EXISTING SKILLS (marked for resume):
${JSON.stringify(includedSkills, null, 2)}

CANDIDATE'S EXPERIENCE & PROJECTS:
Experience: ${JSON.stringify(profile.experiences?.map(exp => ({ position: exp.position, company: exp.company, description: exp.description })), null, 2)}
Projects: ${JSON.stringify(profile.projects?.map(proj => ({ title: proj.title, technologies: proj.technologies, description: proj.description })), null, 2)}

JOB REQUIREMENTS:
${JSON.stringify(jobAnalysis, null, 2)}

GAPS IDENTIFIED:
${JSON.stringify(matchAnalysis.gaps, null, 2)}

Create the perfect skills section by including existing skills and adding only critical missing skills the candidate likely has.`;

  return await makeApiCall(
    model,
    systemPrompt,
    userContent,
    {
      temperature: 0.3,
      maxTokens: 3000,
      responseFormat: 'json_object'
    }
  );
}

// NEW AGENT: Perfect Summary Generator
async function generatePerfectSummary(
  profile: UserProfile, 
  jobAnalysis: any, 
  matchAnalysis: any,
  experienceOptimization: any,
  projectOptimization: any,
  skillsEnhancement: any
) {
  const model = MODEL_CONFIG.summaryGenerator;
  const apiEndpoint = getApiEndpoint(model);
  const apiKey = getApiKey(model);
  
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const systemPrompt = `You are a Professional Summary Generation Agent. Your mission is to create a PERFECT, compelling professional summary that will grab attention and pass ATS.

SUMMARY REQUIREMENTS:
- 3-4 powerful sentences (80-120 words)
- Lead with years of experience and current role/expertise
- Highlight 3-4 most relevant skills/technologies from job requirements
- Showcase unique value proposition and key achievements
- Include industry-specific terminology and keywords
- End with what you're seeking or can deliver
- Use active voice and confident tone

STRUCTURE:
1. Opening: "[X] years of experience as [role] specializing in [key areas]"
2. Skills & Expertise: "Proficient in [relevant technologies/skills from job]"
3. Achievements: "Proven track record of [relevant accomplishments]"
4. Goal/Value: "Seeking to leverage [skills] to [deliver value aligned with job]"

OPTIMIZATION:
- Integrate exact keywords from job description naturally
- Quantify experience and achievements where possible
- Match the tone and language of the job posting
- Emphasize strengths that address job requirements
- Create a narrative that positions candidate as ideal fit

FORMATTING REQUIREMENT:
- Use markdown bold (**word**) to emphasize important keywords such as:
  * Key technologies and tools
  * Critical skills from job requirements
  * Quantifiable achievements
  * Important certifications or methodologies
  * Role titles and expertise areas
- Example: "**5+ years** of experience as a **Full-Stack Developer** specializing in **React**, **Node.js**, and **AWS**"

Return in JSON format:

{
  "summary": "The perfect 3-4 sentence professional summary with **bold** markdown formatting on key terms",
  "keywordsIntegrated": ["keyword1", "keyword2", "keyword3"],
  "tone": "professional/technical/dynamic",
  "atsScore": 95
}`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL_CONFIG.summaryGenerator,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Generate the perfect professional summary:

CANDIDATE PROFILE:
Name: ${profile.name}
Title: ${profile.title || 'Professional'}
About: ${profile.about || 'N/A'}
Years of Experience: ${profile.experiences?.length || 0} roles

OPTIMIZED EXPERIENCE:
${JSON.stringify(experienceOptimization.optimizedExperience?.slice(0, 2), null, 2)}

SELECTED PROJECTS:
${JSON.stringify(projectOptimization.selectedProjects?.slice(0, 2), null, 2)}

ENHANCED SKILLS:
${JSON.stringify(skillsEnhancement.enhancedSkills, null, 2)}

JOB REQUIREMENTS:
${JSON.stringify(jobAnalysis, null, 2)}

MATCH ANALYSIS:
${JSON.stringify(matchAnalysis, null, 2)}

Create a summary that positions this candidate as the PERFECT fit for this role.`
        }
      ],
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error('Summary generation agent failed');
  }

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
  projectOptimization: any,
  skillsEnhancement: any,
  summaryGeneration: any
) {
  // Filter included education and certificates (ONLY items marked for resume)
  const includedEducation = profile.education ? 
    profile.education.filter((edu: Education) => edu.includeInResume !== false) : [];
  const includedCertificates = profile.certificates ? 
    profile.certificates.filter((cert: Certificate) => cert.includeInResume !== false) : [];

  // Filter included experiences (ONLY items marked for resume)
  const includedExperiences = profile.experiences ? 
    profile.experiences.filter(exp => exp.includeInResume !== false) : [];

  // Use optimized experience from agent (already filtered to included items)
  const finalExperiences = experienceOptimization?.optimizedExperience?.map((exp: any) => ({
    ...exp,
    startDate: formatDateForResume(exp.startDate),
    endDate: formatDateForResume(exp.endDate)
  })) || 
    // Fallback: use included experiences with basic formatting
    includedExperiences.map(exp => ({
      title: exp.position,
      company: exp.company,
      location: exp.location,
      startDate: formatDateForResume(exp.startDate),
      endDate: formatDateForResume(exp.endDate),
      highlights: exp.description
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => line.trim())
    }));

  // Use optimized projects from agent (already selected and optimized)
  const finalProjects = projectOptimization?.selectedProjects?.map((project: any) => ({
    title: project.title,
    startDate: formatDateForResume(project.startDate),
    endDate: formatDateForResume(project.endDate),
    technologies: project.technologies,
    projectUrl: project.projectUrl,
    githubUrl: project.githubUrl,
    highlights: project.highlights
  })) || [];

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
    summary: summaryGeneration.summary,
    skills: skillsEnhancement.enhancedSkills,
    experience: finalExperiences,
    projects: finalProjects,
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

// Helper function to call analyzer directly
async function callAnalyzer(jobDescription: string) {
  const model = MODEL_CONFIG.jobAnalyzer;

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

  const userContent = `Analyze this job description thoroughly:\n\n${jobDescription}`;

  return await makeApiCall(
    model,
    systemPrompt,
    userContent,
    {
      temperature: 0.3,
      maxTokens: 4000,
      responseFormat: 'json_object'
    }
  );
}

// Helper function to call matcher directly
async function callMatcher(profile: UserProfile, jobAnalysis: any) {
  const model = MODEL_CONFIG.profileMatcher;

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

  const userContent = `Analyze this profile against the job requirements:

USER PROFILE:
${JSON.stringify(formattedProfile, null, 2)}

JOB ANALYSIS:
${JSON.stringify(jobAnalysis, null, 2)}

Provide a comprehensive matching analysis.`;

  return await makeApiCall(
    model,
    systemPrompt,
    userContent,
    {
      temperature: 0.3,
      maxTokens: 4000,
      responseFormat: 'json_object'
    }
  );
}

// Helper function to call experience optimizer directly
async function callExperienceOptimizer(profile: UserProfile, jobAnalysis: any, matchAnalysis: any) {
  const model = MODEL_CONFIG.experienceOptimizer;

  // Only include experiences marked for resume
  const includedExperiences = profile.experiences?.filter(exp => exp.includeInResume !== false) || [];

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
- Add quantifiable results wherever possible (use realistic estimates if original lacks metrics)
- Match industry terminology exactly
- Demonstrate progression and growth
- Show problem-solving and initiative
- Highlight team collaboration and leadership
- Keep 3-5 bullet points per experience

FORMATTING REQUIREMENT:
- Use markdown bold (**word**) to emphasize important keywords in highlights such as:
  * Key technologies, frameworks, and tools
  * Critical metrics and quantifiable achievements
  * Important methodologies and best practices
  * Impactful outcomes and business results
  * Technical leadership and collaboration terms
- Example: "Led a team of **5 engineers** to develop a **microservices architecture** using **Docker** and **Kubernetes**, reducing deployment time by **60%**"

For each experience entry, you must:
1. Analyze the original description for core achievements
2. Map achievements to job requirements
3. Rewrite with enhanced keywords and metrics
4. Ensure all significant accomplishments are preserved
5. Add context that showcases relevant skills
6. Maintain chronological order (most recent first)

Return optimized experience in this JSON format:

{
  "optimizedExperience": [
    {
      "title": "job title from original",
      "company": "company name from original", 
      "location": "location from original",
      "startDate": "start date from original",
      "endDate": "end date from original",
      "highlights": [
        "Optimized bullet point 1 with **bold** keywords and **metrics**",
        "Optimized bullet point 2 emphasizing **relevant skills** in **bold**",
        "Optimized bullet point 3 showing **measurable impact** with **bold** formatting"
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

CRITICAL: Only process experiences marked as includeInResume. Preserve all original metadata (title, company, location, dates). Optimize ALL included experiences.`;

  const userContent = `Optimize the work experience for this profile:

EXPERIENCES TO OPTIMIZE (marked for resume):
${JSON.stringify(includedExperiences, null, 2)}

JOB REQUIREMENTS:
${JSON.stringify(jobAnalysis, null, 2)}

MATCHING INSIGHTS:
${JSON.stringify(matchAnalysis, null, 2)}

Rewrite all experience entries to maximize relevance and impact for this specific job. Use the job requirements to add relevant keywords and frame achievements in terms that match the target role.`;

  return await makeApiCall(
    model,
    systemPrompt,
    userContent,
    {
      temperature: 0.4,
      maxTokens: 6000,
      responseFormat: 'json_object'
    }
  );
} 