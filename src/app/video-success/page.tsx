'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { Box, Button, Text, VStack } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/useWindowSize';
import MuxPlayer from '@mux/mux-player-react';

function VideoSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userName = searchParams.get('fileName'); // User's name
  const duration = searchParams.get('duration');
  const { width, height } = useWindowSize();
  const [numberOfPieces, setNumberOfPieces] = useState(500);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Stop shooting confetti after 3 seconds (existing pieces will continue falling)
    const timer = setTimeout(() => {
      setNumberOfPieces(0);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchPlaybackId = async () => {
      if (!userName) {
        setLoading(false);
        return;
      }

      try {
        // Fetch video metadata from database
        const response = await fetch(`/api/youtubevideos?user_id=${userName.toLowerCase().trim()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch video metadata');
        }

        const data = await response.json();
        if (data.length > 0) {
          const latestVideo = data.sort((a: any, b: any) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];
          
          if (latestVideo.playbackId) {
            setPlaybackId(latestVideo.playbackId);
          }
        }
      } catch (error) {
        console.error('Error fetching playback ID:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaybackId();
  }, [userName]);

  if (!userName) {
    return (
      <Box bg="#f24236" minHeight="100vh" display="flex" alignItems="center" justifyContent="center" p={4}>
        <Text color="white" fontSize="2xl">No video found</Text>
      </Box>
    );
  }

  return (
    <Box
      bg="#f24236"
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      position="relative"
      overflow="hidden"
    >
      {/* Christmas Confetti */}
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={numberOfPieces}
        colors={['#228B22', '#DC143C', '#FF0000', '#00FF00', '#C41E3A', '#165B33', '#FFD700', '#FFFFFF']}
        gravity={0.3}
      />

      {/* Content */}
      <VStack gap={6} zIndex={1} maxWidth="900px" width="100%">
        <Text 
          fontSize={{ base: "2xl", md: "4xl" }} 
          color="white" 
          fontWeight="bold" 
          textAlign="center"
        >
          Video Submitted Successfully!
        </Text>

        {duration && (
          <Text 
            fontSize={{ base: "sm", md: "lg" }} 
            color="white" 
            textAlign="center"
            fontWeight="semibold"
          >
            Upload completed in: {(() => {
              const totalSeconds = parseFloat(duration);
              const minutes = Math.floor(totalSeconds / 60);
              const seconds = Math.floor(totalSeconds % 60);
              if (minutes > 0) {
                return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
              } else {
                return `${seconds} second${seconds !== 1 ? 's' : ''}`;
              }
            })()}
          </Text>
        )}

        <Text 
          fontSize={{ base: "md", md: "xl" }} 
          color="white" 
          textAlign="center"
          px={4}
        >
          Video is being processed and will be available shortly on the videos page.
        </Text>

        <Text 
          fontSize={{ base: "sm", md: "lg" }} 
          color="white" 
          textAlign="center"
          px={4}
          mt={2}
        >
          Check if your video is uploaded by clicking the name of your giftee! Do not click anyone else&apos;s name including your own to avoid spoilers!
        </Text>

        {/* Navigation Buttons */}
        <VStack gap={3}>
          <Button
            bg="white"
            color="#f24236"
            fontWeight="bold"
            py={6}
            px={8}
            borderRadius="md"
            fontSize={{ base: "lg", md: "xl" }}
            onClick={() => router.push('/gifts')}
            width="250px"
          >
            Go to Videos Page
          </Button>
          
          <Button
            bg="white"
            color="#f24236"
            fontWeight="bold"
            py={6}
            px={8}
            borderRadius="md"
            fontSize={{ base: "lg", md: "xl" }}
            onClick={() => router.push('/submitvideo')}
            width="250px"
          >
            Resubmit Video
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
}

export default function VideoSuccessPage() {
  return (
    <Suspense fallback={<Box p={8}><Text>Loading...</Text></Box>}>
      <VideoSuccessContent />
    </Suspense>
  );
}
