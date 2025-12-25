'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Button, Stack, Text, Input, Spinner } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }
    
    setLoading(true);
    setError(null);
    // Note: Firebase authentication has been removed
    // This page is no longer functional
    setError('Sign up functionality has been removed');
    setLoading(false);
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
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Type your email..."
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
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Type your password..."
          size="lg"
          variant="outline"
          borderColor="white"
          color="#f24236"
          bg="white"
          width="335px"
          p={4}
          mt={4}
          fontSize={{ base: "md", md: "xl" }}
          type="password"
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