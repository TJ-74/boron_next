import { NextRequest, NextResponse } from 'next/server';
import type { UserProfile } from '@/app/types/profile';

export async function POST(request: NextRequest) {
  try {
    const { profile, jobAnalysis, matchAnalysis } = await request.json();
    
    if (!profile || !jobAnalysis) {
      return NextResponse.json(
        { error: 'Missing required data for skills optimization' },
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

    const systemPrompt = `You are a Skills Optimization Agent. Your specialized task is to organize and optimize the skills section of a resume to maximize ATS scoring and human impact for a specific job.

YOUR MISSION:
Transform the user's skills into strategically organized categories that align perfectly with job requirements.

OPTIMIZATION STRATEGY:
1. PRIORITY MATCHING: Place job-required skills first in each category
2. STRATEGIC GROUPING: Group skills by domain/technology stack
3. ATS KEYWORDS: Include exact keyword matches from job description
4. SKILL HIERARCHY: Order from most relevant to least relevant
5. COMPLETENESS: Include both technical and soft skills as appropriate
6. INDUSTRY ALIGNMENT: Use industry-standard terminology

SKILLS ORGANIZATION RULES:
- Start each category with must-have skills from job requirements
- Group related technologies together (e.g., React, Next.js, TypeScript)
- Include skill variants that might be searched (e.g., "JavaScript/JS", "Python/Django")
- Balance technical depth with breadth
- Add soft skills that are specifically mentioned in job requirements
- Remove or de-emphasize irrelevant skills

CATEGORIES TO CONSIDER:
- Programming Languages
- Frontend Technologies  
- Backend Technologies
- Databases & Storage
- Cloud & DevOps
- Tools & Frameworks
- Soft Skills
- Industry-Specific Skills

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
  },
  "recommendations": {
    "emphasize": ["skills to highlight more"],
    "learn": ["skills to potentially acquire"],
    "certifications": ["relevant certifications to consider"]
  }
}

CRITICAL: Only include skills that add value for this specific job. Quality over quantity.`;

    // Format user skills for analysis
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
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Optimize the skills section for this profile:

USER SKILLS:
${JSON.stringify(userSkills, null, 2)}

JOB REQUIREMENTS:
${JSON.stringify(jobAnalysis, null, 2)}

MATCHING INSIGHTS:
${JSON.stringify(matchAnalysis, null, 2)}

Create a strategically organized skills section that maximizes relevance and impact for this specific job.`
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Skills Agent Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to optimize skills' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: 'Invalid response from skills agent' },
        { status: 500 }
      );
    }

    const skillsOptimization = JSON.parse(data.choices[0].message.content);
    
    return NextResponse.json({ 
      agent: 'skills',
      skillsOptimization,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in skills agent:', error);
    return NextResponse.json(
      { error: 'Failed to process skills optimization' },
      { status: 500 }
    );
  }
} 