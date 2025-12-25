'use client'

import { useState, useEffect } from 'react';
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
  const [preloadedVideos, setPreloadedVideos] = useState<Record<string, string>>({});

  // Preload all videos when users are loaded from cache or API
  useEffect(() => {
    if (userNames.length === 0) return;

    const preloadAllVideos = async () => {
      const videoUrlMap: Record<string, string> = {};

      await Promise.all(
        userNames.map(async (userName) => {
          try {
            const lowerName = userName.toLowerCase().trim();
            // Get video metadata from database
            const response = await fetch(`/api/youtubevideos?user_id=${lowerName}`);
            if (!response.ok) return;

            const data = await response.json();
            if (data.length > 0) {
              // Get the most recent video
              const latestVideo = data.sort((a: any, b: any) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
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
              
              if (urlResponse.ok) {
                const { viewUrl } = await urlResponse.json();
                videoUrlMap[lowerName] = viewUrl;
              }
            }
          } catch (err) {
            console.error(`Failed to preload video for ${userName}:`, err);
          }
        })
      );

      setPreloadedVideos(videoUrlMap);
    };

    preloadAllVideos();
  }, [userNames]);

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
        {/* <Text fontSize={{ base: "2xl", md: "4xl" }} color="white" fontWeight="bold">
          Click a card to reveal how their gift was bought!
        </Text> */}
        {loading && <Text color="white">Loading...</Text>}
        {error && <Text color="red.500">{error}</Text>}
        <Grid templateColumns="repeat(4, 1fr)" gap="6">
          <For each={userNames}>
            {(userName) => (
              <Dialog.Root key={userName} size="lg">
                <Dialog.Trigger asChild>
                <Card.Root
                  bg="white"
                  color="#f24236"
                  borderRadius="md" 
                  boxShadow="md"
                  cursor="pointer"
                  >
                  <Card.Body display="flex" justifyContent="center" alignItems="center">
                    <Text fontSize="2xl" fontWeight="bold">
                    {userName}
                    </Text>
                  </Card.Body>
                </Card.Root>
                </Dialog.Trigger>
                <Portal>
                  <Dialog.Backdrop />
                  <Dialog.Positioner>
                    <Dialog.Content>
                      <Dialog.Header>
                        <Dialog.Title>{userName}&apos;s Gift Video</Dialog.Title>
                      </Dialog.Header>
                      <Dialog.Body>
                        {/* Use the VideoPlayer component to load the video */}
                        <VideoPlayer userName={userName} preloadedUrl={preloadedVideos[userName.toLowerCase()]} />
                      </Dialog.Body>
                      <Dialog.Footer>
                        <Dialog.ActionTrigger asChild>
                          <Button variant="outline">Cancel</Button>
                        </Dialog.ActionTrigger>
                        <Button>Save</Button>
                      </Dialog.Footer>
                      <Dialog.CloseTrigger asChild>
                        <CloseButton size="sm" />
                      </Dialog.CloseTrigger>
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