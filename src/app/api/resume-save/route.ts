import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

interface SaveResumeData {
  uid: string;
  jobDescription: string;
  resumeData: any;
  chatHistory: any[];
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const { uid, jobDescription, resumeData, chatHistory } = await request.json();

    if (!uid || !resumeData) {
      return NextResponse.json(
        { error: 'Missing required fields: uid and resumeData' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('boron_resume');
    const collection = db.collection('generated_resumes');

    const resumeDocument: SaveResumeData = {
      uid,
      jobDescription: jobDescription || '',
      resumeData,
      chatHistory: chatHistory || [],
      timestamp: new Date().toISOString(),
    };

    // Save or update the resume (replace existing resume for the same user)
    const result = await collection.replaceOne(
      { uid },
      resumeDocument,
      { upsert: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Resume saved successfully',
      id: result.upsertedId || 'updated'
    });

  } catch (error) {
    console.error('Error saving resume:', error);
    return NextResponse.json(
      { error: 'Failed to save resume' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'Missing uid parameter' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('boron_resume');
    const collection = db.collection('generated_resumes');

    const resume = await collection.findOne({ uid });

    if (!resume) {
      return NextResponse.json(
        { error: 'No saved resume found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        jobDescription: resume.jobDescription,
        resumeData: resume.resumeData,
        chatHistory: resume.chatHistory,
        timestamp: resume.timestamp,
      }
    });

  } catch (error) {
    console.error('Error loading resume:', error);
    return NextResponse.json(
      { error: 'Failed to load resume' },
      { status: 500 }
    );
  }
} 