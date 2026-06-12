'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';

interface CameraContextValue {
  videoRef: RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  error: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureFrame: () => string | null;
}

const CameraContext = createContext<CameraContextValue | null>(null);

export function CameraProvider({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null!);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState(false);

  const startCamera = useCallback(async () => {
    if (streamRef.current) return;
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: 1920, height: 1080, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = media;
      setStream(media);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play();
      }
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.92);
  }, []);

  return (
    <CameraContext.Provider
      value={{ videoRef, stream, error, startCamera, stopCamera, captureFrame }}
    >
      {children}
    </CameraContext.Provider>
  );
}

export function useCamera(): CameraContextValue {
  const ctx = useContext(CameraContext);
  if (!ctx) throw new Error('useCamera requires CameraProvider');
  return ctx;
}
