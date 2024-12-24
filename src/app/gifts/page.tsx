'use client'

import { useState, useEffect } from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

import {
  Box,
  Stack,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  useDisclosure,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Button,
} from '@chakra-ui/react';
import { get } from 'http';

type User = {
  _id: string;
  name: string;
};

export default function GiftsPage() {
  const { open, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);

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

  useEffect(() => {
    const getVideo = async (name: string) => {
      try {
          const response = await fetch(`/api/youtubevideos?user_id=${name.toLowerCase().trim()}`);
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (data.length == 1) {
              console.log(data[0].videoURL);
              return data[0].videoURL;
          } else {
              return null;
          }
      } catch (err) {
          setError((err as Error).message);
          return null;
      }
    } 
    if (selectedUser) {
      (async () => {
        const videoURL = await getVideo(selectedUser.name);
        setVideoURL(videoURL);
      })();
    }
  }, [selectedUser])

  const handleCardClick = (user: User) => {
    setSelectedUser(user);
    onOpen();
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
      <Stack alignItems="center" gap={8}>
        <Text fontSize={{ base: "2xl", md: "4xl" }} color="white" fontWeight="bold">
          Click a card to reveal how their gift was bought!
        </Text>
        {loading && <Text color="white">Loading...</Text>}
        {error && <Text color="red.500">{error}</Text>}
        {!loading && !error && (
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={8}>
          {users.map((user) => (
            <Card.Root
            key={user._id}
            bg="white"
            color="#f24236"
            borderRadius="md"
            boxShadow="md"
            cursor="pointer"
            onClick={() => handleCardClick(user)}
            >
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

      {selectedUser && (
      <DialogRoot 
      open={open} 
      // size="cover" 
      placement="center" 
      motionPreset="slide-in-bottom"
      closeOnEscape={true}
      >
        <DialogContent position="absolute" minWidth="80vw" maxHeight="auto" overflow="hidden">
        <DialogBody paddingY={5} maxHeight="auto" overflow="hidden" alignContent={"center"}>
          <LiteYouTubeEmbed
        id={videoURL || ''}
        title="User Submitted Video"
        poster="maxresdefault" // Ensures high-quality thumbnail
          />
        </DialogBody>
        <DialogFooter>
          <DialogCloseTrigger asChild>
           <Button onClick={onClose}>Close</Button>
          </DialogCloseTrigger>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
      )}
    </Box>
  );
}