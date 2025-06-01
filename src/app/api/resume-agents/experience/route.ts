import { NextRequest, NextResponse } from 'next/server';
import type { UserProfile } from '@/app/types/profile';

export async function POST(request: NextRequest) {
  try {
    const { profile, jobAnalysis, matchAnalysis } = await request.json();
    
    if (!profile || !jobAnalysis || !matchAnalysis) {
      return NextResponse.json(
        { error: 'Missing required data for experience optimization' },
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
      const errorData = await response.json().catch(() => ({}));
      console.error('Experience Agent Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to optimize experience' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: 'Invalid response from experience agent' },
        { status: 500 }
      );
    }

    const experienceOptimization = JSON.parse(data.choices[0].message.content);
    
    return NextResponse.json({ 
      agent: 'experience',
      experienceOptimization,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in experience agent:', error);
    return NextResponse.json(
      { error: 'Failed to process experience optimization' },
      { status: 500 }
    );
  }
} 