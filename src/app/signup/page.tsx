'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Button, Stack, Text, Input, Spinner } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
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

  const postData = async (name: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.length == 1) {
        router.push(`/`);
      } else {
        alert('Invalid name!');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const checkIfUserExists = async (query: string) => {
    try {
      const response = await fetch(`/api/users?name=${query.toLowerCase().trim()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      if ((await response.json()).length == 1) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };
  

  const handleSubmit = async () => {
    if (name.trim()) {
      if (await checkIfUserExists(name) == false) {
        postData(name.toLowerCase());
      } else {
        alert('User already exists ☺️');
      }
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
        {/* <Text fontSize={{ base: "2xl", md: "4xl" }} color="white" fontWeight="bold">
          Signup
        </Text>  */}
        <Text fontSize={{ base: "2xl", md: "4xl" }} color="white" fontWeight="bold">
          Make an Account!
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
          width="335px"
          p={4}
          mt={4}
          fontSize={{ base: "md", md: "xl" }} 
          _placeholder={{ color: '#f24236' }}
          _hover={{ borderColor: 'white' }}
          _focus={{ borderColor: 'white', boxShadow: 'none', outline: 'none' }}
        />
        <Button
          bg="white"
          color="#f24236"
          fontWeight="bold"
          py={4}
          px={4}
          borderRadius="md"
          _hover={{ bg: 'gray.100' }}
          width="200px"
          onClick={handleSubmit}
          disabled={loading}
          mt={4}
          size={{ base: "xs", md: "lg" }} 
          fontSize={{ base: "md", md: "xl" }}
        >
          {loading ? <Spinner size="sm" /> : 'Sign Up'}
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