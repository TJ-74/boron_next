'use client';

import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Loader2 } from 'lucide-react';

// Define the types that would normally come from react-easy-crop/types
interface Point {
  x: number;
  y: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedImageBlob: Blob, base64: string) => void;
}

// Function to create an image from a url
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // needed for CORS
    image.src = url;
  });

// Function to get cropped image
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<{ blob: Blob; base64: string }> {
  console.log('Creating cropped image with dimensions:', pixelCrop);
  
  const image = await createImage(imageSrc);
  console.log('Original image loaded, dimensions:', image.width, 'x', image.height);
  
  // For profile avatars, we usually don't need very large images
  // Avatar size - smaller than previous implementation
  const MAX_WIDTH = 300;
  const MAX_HEIGHT = 300;
  
  // Calculate the actual dimensions to use (maintaining aspect ratio)
  let targetWidth = pixelCrop.width;
  let targetHeight = pixelCrop.height;
  
  // Resize if necessary
  if (targetWidth > MAX_WIDTH || targetHeight > MAX_HEIGHT) {
    if (targetWidth > targetHeight) {
      // Landscape orientation
      targetHeight = Math.round((targetHeight / targetWidth) * MAX_WIDTH);
      targetWidth = MAX_WIDTH;
    } else {
      // Portrait or square orientation
      targetWidth = Math.round((targetWidth / targetHeight) * MAX_HEIGHT);
      targetHeight = MAX_HEIGHT;
    }
    console.log('Resizing to more manageable dimensions:', targetWidth, 'x', targetHeight);
  }
  
  // Create two canvases - one for cropping at original size, one for resizing
  const cropCanvas = document.createElement('canvas');
  const ctx = cropCanvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set initial canvas size to the cropped area
  cropCanvas.width = pixelCrop.width;
  cropCanvas.height = pixelCrop.height;
  console.log('Canvas created with dimensions:', cropCanvas.width, 'x', cropCanvas.height);

  // Draw the cropped image onto the first canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  console.log('Image drawn to canvas');
  
  // Create a second canvas for resizing if needed
  const resizeCanvas = document.createElement('canvas');
  resizeCanvas.width = targetWidth;
  resizeCanvas.height = targetHeight;
  const resizeCtx = resizeCanvas.getContext('2d');
  
  if (!resizeCtx) {
    throw new Error('No 2d context for resize canvas');
  }
  
  // Draw the cropped image onto the resize canvas
  resizeCtx.drawImage(
    cropCanvas,
    0, 
    0, 
    pixelCrop.width, 
    pixelCrop.height,
    0, 
    0, 
    targetWidth, 
    targetHeight
  );
  console.log('Image resized to:', targetWidth, 'x', targetHeight);

  // Get the base64 data URL from the resized canvas
  // Lower quality for profile photos is usually acceptable
  const base64 = resizeCanvas.toDataURL('image/jpeg', 0.8);
  console.log('Base64 data URL generated, length:', base64.length);
  
  // Separate the base64 data from the prefix
  const base64Data = base64.split(',')[1];
  console.log('Base64 data after removing prefix, length:', base64Data.length);

  // Convert canvas to blob
  return new Promise<{ blob: Blob; base64: string }>((resolve, reject) => {
    resizeCanvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create blob from canvas');
        reject(new Error('Canvas is empty'));
        return;
      }
      console.log('Blob created from canvas, size:', blob.size, 'bytes');
      resolve({ 
        blob,
        base64: base64Data
      });
    }, 'image/jpeg', 0.8); // JPEG at 80% quality - good for avatars
  });
}

export default function ImageCropModal({
  open,
  onClose,
  imageUrl,
  onCropComplete
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal opens/closes or imageUrl changes
  useEffect(() => {
    if (open && imageUrl) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [open, imageUrl]);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels) {
      console.warn('No cropped area selected');
      return;
    }

    setIsLoading(true);
    try {
      const { blob, base64 } = await getCroppedImg(imageUrl, croppedAreaPixels);
      onCropComplete(blob, base64);
      onClose();
    } catch (e) {
      console.error('Error cropping image:', e);
      alert('Failed to crop image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [croppedAreaPixels, imageUrl, onCropComplete, onClose]);


  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crop Profile Image</DialogTitle>
        </DialogHeader>

        <div className="relative w-full h-80 bg-gray-900 overflow-hidden rounded-md" style={{ minHeight: '320px' }}>
          {!imageUrl || imageUrl === '' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-400">No image selected</p>
            </div>
          ) : (
            <div 
              className="relative" 
              style={{ 
                position: 'relative', 
                width: '100%', 
                height: '100%',
                minHeight: '320px'
              }}
            >
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onCropComplete={onCropCompleteCallback}
                cropShape="round"
                showGrid={false}
                classes={{
                  containerClassName: 'w-full h-full',
                  cropAreaClassName: 'border-2 border-white',
                }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center mt-2">
          <span className="text-xs text-gray-400 mr-2">Zoom:</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 