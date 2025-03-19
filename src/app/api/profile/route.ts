import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

// Interface for user profile summary
export interface UserProfileSummary {
  uid: string;
  name: string;
  email: string;
  about: string;
  profileImage?: string;
  profileImageBase64?: string; // Base64 encoded image
  profileImageMimeType?: string; // MIME type of the image
  profileImageName?: string; // Original filename
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

// Add the dynamic config
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');
    
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
    const isArrayUpdate = request.nextUrl.searchParams.get('arrayUpdate') === 'true';
    const arrayType = request.nextUrl.searchParams.get('arrayType');
    
    console.log("MongoDB API: Received profile data to save:", {
      uid: profileData.uid,
      name: profileData.name,
      email: profileData.email,
      about: profileData.about ? 'Present (length: ' + profileData.about.length + ')' : 'Missing',
      experiences: profileData.experiences ? `[${profileData.experiences.length} items]` : '[]',
      education: profileData.education ? `[${profileData.education.length} items]` : '[]',
      skills: profileData.skills ? `[${profileData.skills.length} items]` : '[]',
      projects: profileData.projects ? `[${profileData.projects.length} items]` : '[]',
      isArrayUpdate: isArrayUpdate,
      arrayType: arrayType
    });
    
    if (!profileData.uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('userProfiles');
    
    // Handle array updates specially to avoid overwriting entire arrays
    if (isArrayUpdate && arrayType) {
      console.log(`MongoDB API: Performing array update for ${arrayType}`);
      
      // Check if the document exists first
      const existingDoc = await collection.findOne({ uid: profileData.uid });
      console.log(`MongoDB API: Existing document found: ${!!existingDoc}`);
      
      // Handle different types of arrays
      if (arrayType === 'experience' && profileData.experiences && profileData.experiences.length > 0) {
        const newItem = profileData.experiences[0]; // Assuming we're adding one item at a time
        console.log(`MongoDB API: Adding new ${arrayType} item:`, newItem);
        
        // If document doesn't exist yet, initialize with empty arrays
        if (!existingDoc) {
          await collection.insertOne({
            uid: profileData.uid,
            name: profileData.name || '',
            email: profileData.email || '',
            about: profileData.about || '',
            phone: profileData.phone || '',
            location: profileData.location || '',
            title: profileData.title || '',
            profileImage: profileData.profileImage || '',
            linkedinUrl: profileData.linkedinUrl || '',
            githubUrl: profileData.githubUrl || '',
            portfolioUrl: profileData.portfolioUrl || '',
            experiences: [newItem],
            education: [],
            skills: [],
            projects: []
          });
        } else {
          // Add to existing array without overwriting
          await collection.updateOne(
            { uid: profileData.uid },
            { $push: { experiences: newItem } }
          );
        }
      } 
      else if (arrayType === 'education' && profileData.education && profileData.education.length > 0) {
        const newItem = profileData.education[0];
        console.log(`MongoDB API: Adding new ${arrayType} item:`, newItem);
        
        // If document doesn't exist yet, initialize with empty arrays
        if (!existingDoc) {
          await collection.insertOne({
            uid: profileData.uid,
            name: profileData.name || '',
            email: profileData.email || '',
            about: profileData.about || '',
            phone: profileData.phone || '',
            location: profileData.location || '',
            title: profileData.title || '',
            profileImage: profileData.profileImage || '',
            linkedinUrl: profileData.linkedinUrl || '',
            githubUrl: profileData.githubUrl || '',
            portfolioUrl: profileData.portfolioUrl || '',
            education: [newItem],
            experiences: [],
            skills: [],
            projects: []
          });
        } else {
          // Add to existing array without overwriting
          await collection.updateOne(
            { uid: profileData.uid },
            { $push: { education: newItem } }
          );
        }
      }
      else if (arrayType === 'skill' && profileData.skills && profileData.skills.length > 0) {
        const newItem = profileData.skills[0];
        console.log(`MongoDB API: Adding new ${arrayType} item:`, newItem);
        
        // If document doesn't exist yet, initialize with empty arrays
        if (!existingDoc) {
          await collection.insertOne({
            uid: profileData.uid,
            name: profileData.name || '',
            email: profileData.email || '',
            about: profileData.about || '',
            phone: profileData.phone || '',
            location: profileData.location || '',
            title: profileData.title || '',
            profileImage: profileData.profileImage || '',
            linkedinUrl: profileData.linkedinUrl || '',
            githubUrl: profileData.githubUrl || '',
            portfolioUrl: profileData.portfolioUrl || '',
            skills: [newItem],
            experiences: [],
            education: [],
            projects: []
          });
        } else {
          // Add to existing array without overwriting
          await collection.updateOne(
            { uid: profileData.uid },
            { $push: { skills: newItem } }
          );
        }
      }
      else if (arrayType === 'project' && profileData.projects && profileData.projects.length > 0) {
        const newItem = profileData.projects[0];
        console.log(`MongoDB API: Adding new ${arrayType} item:`, newItem);
        
        // If document doesn't exist yet, initialize with empty arrays
        if (!existingDoc) {
          await collection.insertOne({
            uid: profileData.uid,
            name: profileData.name || '',
            email: profileData.email || '',
            about: profileData.about || '',
            phone: profileData.phone || '',
            location: profileData.location || '',
            title: profileData.title || '',
            profileImage: profileData.profileImage || '',
            linkedinUrl: profileData.linkedinUrl || '',
            githubUrl: profileData.githubUrl || '',
            portfolioUrl: profileData.portfolioUrl || '',
            projects: [newItem],
            experiences: [],
            education: [],
            skills: []
          });
        } else {
          // Add to existing array without overwriting
          await collection.updateOne(
            { uid: profileData.uid },
            { $push: { projects: newItem } }
          );
        }
      }
      else {
        console.log("MongoDB API: Array update requested but no valid array data found");
        return NextResponse.json({ error: 'Invalid array update data' }, { status: 400 });
      }
    }
    else {
      // Regular full document update
      console.log("MongoDB API: Updating profile document for uid:", profileData.uid);
      
      await collection.updateOne(
        { uid: profileData.uid },
        { $set: profileData },
        { upsert: true }
      );
    }
    
    console.log("MongoDB API: Profile saved successfully");
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('MongoDB API ERROR: Error saving profile:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
} 