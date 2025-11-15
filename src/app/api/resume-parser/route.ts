import { NextRequest, NextResponse } from "next/server";
import PDFParser from "pdf2json";

export const dynamic = 'force-dynamic';

/**
 * Parse extracted text with LLM to get structured JSON
 */
async function parseWithLLM(text: string): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // Limit text to avoid token limits (approximately 15000 characters = ~3750 tokens)
  let contentToSend = text;
  if (contentToSend.length > 15000) {
    contentToSend = contentToSend.substring(0, 15000);
  }

  const prompt = `You are a comprehensive resume parser. Extract ALL information from the resume text provided below and return it as a valid JSON object.

CRITICAL: You MUST extract ALL sections including:
- Personal information (name, email, phone, location, title)
- Professional summary/about section
- ALL education entries (every degree, certificate, etc.)
- ALL work experience entries (every job, internship, etc.)
- ALL skills (technical skills, soft skills, languages, etc.)
- ALL projects (personal projects, academic projects, etc.)
- Social links (LinkedIn, GitHub, portfolio, etc.)

Required JSON Structure (you MUST include ALL fields and match EXACT field names):
{
  "name": "Full name of the person",
  "email": "Email address",
  "phone": "Phone number or null if not found",
  "location": "City, State, Country or null if not found",
  "title": "Current job title/role or null if not found",
  "linkedinUrl": "LinkedIn profile URL or null if not found",
  "githubUrl": "GitHub profile URL or null if not found",
  "portfolioUrl": "Personal website or portfolio URL or null if not found",
  "about": "Professional summary, career objectives, or background paragraph (extract from Summary, About, Objective, or Profile sections)",
  "education": [
    {
      "school": "School or university name",
      "degree": "Degree obtained (e.g., Bachelor of Science, Master of Arts)",
      "startDate": "Start date in format 'YYYY' or 'MM/YYYY' or 'Month YYYY'",
      "endDate": "End/graduation date in format 'YYYY' or 'MM/YYYY' or 'Month YYYY'",
      "cgpa": "GPA/CGPA as string (e.g., '3.8/4.0' or '3.5') or empty string if not found"
    }
  ],
  "experiences": [
    {
      "company": "Company name",
      "position": "Job title/position (NOT 'title', use 'position')",
      "location": "Job location (city, state, country) or empty string if not found",
      "startDate": "Start date in format 'YYYY' or 'MM/YYYY' or 'Month YYYY'",
      "endDate": "End date in format 'YYYY' or 'MM/YYYY' or 'Month YYYY' or 'Present'",
      "description": "Full job description including all responsibilities and achievements. Combine all bullet points into a single paragraph separated by newlines or semicolons"
    }
  ],
  "skills": [
    {
      "name": "Skill name (e.g., 'React', 'Python', 'Machine Learning')",
      "domain": "Skill category (e.g., 'Frontend', 'Backend', 'Programming Language', 'Framework', 'Database', 'Cloud', 'Machine Learning', 'Soft Skills')"
    }
  ],
  "projects": [
    {
      "title": "Project name (NOT 'name', use 'title')",
      "description": "Full project description including features and achievements",
      "technologies": "Comma-separated list of technologies used (e.g., 'React, TypeScript, Node.js, MongoDB')",
      "startDate": "Start date in format 'YYYY' or 'MM/YYYY' or 'Month YYYY'",
      "endDate": "End date in format 'YYYY' or 'MM/YYYY' or 'Month YYYY' or 'Present'",
      "githubUrl": "GitHub repository URL or null if not found",
      "projectUrl": "Live project URL or null if not found"
    }
  ]
}

Important Rules:
1. Return ONLY a valid JSON object - no markdown, no code blocks, no explanations
2. Extract EVERY education entry you find - do not skip any
3. Extract EVERY work experience entry you find - do not skip any
4. Extract ALL skills mentioned anywhere in the resume - categorize them into domains
5. Extract ALL projects mentioned in the resume
6. For experience description, combine all bullet points into a single string (use newlines \\n or semicolons to separate points)
7. For skills, try to categorize them (e.g., React -> Frontend, Python -> Programming Language, AWS -> Cloud)
8. Use null for missing single fields, use empty arrays [] for missing array fields
9. All keys and string values must use double quotes
10. Education, experiences, skills, and projects must always be arrays (even if empty)
11. Dates should be in consistent format - prefer 'MM/YYYY' or 'Month YYYY' format
12. For skills domain, use common categories: Frontend, Backend, Programming Language, Framework, Database, Cloud, DevOps, Machine Learning, AI, Soft Skills, etc.
13. Use "experiences" (plural) as the field name for work experience array

Resume text content:
${contentToSend}

IMPORTANT: Carefully read through the entire resume text and extract ALL information. Do not skip any sections. Parse this resume content into the complete JSON structure above.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('OpenAI API Error:', errorData);
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const responseContent = data.choices[0]?.message?.content || '';
  
  if (!responseContent) {
    throw new Error("LLM did not return any content");
  }
  
  // Parse the JSON response
  let parsedResult;
  try {
    parsedResult = JSON.parse(responseContent);
  } catch (e) {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = responseContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      parsedResult = JSON.parse(jsonMatch[1]);
    } else {
      throw new Error("Failed to parse LLM response as JSON");
    }
  }
  
  // Handle both 'experience' and 'experiences' from LLM
  const experiences = parsedResult.experience || parsedResult.experiences || [];
  
  // Ensure all required arrays exist
  if (!Array.isArray(parsedResult.education)) {
    parsedResult.education = [];
  }
  if (!Array.isArray(experiences)) {
    parsedResult.experiences = [];
  }
  if (!Array.isArray(parsedResult.skills)) {
    parsedResult.skills = [];
  }
  if (!Array.isArray(parsedResult.projects)) {
    parsedResult.projects = [];
  }
  
  // Format the data to match our section structure
  // Add IDs and ensure proper formatting
  const formattedData = {
    ...parsedResult,
    education: parsedResult.education.map((edu: any, index: number) => ({
      id: `edu_${Date.now()}_${index}`,
      school: edu.school || '',
      degree: edu.degree || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
      cgpa: edu.cgpa || '',
      includeInResume: true,
    })),
    experiences: (Array.isArray(experiences) ? experiences : []).map((exp: any, index: number) => ({
      id: `exp_${Date.now()}_${index}`,
      company: exp.company || '',
      position: exp.position || exp.title || '', // Handle both 'position' and 'title'
      location: exp.location || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      description: exp.description || (Array.isArray(exp.responsibilities) ? exp.responsibilities.join('\n') : ''),
      includeInResume: true,
      order: index,
    })),
    skills: parsedResult.skills.map((skill: any, index: number) => {
      // Handle both object format and string format
      if (typeof skill === 'string') {
        return {
          id: `skill_${Date.now()}_${index}`,
          name: skill,
          domain: 'General', // Default domain for string skills
          includeInResume: true,
        };
      }
      return {
        id: `skill_${Date.now()}_${index}`,
        name: skill.name || skill,
        domain: skill.domain || 'General',
        includeInResume: true,
      };
    }),
    projects: parsedResult.projects.map((project: any, index: number) => ({
      id: `proj_${Date.now()}_${index}`,
      title: project.title || project.name || '',
      description: project.description || '',
      technologies: Array.isArray(project.technologies) 
        ? project.technologies.join(', ') 
        : (project.technologies || ''),
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      githubUrl: project.githubUrl || null,
      projectUrl: project.projectUrl || null,
      includeInResume: true,
    })),
  };
  
  return formattedData;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Use pdf2json to parse PDF
      return new Promise<NextResponse>((resolve, reject) => {
      const pdfParser = new PDFParser();
      
      // Collect all text from the PDF
      let extractedText = '';
      
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(new Error(`PDF parsing error: ${errData.parserError}`));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        try {
          // Extract text from all pages
          if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
            pdfData.Pages.forEach((page: any) => {
              if (page.Texts && Array.isArray(page.Texts)) {
                page.Texts.forEach((textItem: any) => {
                  if (textItem.R && Array.isArray(textItem.R)) {
                    textItem.R.forEach((r: any) => {
                      if (r.T) {
                        // Decode URI-encoded text
                        try {
                          extractedText += decodeURIComponent(r.T);
                        } catch {
                          extractedText += r.T;
                        }
                      }
                    });
                  }
                });
                extractedText += '\n\n'; // Add spacing between pages
              }
            });
          }

          // Clean up the extracted text
          let cleanedText = extractedText
            // Step 1: Remove spaces between consecutive letters/numbers that should be together
            // This handles cases like "T a r u n" -> "Tarun"
            .replace(/([a-zA-Z0-9])\s+([a-zA-Z0-9])/g, (match, p1, p2) => {
              // Keep space only if it's a clear word boundary
              const isWordBoundary = /[a-z][A-Z]/.test(p1 + p2) || 
                                     /[0-9][A-Za-z]/.test(p1 + p2) || 
                                     /[A-Za-z][0-9]/.test(p1 + p2);
              return isWordBoundary ? p1 + ' ' + p2 : p1 + p2;
            })
            // Step 2: Add spaces between words that are stuck together
            // Handle patterns like "PresentFeb" -> "Present Feb", "SUMMARYAsan" -> "SUMMARY Asan"
            .replace(/([a-z])([A-Z])/g, '$1 $2')  // lowercase followed by uppercase
            .replace(/([A-Z]{2,})([A-Z][a-z])/g, '$1 $2')  // Multiple caps followed by capitalized word
            // Step 3: Fix common acronyms and technical terms
            .replace(/\bC SS\b/g, 'CSS')
            .replace(/\bA I\b/g, 'AI')
            .replace(/\bG P A\b/g, 'GPA')
            .replace(/\bA W S\b/g, 'AWS')
            .replace(/\bR A G\b/g, 'RAG')
            .replace(/\bL L M\b/g, 'LLM')
            .replace(/\bN L P\b/g, 'NLP')
            .replace(/\bA P I\b/g, 'API')
            .replace(/\bA P Is\b/g, 'APIs')
            .replace(/\bS Q L\b/g, 'SQL')
            .replace(/\bG B\b/g, 'GB')
            // Step 4: Fix spacing around punctuation
            .replace(/\s+([.,;:!?])/g, '$1')
            .replace(/([.,;:!?])\s+/g, '$1 ')
            // Step 5: Normalize multiple spaces to single space
            .replace(/\s{2,}/g, ' ')
            // Step 6: Clean up line breaks
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\s+\n/g, '\n')
            .replace(/\n\s+/g, '\n')
            // Step 7: Fix dates and common patterns
            .replace(/(\d{4})\s*([A-Z][a-z])/g, '$1 $2')  // "2025Aug" -> "2025 Aug"
            .replace(/([A-Z][a-z]+)\s*(\d{4})/g, '$1 $2')  // "May2025" -> "May 2025"
            // Step 8: Final trim
            .trim();

          // Parse with LLM to get structured JSON
          parseWithLLM(cleanedText)
            .then((parsedData) => {
              resolve(NextResponse.json({
                text: cleanedText,
                data: parsedData,
              }));
            })
            .catch((error) => {
              // If LLM parsing fails, still return the text
              console.error('LLM parsing error:', error);
              resolve(NextResponse.json({
                text: cleanedText,
                data: null,
                error: 'Failed to parse with LLM, but text extraction succeeded',
              }));
            });
        } catch (error) {
          reject(error);
        }
      });

      // Parse the buffer
      pdfParser.parseBuffer(buffer);
    });
  } catch (error) {
    console.error('PDF parse error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
