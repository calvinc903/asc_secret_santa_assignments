'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Button, Stack, Text, Input, Spinner, VStack } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from "next-auth/react";
import { useUsers } from '@/contexts/UserContext';


export default function SignUpPage() {
  const [videoURL, setVideoURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { users, loading: usersLoading } = useUsers();
  const [selectedUser, setSelectedUser] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = users.filter(user => 
    user.toLowerCase().startsWith(searchInput.toLowerCase())
  );

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchInput]);

  const handleUserSelect = (user: string) => {
    setSelectedUser(user);
    setSearchInput(user);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredUsers.length > 0 && !usersLoading) {
          handleUserSelect(filteredUsers[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

const postData = async (videoURL: string) => {
    setLoading(true);
    setError(null);
    
    if (!selectedUser) {
        alert('Please select a user');
        setLoading(false);
        return;
    }

    // currently their name
    const gifteeID = (await getGifteID(selectedUser.toLowerCase()));
    if (gifteeID == null) {
        alert('You are not on the list!');
        setLoading(false);
        return;
    }
    try {
        const response = await fetch(`/api/youtubevideos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: gifteeID, videoURL: videoURL }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        alert('Video submitted ☺️');
    } catch (err) {
        setError((err as Error).message);
    } finally {
        setLoading(false);
    }
  
};

const getGifteID = async (query: string) => {
    try {
        const response = await fetch(`/api/assignments?gifter=${query.toLowerCase().trim()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.length == 1) {
            console.log(data[0].recipient);
            return data[0].recipient;
        } else {
            return null;
        }
    } catch (err) {
        setError((err as Error).message);
        return null;
    }
};

  const checkIfVideoExists = async (url: string) => {
    try {
    const response = await fetch(`/api/youtubevideos`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.some((video: { videoURL: string }) => video.videoURL === extractVideoId(url));
    } catch (err) {
    setError((err as Error).message);
    return false;
    }
  };

  function extractVideoId(url: string) {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('v');
  }
  

  const handleSubmit = async () => {
    if (videoURL.trim()) {
      if (await checkIfVideoExists(videoURL) == false) {
        postData(videoURL);
      } else {
        alert('Video already submitted');
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
        <Text fontSize={{ base: "lg", md: "4xl" }} color="white" fontWeight="bold" textAlign="center" px={4}>
          Submit your Youtube Video
        </Text> 
        <Text fontSize={{ base: "xs", md: "md" }} color="white" textAlign="center" px={4} mt={2}>
          Select your name from the dropdown
        </Text>
        
        {/* User Selection Dropdown */}
        <Box position="relative" width={{ base: "90%", md: "400px" }} maxWidth="400px" ref={dropdownRef}>
          <Input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search and select your name..."
            size="lg"
            variant="outline"
            borderColor="white"
            color="#f24236"
            bg="white"
            width="100%"
            p={4}
            mt={4}
            fontSize={{ base: "md", md: "xl" }}
            _placeholder={{ color: '#f24236' }}
            _hover={{ borderColor: 'white' }}
            _focus={{ borderColor: 'white', boxShadow: 'none', outline: 'none' }}
          />
          {showDropdown && (
            <Box
              position="absolute"
              top="100%"
              left={0}
              right={0}
              mt={1}
              bg="white"
              borderRadius="md"
              boxShadow="lg"
              maxHeight="200px"
              overflowY="auto"
              zIndex={10}
            >
              {usersLoading ? (
                <Box p={3} color="#f24236" textAlign="center">
                  <Spinner size="sm" mr={2} />
                  Loading users...
                </Box>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <Box
                    key={index}
                    p={3}
                    cursor="pointer"
                    color="#f24236"
                    bg={index === highlightedIndex ? '#ffe6e5' : 'white'}
                    _hover={{ bg: '#ffe6e5' }}
                    onClick={() => handleUserSelect(user)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    borderBottom={index < filteredUsers.length - 1 ? '1px solid #f5f5f5' : 'none'}
                  >
                    {user}
                  </Box>
                ))
              ) : (
                <Box p={3} color="#f24236" textAlign="center">
                  No users found
                </Box>
              )}
            </Box>
          )}
        </Box>

        <Text 
          fontSize={{ base: "sm", md: "1xl" }} 
          color="white" 
          fontWeight="bold" 
          whiteSpace="pre-line" 
          textAlign="center"
          px={4}
          mt={6}
        >
          Ensure it is in this format &quot;https://www.youtube.com/watch?v=dQw4w9WgXcQ&quot;
        </Text>
        <Text fontSize={{ base: "xs", md: "md" }} color="white" textAlign="center" px={4}>
          Ensure that the &quot;v=...&quot; part of the link is present
        </Text> 
        <Input
          ref={inputRef}
          value={videoURL}
          onChange={(e) => setVideoURL(e.target.value)}
          placeholder="Enter your Youtube Video URL"
          size="lg"
          variant="outline"
          borderColor="white"
          color="#f24236"
          bg="white"
          width={{ base: "90%", md: "400px" }}
          maxWidth="400px"
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