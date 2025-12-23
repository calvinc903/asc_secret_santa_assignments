'use client';

import { useEffect, useState, useRef } from 'react';
import { Box, Button, Text, VStack } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/useWindowSize';

const CLOUDFLARE_WORKER_URL = 'https://video-worker.ascsecretsanta.workers.dev';

export default function VideoSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileName = searchParams.get('fileName');
  const { width, height } = useWindowSize();
  const [numberOfPieces, setNumberOfPieces] = useState(500);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Stop shooting confetti after 3 seconds (existing pieces will continue falling)
    const timer = setTimeout(() => {
      setNumberOfPieces(0);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!fileName) {
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
            <source src={`${CLOUDFLARE_WORKER_URL}/${fileName}`} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </Box>

        {/* Back Button */}
        <Button
          bg="white"
          color="#f24236"
          fontWeight="bold"
          py={6}
          px={8}
          borderRadius="md"
          fontSize={{ base: "lg", md: "xl" }}
          onClick={() => router.push('/')}
        >
          ← Back to Home
        </Button>
      </VStack>
    </Box>
  );
}
