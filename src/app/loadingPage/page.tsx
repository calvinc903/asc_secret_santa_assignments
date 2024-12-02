'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

function LoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gifter = searchParams.get('gifter');

  useEffect(() => {
    const handleVideoEnd = () => {
      console.log("LoadingPage received gifter:", gifter); // Debugging statement
      router.push(`/assignments?gifter=${gifter}`);
    };
    const videoElement = document.getElementById('loading-video') as HTMLVideoElement;
    videoElement.addEventListener('ended', handleVideoEnd);

    return () => {
      videoElement.removeEventListener('ended', handleVideoEnd);
    };
  }, [router, gifter]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
      }}
    >
      <video
        id="loading-video"
        src="/loading_video.mp4" // Ensure this file is in the public directory
        autoPlay
        muted
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}

export default function LoadingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoadingContent />
    </Suspense>
  );
}