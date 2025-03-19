// Test script for image upload functionality
console.log('Running test for image upload functionality');

// Create a simple base64 image (1x1 pixel transparent GIF)
const testBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const testUserId = 'test-user-123';

async function testImageUpload() {
  try {
    console.log('1. Testing image upload with base64 data');
    // Create form data for the test
    const formData = new FormData();
    const testFile = new File([Buffer.from(testBase64, 'base64')], 'test.gif', { type: 'image/gif' });
    formData.append('image', testFile);
    formData.append('uid', testUserId);
    formData.append('base64Data', testBase64);
    
    // Upload test image
    const uploadResponse = await fetch('/api/profile/image', {
      method: 'POST',
      body: formData,
    });
    
    const uploadResult = await uploadResponse.json();
    console.log('Upload response:', uploadResult);
    
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResult.error || 'Unknown error'}`);
    }
    
    console.log('2. Testing image retrieval');
    // Try to retrieve the uploaded image
    const imageUrl = `/api/profile/image/${testUserId}?t=${new Date().getTime()}`;
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      throw new Error(`Image retrieval failed: ${errorText}`);
    }
    
    const contentType = imageResponse.headers.get('Content-Type');
    console.log('Image retrieved successfully with content type:', contentType);
    
    // Get the image as blob
    const blob = await imageResponse.blob();
    console.log('Retrieved image size:', blob.size, 'bytes');
    
    return { success: true };
  } catch (error) {
    console.error('Test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run the test (needs to be called from browser console)
window.runImageTest = testImageUpload;
console.log('To run the test, call window.runImageTest() in the browser console');

export {}; 