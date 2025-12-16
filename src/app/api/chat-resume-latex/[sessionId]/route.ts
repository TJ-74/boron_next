import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for LaTeX content (temporary sessions)
// In production, you might want to use Redis or a database
const latexStorage = new Map<string, { latex: string; timestamp: number }>();

// Cleanup old sessions (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [sessionId, data] of latexStorage.entries()) {
    if (data.timestamp < oneHourAgo) {
      latexStorage.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Run cleanup every 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    let { sessionId } = params;
    
    // Remove .tex extension if present
    if (sessionId.endsWith('.tex')) {
      sessionId = sessionId.slice(0, -4);
    }
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Retrieve LaTeX from storage
    const data = latexStorage.get(sessionId);
    
    if (!data) {
      return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 });
    }
    
    // Return the LaTeX content
    return new NextResponse(data.latex, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `inline; filename="resume.tex"`,
      },
    });
  } catch (error) {
    console.error('Error retrieving LaTeX:', error);
    return NextResponse.json({ error: 'Failed to retrieve LaTeX' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const { latex } = await request.json();
    
    if (!sessionId || !latex) {
      return NextResponse.json({ error: 'Session ID and LaTeX content are required' }, { status: 400 });
    }
    
    // Store LaTeX with timestamp
    latexStorage.set(sessionId, {
      latex,
      timestamp: Date.now()
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing LaTeX:', error);
    return NextResponse.json({ error: 'Failed to store LaTeX' }, { status: 500 });
  }
}

