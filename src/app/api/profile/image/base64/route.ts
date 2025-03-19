import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

// POST endpoint to store a base64-encoded image
export async function POST(request: NextRequest) {
  try {
    // Parse the JSON data from the request body
    const data = await request.json();
    const { base64Data, uid, mimeType, fileName } = data;
    
    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' }, 
        { status: 400 }
      );
    }
    
    if (!base64Data) {
      return NextResponse.json(
        { error: 'Image data is required' }, 
        { status: 400 }
      );
    }
    
    console.log(`Received base64 image data for user ${uid}. Size: ${base64Data.length} bytes`);
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('userProfiles');
    
    // Update the user's profile with the base64 image data
    await collection.updateOne(
      { uid },
      { 
        $set: { 
          profileImageBase64: base64Data,
          profileImageMimeType: mimeType || 'image/jpeg',
          profileImageName: fileName || 'profile_image.jpg'
        } 
      },
      { upsert: true }
    );
    
    console.log(`Image data successfully saved for user ${uid}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Image uploaded successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error saving profile image:', error);
    return NextResponse.json(
      { error: 'Failed to save profile image' }, 
      { status: 500 }
    );
  }
} 