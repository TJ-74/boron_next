import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('userProfiles');
    
    // Get all profiles from the database
    const profiles = await collection.find({}, {
      projection: {
        uid: 1,
        name: 1,
        title: 1,
        email: 1,
        location: 1,
        profileImage: 1,
        _id: 0 // Exclude MongoDB _id field
      }
    }).toArray();
    
    return NextResponse.json({ 
      count: profiles.length,
      profiles: profiles
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch profiles',
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 