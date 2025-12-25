import { useState, useEffect } from 'react';
import { Text, Box } from '@chakra-ui/react';

function VideoPlayer({ userName, preloadedUrl, autoPlay = false }) {
  const [videoUrl, setVideoUrl] = useState(preloadedUrl || '');
  const [loading, setLoading] = useState(!preloadedUrl);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If we already have a preloaded URL, use it
    if (preloadedUrl) {
      setVideoUrl(preloadedUrl);
      setLoading(false);
      return;
    }

    const fetchVideo = async () => {
      try {
        // Get video metadata from database
        const response = await fetch(`/api/youtubevideos?user_id=${userName.toLowerCase().trim()}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.length > 0) {
          // Get the most recent video
          const latestVideo = data.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
          )[0];
          
          const objectKey = latestVideo.videoURL;
          
          // Get signed URL from backend
          const urlResponse = await fetch('/api/video-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ objectKey }),
          });
          
          if (!urlResponse.ok) {
            throw new Error('Failed to get video URL');
          }
          
          const { viewUrl } = await urlResponse.json();
          setVideoUrl(viewUrl);
        } else {
          setVideoUrl('');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [userName, preloadedUrl]);

  if (loading) return <Text>Loading video...</Text>;
  if (error) return <Text color="red.500">{error}</Text>;
  if (!videoUrl) return <Text>No video available</Text>;

  return (
    <Box width="100%" height="100%" display="flex" alignItems="center" justifyContent="center" bg="black">
      <video
        controls
        autoPlay={autoPlay}
        style={{ width: '100%', height: '85vh', objectFit: 'contain' }}
        preload="metadata"
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </Box>
  );
}

export default VideoPlayer;