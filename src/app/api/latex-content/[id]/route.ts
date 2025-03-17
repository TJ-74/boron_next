import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the LaTeX content from the query parameters
    const latexCode = request.nextUrl.searchParams.get('content');
    
    if (!latexCode) {
      return NextResponse.json(
        { error: 'LaTeX content is required' },
        { status: 400 }
      );
    }
    
    // Return the LaTeX content with appropriate headers
    return new NextResponse(latexCode, {
      headers: {
        'Content-Type': 'application/x-tex',
        'Content-Disposition': `attachment; filename="resume_${params.id}.tex"`,
        'Access-Control-Allow-Origin': '*', // Allow cross-origin requests
      },
    });
  } catch (error) {
    console.error('Error serving LaTeX content:', error);
    return NextResponse.json(
      { error: 'Failed to serve LaTeX content' },
      { status: 500 }
    );
  }
} 