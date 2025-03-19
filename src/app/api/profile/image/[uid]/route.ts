import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

// Helper function to validate base64 data for Node.js
function isValidBase64(str: string): boolean {
  try {
    // Basic validation - check if it only contains valid base64 characters
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(str)) {
      return false;
    }
    
    // Try to decode and re-encode to catch invalid padding
    Buffer.from(str, 'base64').toString('base64');
    return true;
  } catch (err) {
    return false;
  }
}

// GET endpoint to retrieve a user's profile image
export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const uid = params.uid;
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('userProfiles');
    
    // Only fetch the fields we need
    const profile = await collection.findOne(
      { uid },
      { projection: { profileImageBase64: 1, profileImageMimeType: 1 } }
    );
    
    if (!profile || !profile.profileImageBase64) {
      console.error('Profile image not found for user:', uid);
      return NextResponse.json({ error: 'Profile image not found' }, { status: 404 });
    }
    
    // Validate the base64 data format
    if (!isValidBase64(profile.profileImageBase64)) {
      console.error('Invalid base64 data found for user:', uid);
      return NextResponse.json({ error: 'Invalid image data format' }, { status: 500 });
    }
    
    try {
      // Convert base64 string to buffer
      const buffer = Buffer.from(profile.profileImageBase64, 'base64');
      const mimeType = profile.profileImageMimeType || 'image/jpeg';
      
      console.log('Successfully retrieved image. MIME type:', mimeType, 'Buffer length:', buffer.length);
      
      // Calculate a simple hash of the image data for ETag
      const imageHash = Buffer.from(profile.profileImageBase64.substring(0, 50)).toString('base64');
      
      // Return the image as a response with appropriate content type and caching
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=86400, immutable', // Cache for 24 hours
          'ETag': `"${imageHash}"`
        }
      });
    } catch (err) {
      console.error('Failed to process image data:', err);
      return NextResponse.json({ error: 'Invalid image data' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching profile image:', error);
    return NextResponse.json({ error: 'Failed to fetch profile image' }, { status: 500 });
  }
} 