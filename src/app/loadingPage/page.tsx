'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoadingPage({ gifter }: { gifter: string }) {
  const router = useRouter();

  useEffect(() => {
    console.log("LoadingPage received gifter:", gifter); // Debugging statement

    const handleVideoEnd = () => {
      console.log("loading screen " + gifter);
      router.push(`/assignments?gifter=${encodeURIComponent(gifter)}`);
    };

    const videoElement = document.getElementById('loading-video') as HTMLVideoElement;
    videoElement.addEventListener('ended', handleVideoEnd);

    return () => {
      videoElement.removeEventListener('ended', handleVideoEnd);
    };
  }, [gifter, router]);

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