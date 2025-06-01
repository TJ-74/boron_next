import { NextRequest, NextResponse } from 'next/server';
import type { UserProfile, Experience, Education, Skill, Project } from '@/app/types/profile';

export async function POST(request: NextRequest) {
  try {
    const { profile, jobAnalysis } = await request.json();
    
    if (!profile || !jobAnalysis) {
      return NextResponse.json(
        { error: 'Missing profile or job analysis' },
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

    // Format user profile for analysis
    const formattedProfile = {
      name: profile.name,
      title: profile.title,
      skills: profile.skills?.map((skill: Skill) => skill.name) || [],
      experience: profile.experiences?.map((exp: Experience) => ({
        position: exp.position,
        company: exp.company,
        duration: `${exp.startDate} - ${exp.endDate || 'Present'}`,
        description: exp.description
      })) || [],
      education: profile.education?.map((edu: Education) => ({
        degree: edu.degree,
        school: edu.school,
        duration: `${edu.startDate} - ${edu.endDate || 'Present'}`
      })) || [],
      projects: profile.projects?.map((proj: Project) => ({
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
      const errorData = await response.json().catch(() => ({}));
      console.error('Matcher Agent Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to analyze profile match' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: 'Invalid response from matcher agent' },
        { status: 500 }
      );
    }

    const matchAnalysis = JSON.parse(data.choices[0].message.content);
    
    return NextResponse.json({ 
      agent: 'matcher',
      matchAnalysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in matcher agent:', error);
    return NextResponse.json(
      { error: 'Failed to process profile matching' },
      { status: 500 }
    );
  }
} 