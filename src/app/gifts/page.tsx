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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [revealedGifters, setRevealedGifters] = useState<Record<string, string>>({});
  const [pendingRevealUser, setPendingRevealUser] = useState<string | null>(null);
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

  const fetchGifter = async (userName: string) => {
    try {
      const lowerName = userName.toLowerCase().trim();
      const response = await fetch(`/api/assignments?recipient=${lowerName}`);
      if (!response.ok) {
        throw new Error('Failed to fetch gifter');
      }
      const data = await response.json();
      if (data.length > 0) {
        const gifterName = data[0].gifter;
        const formattedGifter = gifterName.charAt(0).toUpperCase() + gifterName.slice(1);
        return formattedGifter;
      }
      return null;
    } catch (err) {
      console.error('Error fetching gifter:', err);
      return null;
    }
  };

  const handleRevealGifter = (userName: string) => {
    setPendingRevealUser(userName);
    setShowConfirmDialog(true);
  };

  const confirmRevealGifter = async () => {
    if (!pendingRevealUser) return;
    
    const gifter = await fetchGifter(pendingRevealUser);
    if (gifter) {
      setRevealedGifters(prev => ({ ...prev, [pendingRevealUser.toLowerCase()]: gifter }));
    }
    setShowConfirmDialog(false);
    setPendingRevealUser(null);
  };

  const cancelRevealGifter = () => {
    setShowConfirmDialog(false);
    setPendingRevealUser(null);
  };

  return (
    <Box
      bg="#f24236"
      minHeight="100vh"
      display="flex"
      flexDirection="column"
      p={4}
      pt={{ base: "80px", md: "90px" }}
    >
      <Stack align="center" mb={{ base: "6", md: "8" }}>
        <Text fontSize={{ base: "2xl", md: "4xl" }} color="white" fontWeight="bold">
          Secret Santa Gift Videos!
        </Text>
        <Text fontSize={{ base: "sm", md: "lg" }} color="white" textAlign="center" maxW="600px" px={4}>
          Click on a card to watch that person's gift video! 
        </Text>
        {loading && <Text color="white">Loading...</Text>}
        {error && <Text color="red.500">{error}</Text>}
      </Stack>
      <Box flex="1" display="flex" justifyContent="center" alignItems="flex-start">
        <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }} gap={{ base: "4", md: "6" }} width="100%" maxW="1200px">
          <For each={userNames}>
            {(userName) => (
              <Dialog.Root key={userName} size="cover">
                <Dialog.Trigger asChild>
                <Card.Root
                  bg="white"
                  color="#f24236"
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => handleCardClick(userName)}
                  opacity={clickedCards.has(userName) ? 0.5 : 1}
                  minHeight={{ base: "100px", md: "120px" }}
                  >
                  <Card.Body display="flex" justifyContent="center" alignItems="center" p={{ base: "4", md: "6" }}>
                    <Text fontSize={{ base: "lg", md: "xl", lg: "2xl" }} fontWeight="bold" textAlign="center">
                    {userName}
                    </Text>
                  </Card.Body>
                </Card.Root>
                </Dialog.Trigger>
                <Portal>
                  <Dialog.Backdrop />
                  <Dialog.Positioner>
                    <Dialog.Content p={0} position="relative" bg="black" overflow="hidden">
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
                      <Dialog.Body p={0} bg="black">
                        {/* Use the VideoPlayer component to load the video */}
                        {preloadedPlaybackIds[userName.toLowerCase()] ? (
                          <VideoPlayer userName={userName} preloadedPlaybackId={preloadedPlaybackIds[userName.toLowerCase()]} />
                        ) : (
                          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px" p={8}>
                            <Text fontSize="2xl" color="white" mb={4} textAlign="center">
                              No video available for {userName}
                            </Text>
                            {revealedGifters[userName.toLowerCase()] ? (
                              <Box textAlign="center">
                                <Text fontSize="xl" color="white" mb={2}>
                                  Your Secret Santa is:
                                </Text>
                                <Text fontSize="3xl" color="#f24236" fontWeight="bold" bg="white" px={6} py={3} borderRadius="md">
                                  {revealedGifters[userName.toLowerCase()]}
                                </Text>
                              </Box>
                            ) : (
                              <Button
                                onClick={() => handleRevealGifter(userName)}
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
                        )}
                      </Dialog.Body>
                    </Dialog.Content>
                  </Dialog.Positioner>
                </Portal>
              </Dialog.Root>
            )}
          </For>
        </Grid>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog.Root open={showConfirmDialog} onOpenChange={(e) => setShowConfirmDialog(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="400px" bg="white" p={6}>
              <Dialog.Title fontSize="xl" fontWeight="bold" color="#f24236" mb={4}>
                Are you sure?
              </Dialog.Title>
              <Dialog.Body>
                <Text color="#333" mb={4}>
                  Once revealed, you won't be able to hide this information. Are you sure you want to see who your Secret Santa is?
                </Text>
              </Dialog.Body>
              <Box display="flex" gap={3} justifyContent="flex-end" mt={4}>
                <Button
                  onClick={cancelRevealGifter}
                  variant="outline"
                  borderColor="#f24236"
                  color="#f24236"
                  px={6}
                  _hover={{ bg: "#ffe6e5" }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmRevealGifter}
                  bg="#f24236"
                  color="white"
                  px={6}
                  _hover={{ bg: "#d63529" }}
                >
                  Yes, Reveal
                </Button>
              </Box>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
}