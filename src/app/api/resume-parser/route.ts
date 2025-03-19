import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

// Initialize the Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'your-groq-api-key-here', // Fallback for testing
});

// Simple in-memory storage for parsed resumes
// In a production app, you would use a database
const parsedDataStore = new Map<string, any>();

// Add the dynamic config at the top of the file
export const dynamic = 'force-dynamic';

/**
 * Extract text from a PDF file
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Try using pdf-parse if available
    try {
      // Dynamic import of pdf-parse
      // @ts-ignore - Ignoring the missing type declaration
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      
      if (data && data.text && data.text.trim().length > 0) {
        return data.text;
      }
    } catch (pdfParseError) {
      console.error('Error using pdf-parse:', pdfParseError);
      // Fall through to backup method
    }
    
    // Backup: Extract text from PDF as a binary file
    let pdfText = buffer.toString('utf8');
    
    // Clean up the text
    pdfText = pdfText.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\xFF]/g, ' ');
    pdfText = pdfText.replace(/\s+/g, ' ');
    
    // Extract text content
    const textMatches = pdfText.match(/[A-Za-z0-9\s\.,;:'"!@#$%^&*()_\-+=[\]{}|\\/<>?]+/g);
    
    if (textMatches && textMatches.length > 0) {
      const extractedText = textMatches
        .filter(match => match.trim().length > 10)
        .join('\n');
      
      if (extractedText.trim().length > 100) {
        return extractedText;
      }
    }
    
    throw new Error("Not enough text could be extracted from your PDF.");
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error("Failed to extract text from PDF file.");
  }
}

/**
 * Extract text from a Word document (placeholder - not implemented)
 */
async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  throw new Error("Microsoft Word documents cannot be processed directly. Please upload a PDF or plain text version of your resume.");
}

/**
 * Parse text using Groq API
 */
async function parseWithGroq(text: string): Promise<any> {
  // Create a prompt for Groq to extract information from the resume
  const prompt = `
    You are a resume parser that extracts structured information from resumes.
    
    I will provide you with the content of a resume. Your task is to extract key information and format it as JSON.
    
    Rules:
    1. Return ONLY a valid JSON object
    2. Do not include any explanations, markdown formatting, or code blocks
    3. Use null for missing fields, not empty strings
    4. Make sure to use double quotes for all keys and string values
    5. For education, experience and projects, always return arrays even if there's only one item
    
    Extract the following information from the resume:
    - name: The person's full name
    - email: Email address
    - phone: Phone number
    - location: City and/or state and/or country
    - title: Current job title/role
    - linkedinUrl: LinkedIn profile URL
    - githubUrl: GitHub profile URL
    - portfolioUrl: Personal website or portfolio URL
    - about: A short paragraph about the person's professional summary, career objectives or background
    - education: Array of education entries with
      - degree: Degree obtained
      - school: School/university name
      - graduationDate: Graduation date
    - experience: Array of work experience entries with
      - company: Company name
      - title: Job title
      - dates: Employment dates
      - responsibilities: Array of key responsibilities or achievements
    - skills: Array of skills and technologies
    - projects: Array of projects with
      - name: Project name
      - description: Short description
      - technologies: Array of technologies used

    Resume content:
    ${text}
  `;

  // Call Groq API
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'llama3-8b-8192',
    temperature: 0.1,  // Low temperature for more predictable JSON
  });

  // Get the response content
  const parsedContent = completion.choices[0]?.message?.content;
  
  // Process and return the parsed content
  const sanitizedResult = sanitizeJsonResponse(parsedContent);
  
  // Add empty arrays for missing sections to ensure consistent structure
  if (!sanitizedResult.education) sanitizedResult.education = [];
  if (!sanitizedResult.experience) sanitizedResult.experience = [];
  if (!sanitizedResult.skills) sanitizedResult.skills = [];
  if (!sanitizedResult.projects) sanitizedResult.projects = [];
  
  // Ensure about has a default value if missing
  if (!sanitizedResult.about) sanitizedResult.about = '';
  
  return sanitizedResult;
}

/**
 * Ensures the response is valid JSON
 */
