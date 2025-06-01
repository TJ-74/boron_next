import { NextRequest, NextResponse } from 'next/server';
import type { UserProfile } from '@/app/types/profile';

export async function POST(request: NextRequest) {
  try {
    const { profile, jobAnalysis, matchAnalysis } = await request.json();
    
    if (!profile || !jobAnalysis) {
      return NextResponse.json(
        { error: 'Missing required data for projects optimization' },
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

    const systemPrompt = `You are a Projects Optimization Agent. Your specialized task is to select, filter, and optimize project descriptions to maximize relevance and impact for a specific job application.

YOUR MISSION:
Identify the most relevant projects and rewrite their descriptions to showcase technical skills, problem-solving abilities, and achievements that align with job requirements.

OPTIMIZATION STRATEGY:
1. RELEVANCE FILTERING: Only include projects that demonstrate job-relevant skills
2. TECHNICAL EMPHASIS: Highlight technologies mentioned in job requirements
3. IMPACT DEMONSTRATION: Show measurable outcomes and business value
4. PROBLEM-SOLVING: Emphasize challenges overcome and solutions implemented
5. KEYWORD INTEGRATION: Naturally incorporate job description keywords
6. ACHIEVEMENT FOCUS: Quantify results where possible

PROJECT SELECTION CRITERIA:
- Direct technology matches with job requirements
- Demonstrates similar project types mentioned in job description
- Shows progression of technical skills
- Exhibits leadership, collaboration, or initiative
- Has measurable outcomes or impact

REWRITING RULES:
- Start descriptions with strong action verbs
- Include specific technologies from job requirements
- Mention project scale, complexity, or constraints
- Highlight collaborative aspects if relevant
- Show technical decision-making and problem-solving
- Include performance metrics, user numbers, or business impact
- Keep descriptions concise but impactful (2-4 bullet points per project)

Return optimized projects in this JSON format:

{
  "optimizedProjects": [
    {
      "title": "project title",
      "startDate": "start date",
      "endDate": "end date", 
      "projectUrl": "url if available",
      "githubUrl": "github url if available",
      "highlights": [
        "Optimized bullet point 1 with technologies and impact",
        "Optimized bullet point 2 emphasizing problem-solving",
        "Optimized bullet point 3 showing measurable results"
      ],
      "relevanceScore": 95,
      "keyTechnologies": ["tech1", "tech2", "tech3"]
    }
  ],
  "optimizationNotes": {
    "projectsIncluded": 3,
    "projectsFiltered": 2,
    "keywordsAdded": ["keyword1", "keyword2"],
    "technicalAlignment": "high",
    "overallRelevance": 92
  },
  "recommendations": {
    "projectsToAdd": ["suggestions for additional projects"],
    "skillsToHighlight": ["technical skills to emphasize more"],
    "improvementAreas": ["areas for enhancement"]
  }
}

CRITICAL: Only include projects that genuinely add value for this specific job. Quality and relevance over quantity.`;

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
            content: `Optimize the projects section for this profile:

USER PROJECTS:
${JSON.stringify(profile.projects, null, 2)}

JOB REQUIREMENTS:
${JSON.stringify(jobAnalysis, null, 2)}

MATCHING INSIGHTS:
${JSON.stringify(matchAnalysis, null, 2)}

Select the most relevant projects and optimize their descriptions to maximize impact for this specific job.`
          }
        ],
        temperature: 0.4,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Projects Agent Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to optimize projects' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: 'Invalid response from projects agent' },
        { status: 500 }
      );
    }

    const projectsOptimization = JSON.parse(data.choices[0].message.content);
    
    return NextResponse.json({ 
      agent: 'projects',
      projectsOptimization,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in projects agent:', error);
    return NextResponse.json(
      { error: 'Failed to process projects optimization' },
      { status: 500 }
    );
  }
} 