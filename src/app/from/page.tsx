'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Button, Stack, Text, Input } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';


export default function FromPage() {
  const [name, setName] = useState('');
  const [gifterState, setGifter] = useState('');
  // const [showLoadingPage, setShowLoadingPage] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (gifterState) {
      router.push(`/loadingPage?gifter=${encodeURIComponent(gifterState)}`);    
    }
  }, [gifterState, router]);


  return (
    <Box
      bg="#f24236"
      height="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
      p={4} // Add padding to the Box
    >
      <Stack alignItems="center">
        <Text fontSize="4xl" color="white" fontWeight="bold">
          Enter your Name
        </Text>
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your name..."
          size="lg"
          variant="outline"
          borderColor="white"
          color="#f24236"
          bg="white"
          p={4} // Add padding to the Input box
          _placeholder={{ color: '#f24236' }}
          _hover={{ borderColor: 'white' }}
          _focus={{ borderColor: 'white', boxShadow: 'none', outline: 'none' }}
        />
        <Button
          bg="white"
          color="#f24236"
          fontWeight="bold"
          py={2}
          px={4} // Adjust padding to make the button less wide
          borderRadius="md"
          _hover={{ bg: 'gray.100' }}
          width="200px"
          onClick={() => setGifter(name)}
        >
          Submit
        </Button>
      </Stack>
    </Box>
  );
}