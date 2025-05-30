import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';

export interface JobPosting {
  _id?: ObjectId;
  uid: string; // User ID from Firebase Auth
  recruiterName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  // Profile information
  profileImage?: string;
  title?: string;
  location?: string;
  linkedinUrl?: string;
}

export interface JobPostingInput {
  recruiterName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
}

// Helper function to get user profile from MongoDB
async function getUserProfile(uid: string) {
  try {
    const client = await clientPromise;
    const db = client.db('boron_app');
    const profileCollection = db.collection('userProfiles');
    
    const profile = await profileCollection.findOne({ uid });
    return profile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// GET - Fetch all job postings
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('boron_app');
    const collection = db.collection('jobPostings');
    
    // Check if filtering by user
    const uid = request.nextUrl.searchParams.get('uid');
    const status = request.nextUrl.searchParams.get('status');
    
    console.log('API: Fetching job postings from MongoDB', uid ? `for user: ${uid}` : '(all users)', status ? `with status: ${status}` : '');
    
    const query: any = {};
    if (uid) {
      query.uid = uid;
    }
    if (status) {
      query.status = status;
    } else {
      // Default to active posts only if no status is specified
      query.status = { $ne: 'completed' };
    }
    
    const jobPostings = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`API: Found ${jobPostings.length} job postings`);
    
    // Convert ObjectId to string for JSON serialization
    const serializedPostings = jobPostings.map(posting => ({
      ...posting,
      _id: posting._id.toString(),
    }));
    
    return NextResponse.json(serializedPostings);
  } catch (error) {
    console.error('API: Error fetching job postings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job postings' },
      { status: 500 }
    );
  }
}

// POST - Create a new job posting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, ...jobData }: { uid: string } & JobPostingInput = body;
    
    if (!uid) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }
    
    console.log('API: Creating new job posting for user:', uid);
    console.log('API: Job data:', jobData);
    
    const client = await clientPromise;
    const db = client.db('boron_app');
    const collection = db.collection('jobPostings');
    
    // Get user profile information
    const userProfile = await getUserProfile(uid);
    
    // Add metadata and profile information to the job posting
    const jobPostingWithMetadata = {
      ...jobData,
      uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      // Include profile information if available
      profileImage: userProfile?.profileImage || '',
      title: userProfile?.title || '',
      location: userProfile?.location || '',
      linkedinUrl: userProfile?.linkedinUrl || '',
    };

    console.log('API: Inserting job posting with metadata:', jobPostingWithMetadata);
    
    const result = await collection.insertOne(jobPostingWithMetadata);
    console.log('API: Job posting saved successfully with ID:', result.insertedId);
    
    return NextResponse.json({ 
      id: result.insertedId.toString(),
      message: 'Job posting created successfully'
    });
  } catch (error) {
    console.error('API: Error creating job posting:', error);
    return NextResponse.json(
      { error: 'Failed to create job posting' },
      { status: 500 }
    );
  }
}

// PUT - Update a job posting
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, uid, ...updateData }: { id: string; uid?: string } & Partial<JobPostingInput> = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Job posting ID is required' },
        { status: 400 }
      );
    }
    
    console.log('API: Updating job posting with ID:', id);
    console.log('API: Update data:', updateData);
    
    const client = await clientPromise;
    const db = client.db('boron_app');
    const collection = db.collection('jobPostings');
    
    // Build the query - if uid is provided, ensure user can only update their own posts
    const query: any = { _id: new ObjectId(id) };
    if (uid) {
      query.uid = uid;
    }
    
    const result = await collection.updateOne(
      query,
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Job posting not found or access denied' },
        { status: 404 }
      );
    }
    
    console.log('API: Job posting updated successfully');
    return NextResponse.json({ message: 'Job posting updated successfully' });
  } catch (error) {
    console.error('API: Error updating job posting:', error);
    return NextResponse.json(
      { error: 'Failed to update job posting' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a job posting
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const uid = url.searchParams.get('uid');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Job posting ID is required' },
        { status: 400 }
      );
    }
    
    console.log('API: Deleting job posting with ID:', id);
    
    const client = await clientPromise;
    const db = client.db('boron_app');
    const collection = db.collection('jobPostings');
    
    // Build the query - if uid is provided, ensure user can only delete their own posts
    const query: any = { _id: new ObjectId(id) };
    if (uid) {
      query.uid = uid;
    }
    
    const result = await collection.deleteOne(query);
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Job posting not found or access denied' },
        { status: 404 }
      );
    }
    
    console.log('API: Job posting deleted successfully');
    return NextResponse.json({ message: 'Job posting deleted successfully' });
  } catch (error) {
    console.error('API: Error deleting job posting:', error);
    return NextResponse.json(
      { error: 'Failed to delete job posting' },
      { status: 500 }
    );
  }
} 