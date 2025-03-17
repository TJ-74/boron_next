import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to the temporary directory where LaTeX files are stored
const TEMP_DIR = path.join(process.cwd(), 'tmp');

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    
    // Validate filename to prevent directory traversal attacks
    if (!filename || filename.includes('..') || !filename.endsWith('.tex')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }
    
    const filePath = path.join(TEMP_DIR, filename);
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Return the file content with appropriate headers
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/x-tex',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error serving LaTeX file:', error);
    return NextResponse.json(
      { error: 'Failed to serve LaTeX file' },
      { status: 500 }
    );
  }
} 