'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { Box, Button, Text, VStack } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/useWindowSize';

function VideoSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const objectKey = searchParams.get('fileName'); // This is now the objectKey
  const { width, height } = useWindowSize();
  const [numberOfPieces, setNumberOfPieces] = useState(500);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Stop shooting confetti after 3 seconds (existing pieces will continue falling)
    const timer = setTimeout(() => {
      setNumberOfPieces(0);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const getVideoUrl = async () => {
      if (!objectKey) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/video-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ objectKey }),
        });

        if (!response.ok) {
          throw new Error('Failed to get video URL');
        }

        const { viewUrl } = await response.json();
        setVideoUrl(viewUrl);
      } catch (error) {
        console.error('Error getting video URL:', error);
      } finally {
        setLoading(false);
      }
    };

    getVideoUrl();
  }, [objectKey]);

  if (!objectKey) {
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
          🎄 Video Submitted Successfully! 🎅
        </Text>

        <Text 
          fontSize={{ base: "md", md: "xl" }} 
          color="white" 
          textAlign="center"
        >
          Here&apos;s a preview of your video:
        </Text>

        {/* Video Preview */}
        {loading ? (
          <Text color="white">Loading video...</Text>
        ) : videoUrl ? (
          <Box
            width="100%"
            maxWidth="800px"
            borderRadius="lg"
            overflow="hidden"
            boxShadow="2xl"
            bg="black"
          >
            <video
              ref={videoRef}
              controls
              style={{ width: '100%', maxHeight: '500px' }}
              preload="metadata"
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </Box>
        ) : (
          <Text color="white">Failed to load video</Text>
        )}

        {/* Back Button */}
        <VStack gap={3}>
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
          
          <Button
            bg="white"
            color="#f24236"
            fontWeight="bold"
            py={6}
            px={8}
            borderRadius="md"
            fontSize={{ base: "lg", md: "xl" }}
            onClick={() => router.push('/')}
            width="250px"
          >
            ← Back to Home
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
