'use client';

import { useState, useEffect, useRef } from 'react';
import { Text, Box, Button } from '@chakra-ui/react';
import MuxPlayer from '@mux/mux-player-react';

function VideoPlayer({ userName, preloadedPlaybackId, revealedGifter, onRevealGifter, onVideoFetched, autoPlay = false }) {
  const [playbackId, setPlaybackId] = useState(preloadedPlaybackId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noVideo, setNoVideo] = useState(false);
  const hasFetched = useRef(false);

  // Single function to fetch video from MongoDB
  const fetchMongoDbVideo = async (source = 'fetch') => {
    console.log(`🚀 [${source}] Fetching video for ${userName}`);
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = `/api/youtubevideos?user_id=${userName.toLowerCase().trim()}`;
      console.log(`🌐 [${source}] API URL: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      console.log(`📡 [${source}] Response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`📦 [${source}] Response data:`, data);
      
      // Check if document exists
      if (data.length === 0) {
        console.info(`ℹ️  [${source}] No video document found for ${userName}`);
        setPlaybackId('');
        setNoVideo(true);
        setLoading(false);
        return;
      }
      
      // Get the most recent video
      const latestVideo = data.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )[0];
      
      // Check if playbackId exists and is not empty
      if (!latestVideo.playbackId || latestVideo.playbackId.trim() === '') {
        console.info(`ℹ️  [${source}] No playback ID found for ${userName}`);
        setPlaybackId('');
        setNoVideo(true);
        setLoading(false);
        return;
      }
      
      // Valid video found
      console.log(`✅ [${source}] Video found! Playback ID: ${latestVideo.playbackId}`);
      setPlaybackId(latestVideo.playbackId);
      setNoVideo(false);
      
      // Cache it
      if (onVideoFetched) {
        console.log(`💾 [${source}] Caching video for ${userName}`);
        onVideoFetched(userName, latestVideo.playbackId);
      }
      setLoading(false);
    } catch (err) {
      console.error(`❌ [${source}] Failed to fetch video:`, err);
      setError(err instanceof Error ? err.message : String(err));
      setPlaybackId('');
      setNoVideo(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    // If we have a preloaded playback ID, use it
    if (preloadedPlaybackId) {
      console.log(`✅ [VideoPlayer] Using preloaded playback ID for ${userName}`);
      setPlaybackId(preloadedPlaybackId);
      setNoVideo(false);
      return;
    }

    // If we already fetched, don't fetch again
    if (hasFetched.current) {
      return;
    }

    // Fetch once
    hasFetched.current = true;
    fetchMongoDbVideo('Initial');
  }, [userName, preloadedPlaybackId]);

  const handleRetry = () => {
    console.log(`🔄 [Manual Retry] User clicked retry for ${userName}`);
    fetchMongoDbVideo('Retry');
  };

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
  
  if (!playbackId || noVideo) return (
    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" width="100%" height="85vh" p={8} bg="black">
      <Text fontSize="2xl" color="white" mb={4} textAlign="center">
        No video available for {userName}
      </Text>
      <Button
        onClick={handleRetry}
        bg="white"
        color="#f24236"
        size="lg"
        px={6}
        mb={4}
        _hover={{ bg: "#f5f5f5" }}
      >
        Retry Fetch Video
      </Button>
      {revealedGifter ? (
        <Box textAlign="center">
          <Text fontSize="xl" color="white" mb={2}>
            Your Secret Santa is:
          </Text>
          <Text fontSize="3xl" color="#f24236" fontWeight="bold" bg="white" px={6} py={3} borderRadius="md">
            {revealedGifter}
          </Text>
        </Box>
      ) : (
        <Button
          onClick={onRevealGifter}
          bg="#f24236"
          color="white"
          size="lg"
          px={6}
          _hover={{ bg: "#d63529" }}
        >
          Reveal My Secret Santa
        </Button>
      )}
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