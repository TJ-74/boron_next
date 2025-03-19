'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface ImageFallbackProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallback?: string;
}

export default function ImageFallback({
  src,
  alt,
  width,
  height,
  className = '',
  fallback = '/placeholder-avatar.png'
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

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/30">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/30">
          <span className="text-xs text-gray-400">Failed to load</span>
        </div>
      )}
      
      <Image
        src={error ? fallback : imgSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${error ? 'opacity-70' : ''}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          console.error(`Failed to load image: ${imgSrc}`);
          setError(true);
          setLoading(false);
        }}
      />
    </div>
  );
} 