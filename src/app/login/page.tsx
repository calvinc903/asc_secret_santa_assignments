'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { Box, Button, Stack, Text, Input, Spinner } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase'; // Adjust the path as needed
import { FirebaseError } from 'firebase/app';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Sign in with Firebase Authentication using email and password
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect to callbackUrl after successful login
      router.push(callbackUrl);
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
    } finally {
      setLoading(false);
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
      <Stack alignItems="center" as="form" onSubmit={handleSubmit}>
        <Text fontSize={{ base: "2xl", md: "4xl" }} color="white" fontWeight="bold">
          Log In
        </Text>
        <Input
          ref={emailRef}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          size="lg"
          variant="outline"
          borderColor="white"
          width="335px"
          color="#f24236"
          bg="white"
          p={4}
          mt={4}
          _placeholder={{ color: '#f24236' }}
          type="email"
          fontSize={{ base: "md", md: "xl" }}
          _hover={{ borderColor: 'white' }}
          _focus={{ borderColor: 'white', boxShadow: 'none', outline: 'none' }}
          required
        />
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          size="lg"
          variant="outline"
          borderColor="white"
          width="335px"
          color="#f24236"
          bg="white"
          p={4}
          mt={4}
          _placeholder={{ color: '#f24236' }}
          type="password"
          fontSize={{ base: "md", md: "xl" }}
          _hover={{ borderColor: 'white' }}
          _focus={{ borderColor: 'white', boxShadow: 'none', outline: 'none' }}
          required
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
          disabled={loading}
          mt={4}
          type="submit"
          size={{ base: "xs", md: "lg" }}
          fontSize={{ base: "md", md: "xl" }}
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

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}