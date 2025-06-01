import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { jobDescription } = await request.json();
    
    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Missing job description' },
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
      const errorData = await response.json().catch(() => ({}));
      console.error('Analyzer Agent Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to analyze job description' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: 'Invalid response from analyzer agent' },
        { status: 500 }
      );
    }

    const analysis = JSON.parse(data.choices[0].message.content);
    
    return NextResponse.json({ 
      agent: 'analyzer',
      analysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in analyzer agent:', error);
    return NextResponse.json(
      { error: 'Failed to process job analysis' },
      { status: 500 }
    );
  }
} 