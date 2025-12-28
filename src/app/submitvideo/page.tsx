'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Stack, Text, Input, Button, Spinner, Flex } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useUsers } from '@/contexts/UserContext';
import dynamic from 'next/dynamic';

const MuxUploader = dynamic(
  () => import('@mux/mux-uploader-react'),
  { ssr: false }
);

export default function SignUpPage() {
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null);
  const { users, loading: usersLoading } = useUsers();
  const [selectedUser, setSelectedUser] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const muxUploaderRef = useRef<any>(null);
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

  // Warn user before leaving page during upload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploadStartTime) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploadStartTime]);

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

  // Mux Uploader event handlers
  const handleUploadStart = () => {
    if (!selectedUser) {
      setError('Please select your name before uploading');
      return;
    }
    setUploadStartTime(Date.now());
    setError(null);
  };

  const getUploadUrl = async () => {
    if (!selectedUser) {
      setError('Please select your name before uploading');
      throw new Error('Please select your name before uploading');
    }

    try {
      const response = await fetch('/api/mux-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: selectedUser }),
      });

      if (!response.ok) {
        throw new Error('Failed to create upload URL');
      }

      const data = await response.json();
      setUploadId(data.uploadId);

      // Get the recipient ID
      const gifteeID = await getGifteID(selectedUser.toLowerCase());
      if (!gifteeID) {
        alert('You are not on the list!');
        throw new Error('User not on the list');
      }

      // Save uploadId to database immediately so webhooks can find it
      await fetch('/api/youtubevideos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: gifteeID, 
          assetId: data.uploadId,  // Store uploadId initially
          playbackId: ''  // Will be updated via webhooks
        }),
      });
      console.log('Saved uploadId to database:', data.uploadId);

      return data.uploadUrl;
    } catch (err) {
      console.error('Error creating Mux upload:', err);
      setError((err as Error).message);
      throw err;
    }
  };

  const handleUploadError = (event: any) => {
    console.error('Upload error:', event.detail);
    setError(event.detail?.message || 'Upload failed');
    setUploadStartTime(null);
  };

  const handleUploadSuccess = async (event: any) => {
    console.log('Upload success event:', event);
    
    try {
      if (!selectedUser) {
        setError('Please select your name before completing the upload');
        return;
      }

      const duration = ((Date.now() - (uploadStartTime || 0)) / 1000).toFixed(2);
      router.push(`/video-success?fileName=${encodeURIComponent(selectedUser)}&duration=${duration}`);
    } catch (err) {
      console.error('Error processing upload:', err);
      setError((err as Error).message);
    } finally {
      setUploadStartTime(null);
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
            return data[0].recipient;
        } else {
            return null;
        }
    } catch (err) {
        console.error('Error getting giftee ID:', err);
        setError((err as Error).message);
        return null;
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
      overflow="auto"
    >
      <Stack alignItems="center" width="100%" maxWidth="600px">
        <Text fontSize={{ base: "lg", md: "4xl" }} color="white" fontWeight="bold" textAlign="center" px={4}>
          Submit your Video
        </Text> 
        <Text fontSize={{ base: "xs", md: "md" }} color="white" textAlign="center" px={4} mt={2}>
          Select your name from the dropdown
        </Text>
        <Text fontSize={{ base: "xs", md: "sm" }} color="white" textAlign="center" px={4} mt={2} fontWeight="semibold">
          ⚠️ WARNING: Do NOT close this page while your video is uploading!
        </Text>
        
        {/* User Selection Dropdown */}
        <Box position="relative" width={{ base: "90%", md: "400px" }} maxWidth="400px" ref={dropdownRef}>
          <Input
            name="user_participant_name"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={(e) => {
              e.currentTarget.removeAttribute('readonly');
              setShowDropdown(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search and select your name..."
            autoComplete="nope"
            data-form-type="other"
            data-lpignore="true"
            readOnly
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

        {/* Mux Uploader Component */}
        <Box 
          width={{ base: "90%", md: "500px" }} 
          maxWidth="500px" 
          mt={6}
        >
          <MuxUploader
            ref={muxUploaderRef}
            endpoint={getUploadUrl}
            onUploadStart={handleUploadStart}
            onSuccess={handleUploadSuccess}
            onError={handleUploadError}
            style={{
              '--overlay-background-color': '#f24236',
              '--progress-bar-fill-color': '#f24236',
              '--progress-radial-fill-color': '#f24236',
              display: 'inline-flex',
              width: '100%',
              minHeight: '250px',
              color: '#f24236',
              fontFamily: 'inherit',
              fontSize: '16px',
              background: 'white',
            } as React.CSSProperties}
          >
            <button
              slot="file-select"
              type="button"
              style={{
                padding: '12px 24px',
                margin: '0',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'white',
                background: '#f24236',
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none',
                boxShadow: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#d63529';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#f24236';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Upload a video
            </button>
          </MuxUploader>
        </Box>

        {!selectedUser && (
          <Text fontSize={{ base: "xs", md: "sm" }} color="yellow.300" textAlign="center" px={4} mt={4}>
            ⚠️ Please select your name above before uploading
          </Text>
        )}

        {error && (
          <Text color="yellow.300" fontSize="md" mt={4} textAlign="center" px={4}>
            {error}
          </Text>
        )}
      </Stack>
    </Box>
  );
}