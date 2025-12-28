'use client';

import { useState, useEffect } from 'react';
import { Text, Box } from '@chakra-ui/react';
import MuxPlayer from '@mux/mux-player-react';

function VideoPlayer({ userName, preloadedPlaybackId, autoPlay = false }) {
  const [playbackId, setPlaybackId] = useState(preloadedPlaybackId || '');
  const [loading, setLoading] = useState(!preloadedPlaybackId);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If we already have a preloaded playback ID, use it
    if (preloadedPlaybackId) {
      setPlaybackId(preloadedPlaybackId);
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
          
          // Use the playbackId directly from the database
          if (latestVideo.playbackId) {
            setPlaybackId(latestVideo.playbackId);
          } else {
            // Old video from R2 system - needs to be re-uploaded
            setError('Please re-upload your video using the new system');
          }
        } else {
          setPlaybackId('');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [userName, preloadedPlaybackId]);

  if (loading) return (
    <Box width="100%" height="85vh" display="flex" alignItems="center" justifyContent="center" bg="black">
      <Text color="white">Loading video...</Text>
    </Box>
  );
  if (error) return (
    <Box width="100%" height="85vh" display="flex" alignItems="center" justifyContent="center" bg="black">
      <Text color="red.300">{error}</Text>
    </Box>
  );
  if (!playbackId) return (
    <Box width="100%" height="85vh" display="flex" alignItems="center" justifyContent="center" bg="black">
      <Text color="white">No video available</Text>
    </Box>
  );

  return (
    <Box width="100%" height="100%" display="flex" alignItems="center" justifyContent="center" bg="black">
      <MuxPlayer
        playbackId={playbackId}
        metadata={{
          video_title: `${userName}'s Secret Santa Gift`,
        }}
        muted={false}
        style={{ width: '100%', height: '85vh' }}
        streamType="on-demand"
      />
    </Box>
  );
}

export default VideoPlayer;