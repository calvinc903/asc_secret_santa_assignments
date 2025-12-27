'use client'

import { useState, useEffect, useRef } from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
import VideoPlayer from '@/components/VideoPlayer'; 
import { useUsers } from '@/contexts/UserContext';
import {
  Box,
  Stack,
  Text,
  Grid,
  Card,
  Button,
  CloseButton,
  Portal,
  Dialog,
  For
} from '@chakra-ui/react';

export default function GiftsPage() {
  const { users: userNames, loading, error } = useUsers();
  const [preloadedPlaybackIds, setPreloadedPlaybackIds] = useState<Record<string, string>>({});
  const [clickedCards, setClickedCards] = useState<Set<string>>(new Set());
  const hasPreloaded = useRef(false);

  // Preload all playback IDs when users are loaded from cache or API (only once)
  useEffect(() => {
    if (userNames.length === 0 || hasPreloaded.current) return;
    hasPreloaded.current = true;

    const preloadAllVideos = async () => {
      console.log(`🎬 Starting to preload videos for ${userNames.length} users...`);
      const playbackIdMap: Record<string, string> = {};
      const preloadedNames: string[] = [];

      await Promise.all(
        userNames.map(async (userName) => {
          try {
            const lowerName = userName.toLowerCase().trim();
            // Get video metadata from database
            const response = await fetch(`/api/youtubevideos?user_id=${lowerName}`);
            if (!response.ok) {
              console.log(`⚠️  No video found for ${userName}`);
              return;
            }

            const data = await response.json();
            if (data.length > 0) {
              // Get the most recent video
              const latestVideo = data.sort((a: any, b: any) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              )[0];
              
              const playbackId = latestVideo.playbackId;
              
              if (playbackId) {
                playbackIdMap[lowerName] = playbackId;
                preloadedNames.push(userName);
                console.log(`✅ Preloaded playback ID for ${userName}`);
              } else {
                console.log(`⚠️  No playback ID found for ${userName}`);
              }
            } else {
              console.log(`⚠️  No video metadata found for ${userName}`);
            }
          } catch (err) {
            console.error(`❌ Failed to preload video for ${userName}:`, err);
          }
        })
      );

      setPreloadedPlaybackIds(playbackIdMap);
      console.log(`🎉 Video preloading complete! ${preloadedNames.length}/${userNames.length} videos ready`);
      console.log(`📋 Preloaded videos for:`, preloadedNames.join(', '));
    };

    preloadAllVideos();
  }, [userNames]);

  const handleCardClick = (userName: string) => {
    setClickedCards(prev => new Set([...prev, userName]));
    console.log(`🎥 Card clicked for ${userName}`);
  };

  return (
    <Box
      bg="#f24236"
      height="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
      p={4}
    >
      <Stack align="center">
        <Text fontSize={{ base: "2xl", md: "4xl" }} color="white" fontWeight="bold">
          Secret Santa Gift Videos!
        </Text>
        {loading && <Text color="white">Loading...</Text>}
        {error && <Text color="red.500">{error}</Text>}
        <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }} gap={{ base: "4", md: "6" }}>
          <For each={userNames}>
            {(userName) => (
              <Dialog.Root key={userName} size="cover">
                <Dialog.Trigger asChild>
                <Card.Root
                  bg="white"
                  color="#f24236"
                  borderRadius="md" 
                  boxShadow="md"
                  cursor="pointer"
                  onClick={() => handleCardClick(userName)}
                  opacity={clickedCards.has(userName) ? 0.5 : 1}
                  >
                  <Card.Body display="flex" justifyContent="center" alignItems="center" p={{ base: "3", md: "4" }}>
                    <Text fontSize={{ base: "lg", md: "xl", lg: "2xl" }} fontWeight="bold" textAlign="center">
                    {userName}
                    </Text>
                  </Card.Body>
                </Card.Root>
                </Dialog.Trigger>
                <Portal>
                  <Dialog.Backdrop />
                  <Dialog.Positioner>
                    <Dialog.Content p={0} position="relative">
                      <Dialog.CloseTrigger asChild>
                        <CloseButton 
                          size="lg"
                          position="absolute"
                          top="20px"
                          right="20px"
                          zIndex={10}
                          bg="rgba(0,0,0,0.6)"
                          color="white"
                          borderRadius="full"
                          _hover={{ bg: "rgba(0,0,0,0.8)" }}
                        />
                      </Dialog.CloseTrigger>
                      <Dialog.Body p={0}>
                        {/* Use the VideoPlayer component to load the video */}
                        <VideoPlayer userName={userName} preloadedPlaybackId={preloadedPlaybackIds[userName.toLowerCase()]} />
                      </Dialog.Body>
                    </Dialog.Content>
                  </Dialog.Positioner>
                </Portal>
              </Dialog.Root>
            )}
          </For>
        </Grid>
      </Stack>
    </Box>
  );
}