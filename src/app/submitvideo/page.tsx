'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Button, Stack, Text, Input, Spinner, VStack } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useUsers } from '@/contexts/UserContext';


export default function SignUpPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { users, loading: usersLoading } = useUsers();
  const [selectedUser, setSelectedUser] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const CLOUDFLARE_WORKER_URL = 'https://video-worker.ascsecretsanta.workers.dev';
  const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
  const MAX_DURATION = 10 * 60; // 10 minutes in seconds

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup video preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

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

const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset error
    setError(null);

    // Validate file type
    if (file.type !== 'video/mp4') {
      setError('Only MP4 files are allowed');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    // Create video preview URL
    const previewUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(previewUrl);
    setSelectedFile(file);

    // Validate video duration using the same preview URL
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      // Don't revoke the URL here - the preview is still using it!
      if (video.duration > MAX_DURATION) {
        setError(`Video too long. Maximum duration is ${MAX_DURATION / 60} minutes`);
        setSelectedFile(null);
        URL.revokeObjectURL(previewUrl);
        setVideoPreviewUrl('');
      }
    };

    video.src = previewUrl;
  };

const uploadToCloudflare = async (file: File): Promise<string> => {
    console.log('Starting upload to Cloudflare...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    return new Promise(async (resolve, reject) => {
      try {
        // Step 1: Get upload URL from worker
        console.log('Requesting upload URL...');
        const presignResponse = await fetch(`${CLOUDFLARE_WORKER_URL}/presign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
          })
        });

        if (!presignResponse.ok) {
          const error = await presignResponse.json();
          throw new Error(error.error || 'Failed to get upload URL');
        }

        const { fileName, uploadUrl } = await presignResponse.json();
        console.log('Got upload URL:', { fileName, uploadUrl });

        // Step 2: Upload file directly using XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            console.log(`Upload progress: ${percentComplete.toFixed(2)}%`, {
              loaded: e.loaded,
              total: e.total
            });
            setUploadProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener('load', () => {
          console.log('Upload completed', {
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.responseText
          });
          
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log('Parsed response:', response);
              resolve(fileName); // Return the fileName from presign response
            } catch (err) {
              console.error('Failed to parse response:', err);
              reject(new Error('Invalid response from server'));
            }
          } else {
            console.error('Upload failed with status:', xhr.status);
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.error || 'Upload failed'));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', (e) => {
          console.error('Upload error event:', e);
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          console.error('Upload aborted');
          reject(new Error('Upload was aborted'));
        });

        xhr.addEventListener('timeout', () => {
          console.error('Upload timeout');
          reject(new Error('Upload timed out'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', 'video/mp4');
        xhr.timeout = 600000; // 10 minutes timeout for large files
        console.log('Sending file to:', uploadUrl);
        xhr.send(file);

      } catch (err) {
        console.error('Upload setup error:', err);
        reject(err);
      }
    });
  };

const postData = async (fileName: string) => {
    if (!selectedUser) {
        alert('Please select a user');
        return;
    }

    // currently their name
    const gifteeID = (await getGifteID(selectedUser.toLowerCase()));
    if (gifteeID == null) {
        alert('You are not on the list!');
        return;
    }
    try {
        const response = await fetch(`/api/youtubevideos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: gifteeID, videoURL: fileName }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        alert('Video submitted ☺️');
        // Reset form
        setSelectedFile(null);
        setVideoPreviewUrl('');
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
    } catch (err) {
        setError((err as Error).message);
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

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a video file');
      return;
    }

    if (!selectedUser) {
      setError('Please select your name');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      console.log('Starting video submission process...');
      // Upload to Cloudflare
      const fileName = await uploadToCloudflare(selectedFile);
      console.log('Upload successful, fileName:', fileName);
      
      // Save to database
      await postData(fileName);
      console.log('Video submission complete!');
    } catch (err) {
      console.error('Submission error:', err);
      setError((err as Error).message);
      alert(`Error: ${(err as Error).message}`);
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
      overflow="auto"
    >
      <Stack alignItems="center" width="100%" maxWidth="600px">
        <Text fontSize={{ base: "lg", md: "4xl" }} color="white" fontWeight="bold" textAlign="center" px={4}>
          Submit your Video
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
          fontSize={{ base: "sm", md: "xl" }} 
          color="white" 
          fontWeight="bold" 
          textAlign="center"
          px={4}
          mt={6}
        >
          Upload your video (MP4, max 200MB, max 10 minutes)
        </Text>

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="video/mp4"
          onChange={handleFileSelect}
          display="none"
        />

        {/* File upload button */}
        <Button
          bg="white"
          color="#f24236"
          fontWeight="bold"
          py={4}
          px={6}
          borderRadius="md"
          _hover={{ bg: 'gray.100' }}
          width={{ base: "90%", md: "300px" }}
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          mt={4}
          size={{ base: "md", md: "lg" }} 
          fontSize={{ base: "md", md: "xl" }}
        >
          {selectedFile ? 'Change Video' : 'Select Video'}
        </Button>

        {selectedFile && (
          <Text fontSize={{ base: "xs", md: "sm" }} color="white" textAlign="center" px={4} mt={2}>
            Selected: {selectedFile.name}
          </Text>
        )}

        {/* Video Preview */}
        {videoPreviewUrl && (
          <Box 
            width={{ base: "90%", md: "400px" }} 
            maxWidth="400px" 
            mt={4}
            borderRadius="md"
            overflow="hidden"
            boxShadow="lg"
          >
            <video
              ref={videoRef}
              src={videoPreviewUrl}
              controls
              preload="metadata"
              style={{ width: '100%', maxHeight: '300px', backgroundColor: '#000' }}
            >
              Your browser does not support video preview.
            </video>
          </Box>
        )}

        {/* Upload Progress */}
        {loading && (
          <Box width={{ base: "90%", md: "400px" }} maxWidth="400px" mt={4}>
            <Text fontSize="sm" color="white" mb={2}>
              {uploadProgress === 0 ? 'Preparing upload...' : `Uploading: ${uploadProgress}%`}
            </Text>
            <Box 
              width="100%" 
              height="8px" 
              bg="whiteAlpha.300" 
              borderRadius="md" 
              overflow="hidden"
            >
              <Box 
                width={uploadProgress === 0 ? '100%' : `${uploadProgress}%`}
                height="100%" 
                bg="white" 
                transition="width 0.3s ease"
                style={uploadProgress === 0 ? {
                  animation: 'pulse 1.5s ease-in-out infinite'
                } : undefined}
              />
            </Box>
            <style jsx>{`
              @keyframes pulse {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 1; }
              }
            `}</style>
          </Box>
        )}

        {/* Submit button */}
        <Button
          bg="white"
          color="#f24236"
          fontWeight="bold"
          py={4}
          px={6}
          borderRadius="md"
          _hover={{ bg: 'gray.100' }}
          width="200px"
          onClick={handleSubmit}
          disabled={loading || !selectedFile}
          mt={4}
          size={{ base: "md", md: "lg" }} 
          fontSize={{ base: "md", md: "xl" }}
        >
          {loading ? (
            <Stack direction="row" align="center" gap={2}>
              <Spinner size="sm" />
              <Text>Uploading...</Text>
            </Stack>
          ) : (
            'Submit Video'
          )}
        </Button>

        {error && (
          <Text color="yellow.300" fontSize="md" mt={4} textAlign="center" px={4}>
            {error}
          </Text>
        )}
      </Stack>
    </Box>
  );
}