'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Stack, Text } from '@chakra-ui/react';
import HandwritingText from '../../components/HandwritingText.js';

interface DataItem {
  _id: string;
  gifter: string;
  recipient: string;
  timestamp: string;
}

export default function AssignmentsPage() {

  const [giftee, setGiftee] = useState<string>('');
  const searchParams = useSearchParams();
  const gifter = searchParams.get('gifter');

  useEffect(() => {
    async function fetchData() {
      const response = await fetch(`/api/assignments?gifter=${encodeURIComponent(gifter ?? '')}`);
      const assignments: DataItem[] = await response.json();
      if (assignments.length > 0) {
        const recipient = assignments[0].recipient;
        setGiftee(recipient);
      } else {
        setGiftee('No assignments found');
      }
    }
    if (gifter) {
      fetchData();
    }
  }, [gifter]);

  return (
    <Box
      bg="#f24236"
      height="100vh"
      width="100vw" // Set the width to be the entire page
      display="flex"
      justifyContent="center"
      alignItems="center"
      p={4} // Add padding to the Box
    >
      <Stack align="center" width="100%">
        <Text fontWeight="bold" color="white" fontSize="4xl">Your giftee is...</Text> 
        <HandwritingText text={giftee} />
      </Stack>
    </Box>
  );
}