import { useState, useEffect } from 'react';
import { Text, Box } from '@chakra-ui/react';

const CLOUDFLARE_WORKER_URL = 'https://video-worker.ascsecretsanta.workers.dev';

function VideoPlayer({ userName }) {
  const [videoFileName, setVideoFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await fetch(`/api/youtubevideos?user_id=${userName.toLowerCase().trim()}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.length > 0) {
          // Get the most recent video (either the only one, or the newest if multiple exist)
          const latestVideo = data.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
          )[0];
          setVideoFileName(latestVideo.videoURL);
        } else {
          setVideoFileName('');
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
  if (!videoFileName) return <Text>No video available</Text>;

  return (
    <Box width="100%" maxWidth="800px" margin="0 auto">
      <video
        controls
        style={{ width: '100%', borderRadius: '8px' }}
        preload="metadata"
      >
        <source src={`${CLOUDFLARE_WORKER_URL}/${videoFileName}`} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </Box>
  );
}

export default VideoPlayer;