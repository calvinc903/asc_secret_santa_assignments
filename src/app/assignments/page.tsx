'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Stack, Text } from '@chakra-ui/react';
import HandwritingText from '../../components/HandwritingText.js';

interface DataItem {
  _id: string;
  gifter: string;
  recipient: string;
  timestamp: string;
}

function GifteeDisplay({ gifter }: { gifter: string }) {
  const [giftee, setGiftee] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      const response = await fetch(`/api/assignments?gifter=${encodeURIComponent(gifter)}`);
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
      width="100vw"
      display="flex"
      justifyContent="center"
      alignItems="center"
      p={4}
    >
      <Stack align="center" width="100%">
        <Text fontWeight="bold" color="white" fontSize="4xl">Your giftee is...</Text>
        <HandwritingText text={giftee} />
      </Stack>
    </Box>
  );
}

function AssignmentsContent() {
  const searchParams = useSearchParams();
  const gifter = searchParams.get('gifter');

  return gifter ? (
    <Suspense fallback={<div>Loading giftee information...</div>}>
      <GifteeDisplay gifter={gifter} />
    </Suspense>
  ) : (
    <div>No gifter specified</div>
  );
}

export default function AssignmentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AssignmentsContent />
    </Suspense>
  );
}