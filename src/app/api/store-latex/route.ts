import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth } from '@/app/lib/firebase';

// Create a temporary directory for storing LaTeX files
const TEMP_DIR = path.join(process.cwd(), 'tmp');

// Ensure the temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user from the request
    // In a real implementation, you would verify the user's authentication token
    // For now, we'll assume the user is authenticated if they can access this endpoint
    
    // Parse the request body
    const { latexCode, userId } = await request.json();
    
    if (!latexCode) {
      return NextResponse.json(
        { error: 'LaTeX code is required' },
        { status: 400 }
      );
    }
    
    // Generate a unique filename based on the user ID or a timestamp
    const filename = userId 
      ? `user_${userId}_Resume.tex`
      : `resume_${Date.now()}.tex`;
    
    const filePath = path.join(TEMP_DIR, filename);
    
    // Write the LaTeX code to a file
    fs.writeFileSync(filePath, latexCode);
    
    // Return the URL to the LaTeX file
    // In a production environment, this would be a fully qualified URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || `${request.nextUrl.origin}/api`;
    const fileUrl = `${baseUrl}/latex/${filename}`;
    
    return NextResponse.json({
      success: true,
      fileUrl,
    });
  } catch (error) {
    console.error('Error storing LaTeX code:', error);
    return NextResponse.json(
      { error: 'Failed to store LaTeX code' },
      { status: 500 }
    );
  }
} 