function sanitizeJsonResponse(content: string | null | undefined): any {
  if (!content) {
    return {};
  }
  
  // First check if the string is actually parseable as JSON
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse response as JSON:', e);
    
    try {
      // If the response has extra characters, try to find and extract just the JSON object
      let cleanedContent = content;
      
      // Remove any markdown code blocks
      cleanedContent = cleanedContent.replace(/```json|```/g, '');
      
      // Remove any text before the first { and after the last }
      const openBrace = cleanedContent.indexOf('{');
      const closeBrace = cleanedContent.lastIndexOf('}');
      
      if (openBrace !== -1 && closeBrace !== -1 && closeBrace > openBrace) {
        cleanedContent = cleanedContent.substring(openBrace, closeBrace + 1);
        
        // Try to parse again
        try {
          return JSON.parse(cleanedContent);
        } catch (e) {
          console.error('Failed to parse cleaned content:', e);
        }
      }
      
      // If we still haven't successfully parsed the JSON,
      // try to fix common JSON syntax issues
      
      // Replace single quotes with double quotes (if not inside double quotes)
      let inDoubleQuote = false;
      let fixedContent = '';
      
      for (let i = 0; i < cleanedContent.length; i++) {
        const char = cleanedContent[i];
        
        if (char === '"') {
          inDoubleQuote = !inDoubleQuote;
          fixedContent += char;
        } else if (char === "'" && !inDoubleQuote) {
          fixedContent += '"';
        } else {
          fixedContent += char;
        }
      }
      
      // Try to parse the fixed content
      try {
        return JSON.parse(fixedContent);
      } catch (e) {
        console.error('Failed to parse fixed content:', e);
      }
      
      // As a last resort, create a basic object by extracting fields with regex
      const extractField = (fieldName: string): string | null => {
        const regex = new RegExp(`["']?${fieldName}["']?\\s*:\\s*["']?([^"',}\\n]+)["']?`, 'i');
        const match = cleanedContent.match(regex);
        return match ? match[1].trim() : null;
      };
      
      return {
        name: extractField('name'),
        email: extractField('email'),
        phone: extractField('phone'),
        location: extractField('location'),
        title: extractField('title'),
        about: extractField('about') || extractField('summary'),
        education: [],
        experience: [],
        skills: [],
        projects: []
      };
    } catch (finalError) {
      console.error('All parsing attempts failed:', finalError);
      return {
        parseError: 'Could not parse the resume content properly',
      };
    }
  }
}

// POST endpoint to upload and parse a resume
export async function POST(request: NextRequest) {
  try {
    // Get the form data with the resume file
    const formData = await request.formData();
    const file = formData.get('resume') as File;
    
    // Get the user ID from the search parameters or generate a temporary one
    const userID = request.nextUrl.searchParams.get('userID') || `user_${Date.now()}`;
    
    if (!file) {
      return NextResponse.json({ error: 'No resume file provided' }, { status: 400 });
    }
    
    // Get file data
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    // Extract text based on file type
    let extractedText = '';
    
    try {
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        extractedText = await extractTextFromPdf(buffer);
      } else if (
        fileType === 'application/msword' || 
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.endsWith('.doc') || 
        fileName.endsWith('.docx')
      ) {
        extractedText = await extractTextFromDocx(buffer);
      } else {
        // For text files and other formats
        extractedText = await file.text();
      }
    } catch (error: any) {
      return NextResponse.json({ 
        error: error.message || "Failed to extract text from file",
        success: false 
      }, { status: 400 });
    }
    
    if (extractedText.trim().length < 100) {
      return NextResponse.json({ 
        error: "Not enough text could be extracted from your file. Please try a different file format.",
        success: false 
      }, { status: 400 });
    }
    
    // Log the extracted text for debugging
    console.log("Extracted text from resume:", extractedText);
    
    // Parse the extracted text
    let parsedData;
    try {
      parsedData = await parseWithGroq(extractedText);
    } catch (error) {
      console.error('Error parsing resume with Groq:', error);
      return NextResponse.json({ 
        error: "Failed to parse resume. API error.",
        success: false 
      }, { status: 500 });
    }
    
    // Store the parsed data with the user ID
    parsedDataStore.set(userID, {
      data: parsedData,
      extractedText,
      timestamp: new Date().toISOString()
    });
    
    // Return the parsed resume data along with the extracted text and user ID
    return NextResponse.json({ 
      success: true, 
      userID,
      data: parsedData,
      extractedText: extractedText.substring(0, 1000) + (extractedText.length > 1000 ? '...' : '') // Include first 1000 chars
    });
  } catch (error) {
    console.error('Resume parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to process resume' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve previously parsed resume
export async function GET(request: NextRequest) {
  try {
    const urlParams = request.nextUrl.searchParams;
    // Get the user ID from the search parameters
    const userID = urlParams.get('userID');
    
    if (!userID) {
      return NextResponse.json({ error: 'No user ID provided' }, { status: 400 });
    }
    
    // Get the stored data for this user
    const storedData = parsedDataStore.get(userID);
    
    if (!storedData) {
      return NextResponse.json({ 
        error: 'No parsed resume data found for this user',
        success: false 
      }, { status: 404 });
    }
    
    // Return the stored data
    return NextResponse.json({ 
      success: true, 
      ...storedData
    });
  } catch (error) {
    console.error('Error retrieving parsed resume:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve parsed resume data' },
      { status: 500 }
    );
  }
} 