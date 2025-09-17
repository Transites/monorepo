import { useState, useEffect } from 'react';

type ImageOrientation = 'portrait' | 'landscape' | 'square' | 'loading';

interface UseImageOrientationResult {
  orientation: ImageOrientation;
  isLoading: boolean;
  error: boolean;
}

export function useImageOrientation(imageUrl: string | undefined): UseImageOrientationResult {
  const [orientation, setOrientation] = useState<ImageOrientation>('loading');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setOrientation('loading');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(false);

    const img = new Image();
    
    img.onload = () => {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      
      if (aspectRatio > 1.1) {
        setOrientation('landscape');
      } else if (aspectRatio < 0.9) {
        setOrientation('portrait');
      } else {
        setOrientation('square');
      }
      
      setIsLoading(false);
    };

    img.onerror = () => {
      setError(true);
      setIsLoading(false);
      setOrientation('landscape'); // fallback to current behavior
    };

    img.src = imageUrl;
  }, [imageUrl]);

  return {
    orientation,
    isLoading,
    error
  };
}