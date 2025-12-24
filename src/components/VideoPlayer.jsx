import { useState, useEffect } from 'react';
import { Text, Box } from '@chakra-ui/react';

function VideoPlayer({ userName }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
  }, [userName]);

  if (loading) return <Text>Loading video...</Text>;
  if (error) return <Text color="red.500">{error}</Text>;
  if (!videoUrl) return <Text>No video available</Text>;

  return (
    <Box width="100%" maxWidth="800px" margin="0 auto">
      <video
        controls
        style={{ width: '100%', borderRadius: '8px' }}
        preload="metadata"
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </Box>
  );
}

export default VideoPlayer;