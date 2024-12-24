'use client';

import { useState, useEffect } from 'react';
import { Box, Stack, Text, SimpleGrid } from '@chakra-ui/react';
import { Card, CardBody } from '@chakra-ui/react';

interface User {
  _id: string;
  name: string;
}

export default function SantasPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <Box
      bg="#f24236"
      minH="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
      p={4}
    >
      <Stack alignItems="center" gap={8}>
        <Text fontSize="4xl" color="white" fontWeight="bold">
          Santas
        </Text>
        <Text fontSize="4xl" color="white" fontWeight="bold">
          Click a card to reveal how their gift was bought!
        </Text>
        {loading && <Text color="white">Loading...</Text>}
        {error && <Text color="red.500">{error}</Text>}
        {!loading && !error && (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={8}>
            {users.map((user) => (
              <Card.Root key={user._id} bg="white" color="#f24236" borderRadius="md" boxShadow="md">
                <Card.Body display="flex" justifyContent="center" alignItems="center">
                  <Text fontSize="2xl" fontWeight="bold">
                    {user.name.charAt(0).toUpperCase() + user.name.slice(1)}
                  </Text>
                </Card.Body>
              </Card.Root>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Box>
  );
}