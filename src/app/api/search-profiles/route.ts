import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q');
    
    console.log('Search query received:', query);
    
    if (!query) {
      console.log('No query provided, returning empty results');
      return NextResponse.json({ users: [] }, { status: 200 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('userProfiles');
    
    // Log MongoDB connection success
    console.log('MongoDB connection successful');
    
    // Create a text search query
    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { title: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } }
      ]
    };
    
    console.log('Executing search with query:', JSON.stringify(searchQuery));
    
    const users = await collection.find(searchQuery, {
      projection: {
        uid: 1,
        name: 1,
        title: 1,
        profileImage: 1,
        email: 1
      },
      limit: 10
    }).toArray();
    
    console.log(`Search results found: ${users.length}`);
    
    return NextResponse.json({ 
      users: users.map(user => ({
        uid: user.uid,
        name: user.name,
        title: user.title || '',
        profileImage: user.profileImage || null,
        email: user.email
      }))
    }, { status: 200 });
  } catch (error) {
    console.error('Error searching profiles:', error);
    return NextResponse.json({ 
      error: 'Failed to search profiles',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 