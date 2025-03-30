'use client'

import { useState, useEffect } from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
import VideoPlayer from '@/components/VideoPlayer'; 
import {
  Box,
  Stack,
  Text,
  Grid,
  Card,
  Button,
  CloseButton,
  Portal,
  Dialog,
  For
} from '@chakra-ui/react';
// Assume For is a helper to iterate over lists

// Include the VideoPlayer component defined above here or import it if separated.

type User = {
  _id: string;
  name: string;
};

export default function GiftsPage() {
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
        setUsers(data.sort((a: User, b: User) => a.name.localeCompare(b.name)));
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
      height="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
      p={4}
    >
      <Stack align="center">
        <Text fontSize={{ base: "2xl", md: "4xl" }} color="white" fontWeight="bold">
          Click a card to reveal how their gift was bought!
        </Text>
        {loading && <Text color="white">Loading...</Text>}
        {error && <Text color="red.500">{error}</Text>}
        <Grid templateColumns="repeat(4, 1fr)" gap="6">
          <For each={users}>
            {(user) => (
              <Dialog.Root key={user._id} size="lg">
                <Dialog.Trigger asChild>
                <Card.Root
                  key={user._id}
                  bg="white"
                  color="#f24236"
                  borderRadius="md" 
                  boxShadow="md"
                  cursor="pointer"
                  >
                  <Card.Body display="flex" justifyContent="center" alignItems="center">
                    <Text fontSize="2xl" fontWeight="bold">
                    {user.name.charAt(0).toUpperCase() + user.name.slice(1)}
                    </Text>
                  </Card.Body>
                </Card.Root>
                </Dialog.Trigger>
                <Portal>
                  <Dialog.Backdrop />
                  <Dialog.Positioner>
                    <Dialog.Content>
                      <Dialog.Header>
                        <Dialog.Title>{user.name}&apos;s Gift Video</Dialog.Title>
                      </Dialog.Header>
                      <Dialog.Body>
                        {/* Use the VideoPlayer component to load the video */}
                        <VideoPlayer userName={user.name} />
                      </Dialog.Body>
                      <Dialog.Footer>
                        <Dialog.ActionTrigger asChild>
                          <Button variant="outline">Cancel</Button>
                        </Dialog.ActionTrigger>
                        <Button>Save</Button>
                      </Dialog.Footer>
                      <Dialog.CloseTrigger asChild>
                        <CloseButton size="sm" />
                      </Dialog.CloseTrigger>
                    </Dialog.Content>
                  </Dialog.Positioner>
                </Portal>
              </Dialog.Root>
            )}
          </For>
        </Grid>
      </Stack>
    </Box>
  );
}