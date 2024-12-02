'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Button, Stack, Text, Input, Spinner } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

export default function FromPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const fetchData = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/assignments?gifter=${query.toLowerCase().trim()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.length == 1) {
        router.push(`/loadingPage?gifter=${encodeURIComponent(query)}`);
      } else {
        // Handle the case where the response is empty
        // For example, you might want to display a message to the user
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (name.trim()) {
      fetchData(name.toLowerCase());
    }
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
      <Stack alignItems="center">
        <Text fontSize="4xl" color="white" fontWeight="bold">
          Step into the holiday spirit!
        </Text>
        <Text fontSize="4xl" color="white" fontWeight="bold">
          What's your name?
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
          p={4}
          _placeholder={{ color: '#f24236' }}
          _hover={{ borderColor: 'white' }}
          _focus={{ borderColor: 'white', boxShadow: 'none', outline: 'none' }}
        />
        <Button
          bg="white"
          color="#f24236"
          fontWeight="bold"
          py={2}
          px={4}
          borderRadius="md"
          _hover={{ bg: 'gray.100' }}
          width="200px"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" /> : 'Submit'}
        </Button>
        {error && (
          <Text color="yellow.300" fontSize="md">
            {error}
          </Text>
        )}
      </Stack>
    </Box>
  );
}