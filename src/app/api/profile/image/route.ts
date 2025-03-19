import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    // Parse the form data which includes the image and user ID
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const uid = formData.get('uid') as string | null;
    const base64Data = formData.get('base64Data') as string | null;
    
    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' }, 
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('userProfiles');
    
    let imageData: string;
    let mimeType: string;
    let fileName: string;
    
    if (base64Data) {
      // If base64 data is provided, use it directly
      imageData = base64Data;
      
      // Get mime type and filename from the image file if available
      mimeType = imageFile?.type || 'image/jpeg';
      fileName = imageFile?.name || 'profile_image.jpg';
    } else if (imageFile) {
      // Otherwise convert file to base64
      try {
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        imageData = buffer.toString('base64');
        mimeType = imageFile.type;
        fileName = imageFile.name;
      } catch (error) {
        console.error('Error converting file to base64:', error);
        return NextResponse.json(
          { error: 'Failed to process image file' }, 
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Image data is required' }, 
        { status: 400 }
      );
    }
    
    console.log('Saving image data. MIME type:', mimeType, 'Base64 length:', imageData.length);
    
    // Update the user's profile with the base64 image data
    await collection.updateOne(
      { uid },
      { 
        $set: { 
          profileImageBase64: imageData,
          profileImageMimeType: mimeType,
          profileImageName: fileName
        } 
      },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error saving profile image:', error);
    return NextResponse.json(
      { error: 'Failed to save profile image' }, 
      { status: 500 }
    );
  }
} 