'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface ImageFallbackProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback?: string;
  fill?: boolean;
}

export default function ImageFallback({
  src,
  alt,
  width,
  height,
  className = '',
  fallback = '/user.png',
  fill = false
}: ImageFallbackProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(src);
  
  // Reset the component when the src changes
  useEffect(() => {
    setImgSrc(src);
    setLoading(true);
    setError(false);
  }, [src]);
  
  // Refresh the image after a delay if it fails to load
  useEffect(() => {
    if (error && imgSrc === src) {
      const timer = setTimeout(() => {
        setImgSrc(`${src}?retry=${new Date().getTime()}`);
        setError(false);
        setLoading(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [error, imgSrc, src]);

  const containerStyle = fill ? {} : (width && height ? { width, height } : {});
  const imageProps = fill 
    ? { fill: true, sizes: '(max-width: 768px) 64px, (max-width: 1024px) 80px, 112px' }
    : { width: width || 112, height: height || 112 };

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''}`} style={containerStyle}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/30 z-10">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/30 z-10">
          
        </div>
      )}
      
      <Image
        src={error ? fallback : imgSrc}
        alt={alt}
        {...imageProps}
        className={`${fill ? 'object-cover' : ''} ${className} ${error ? 'opacity-70' : ''}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          if (!error) {
            setError(true);
            setLoading(false);
          }
        }}
        unoptimized={imgSrc.startsWith('/api/')}
      />
    </div>
  );
} 