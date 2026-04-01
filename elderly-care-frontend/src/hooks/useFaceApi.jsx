import { useState, useEffect } from 'react';
import * as faceapi from '@vladmandic/face-api';

export function useFaceApi() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        if (isMounted) setIsLoaded(true);
      } catch (err) {
        console.error("Error loading face models:", err);
        if (isMounted) setError('Failed to load face recognition models.');
      }
    };

    loadModels();

    return () => {
      isMounted = false;
    };
  }, []);

  const getFaceDescriptor = async (videoElement) => {
    if (!isLoaded || !videoElement) return null;
    
    try {
      const detection = await faceapi.detectSingleFace(videoElement)
        .withFaceLandmarks()
        .withFaceDescriptor();
      return detection ? Array.from(detection.descriptor) : null;
    } catch (err) {
      console.warn("Face detection error:", err);
      return null;
    }
  };

  return { isLoaded, error, getFaceDescriptor, faceapi };
}
