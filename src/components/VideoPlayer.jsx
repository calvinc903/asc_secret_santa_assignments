import { useState, useEffect } from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import { Text } from '@chakra-ui/react';

function VideoPlayer({ userName }) {
  const [videoId, setVideoId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await fetch(`/api/youtubevideos?user_id=${userName.toLowerCase().trim()}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        } // <-- Added closing curly brace here
        const data = await response.json();
        if (data.length === 1) {
          setVideoId(data[0].videoURL);
        } else {
          setVideoId('');
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
  if (!videoId) return <Text>No video available</Text>;

  return (
    <LiteYouTubeEmbed
      id={videoId}
      title="User Submitted Video"
      poster="maxresdefault" 
    />
  );
}

export default VideoPlayer;