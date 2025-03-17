import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

// Interface for user profile summary
export interface UserProfileSummary {
  uid: string;
  name: string;
  email: string;
  about: string;
  profileImage?: string;
  phone?: string;
  location?: string;
  title?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  experiences?: Experience[];
  education?: Education[];
  skills?: Skill[];
  projects?: Project[];
}

interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  includeInResume?: boolean;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  cgpa: string;
  includeInResume?: boolean;
}

interface Skill {
  id: string;
  name: string;
  domain: string;
  includeInResume?: boolean;
}

interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string;
  startDate: string;
  endDate: string;
  projectUrl?: string;
  githubUrl?: string;
  includeInResume?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('userProfiles');
    
    const profile = await collection.findOne({ uid });
    
    if (!profile) {
      return NextResponse.json({ profile: null }, { status: 404 });
    }
    
    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const profileData = await request.json();
    
    if (!profileData.uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('userProfiles');
    
    await collection.updateOne(
      { uid: profileData.uid },
      { $set: profileData },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
} 