import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory storage for LaTeX content (with expiry)
const latexSessions = new Map<string, { content: string; expiry: number }>();

// Cleanup expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of latexSessions.entries()) {
    if (now > session.expiry) {
      latexSessions.delete(sessionId);
    }
  }
}, 60000); // Clean up every minute

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const { latexContent } = await request.json();

    if (!sessionId || !latexContent) {
      return NextResponse.json(
        { error: 'Session ID and LaTeX content are required' },
        { status: 400 }
      );
    }

    // Store the LaTeX content with a 1-hour expiry
    latexSessions.set(sessionId, {
      content: latexContent,
      expiry: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing LaTeX content:', error);
    return NextResponse.json(
      { error: 'Failed to store LaTeX content' },
      { status: 500 }
    );
  }
}

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

    const session = latexSessions.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    // Check if session has expired
    if (Date.now() > session.expiry) {
      latexSessions.delete(sessionId);
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 404 }
      );
    }

    // Return the LaTeX content
    return new NextResponse(session.content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'inline; filename="resume.tex"',
      },
    });
  } catch (error) {
    console.error('Error retrieving LaTeX content:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve LaTeX content' },
      { status: 500 }
    );
  }
}

