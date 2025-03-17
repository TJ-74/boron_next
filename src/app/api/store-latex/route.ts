import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { latexCode, userId } = await request.json();
    
    if (!latexCode) {
      return NextResponse.json(
        { error: 'LaTeX code is required' },
        { status: 400 }
      );
    }
    
    // Generate a unique identifier for the LaTeX content
    const uniqueId = userId || Date.now().toString();
    
    // Instead of storing the file, we'll encode the LaTeX content in a URL
    // that our other endpoint can use to serve the content directly
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || request.nextUrl.origin;
    
    // Create a URL to our latex-content endpoint with the content ID
    const fileUrl = `${baseUrl}/api/latex-content/${uniqueId}`;
    
    // Store the LaTeX content in the response for the client to cache
    return NextResponse.json({
      success: true,
      fileUrl,
      latexCode, // Include the LaTeX code in the response
    });
  } catch (error) {
    console.error('Error processing LaTeX code:', error);
    return NextResponse.json(
      { error: 'Failed to process LaTeX code' },
      { status: 500 }
    );
  }
} 