'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Stack, Text, Input, VStack, Button, Spinner, Flex } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useUsers } from '@/contexts/UserContext';
import { transcodeToMp4, canUseMultiThread, estimateTranscodeTime } from '@/lib/clientTranscode';


export default function SignUpPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTranscoding, setIsTranscoding] = useState(false);
  const [transcodeProgress, setTranscodeProgress] = useState(0);
  const [transcodedFile, setTranscodedFile] = useState<File | null>(null);
  const { users, loading: usersLoading } = useUsers();
  const [selectedUser, setSelectedUser] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB max
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

  // Timer effect to track upload duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (uploadStartTime !== null && loading) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - uploadStartTime) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [uploadStartTime, loading]);



  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

    // Reset error and transcoded file
    setError(null);
    setTranscodedFile(null);

    // Validate file type - accept all video types
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    // Warn if very large - transcoding may be slow
    if (file.size > 500 * 1024 * 1024) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(0);
      const estimatedTime = estimateTranscodeTime(Number(fileSizeMB));
      setError(`Large file (${fileSizeMB}MB) - transcoding may take ${estimatedTime}. Consider using a smaller video on mobile devices.`);
      // Continue anyway, just warn
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

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const uploadPartWithRetry = async (
    uploadUrl: string,
    chunk: Blob,
    partNumber: number,
    maxRetries = 3
  ): Promise<string> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          body: chunk,
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        });

        if (!response.ok) {
          throw new Error(`Part ${partNumber} upload failed with status ${response.status}`);
        }

        const etag = response.headers.get('ETag');
        if (!etag) {
          throw new Error(`Part ${partNumber} upload succeeded but no ETag received`);
        }

        return etag;
      } catch (error) {
        console.error(`Part ${partNumber} upload attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff: 2s, 4s, 8s
          const backoffMs = Math.pow(2, attempt + 1) * 1000;
          console.log(`Retrying part ${partNumber} in ${backoffMs}ms...`);
          await sleep(backoffMs);
        } else {
          throw new Error(`Part ${partNumber} failed after ${maxRetries + 1} attempts: ${(error as Error).message}`);
        }
      }
    }
    throw new Error(`Part ${partNumber} upload failed`);
  };

  const uploadToR2 = async (file: File): Promise<{ objectKey: string; durationSeconds: string }> => {
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const startTime = Date.now();
    
    let uploadId: string | null = null;
    let objectKey: string | null = null;

    try {
      // Step 1: Start multipart upload
      const startResponse = await fetch('/api/multipart-upload/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          fileName: file.name,
          fileType: file.type,
        }),
      });

      if (!startResponse.ok) {
        const error = await startResponse.json();
        throw new Error(error.error || 'Failed to start upload');
      }

      const startData = await startResponse.json();
      uploadId = startData.uploadId;
      objectKey = startData.objectKey;

      console.log(`Started multipart upload: ${uploadId}`);

      // Step 2: Upload each part with retry logic
      const uploadedParts: Array<{ PartNumber: number; ETag: string }> = [];
      
      for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        console.log(`Uploading part ${partNumber}/${totalChunks} (${start}-${end})`);

        // Get presigned URL for this part
        const partUrlResponse = await fetch('/api/multipart-upload/part-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            objectKey,
            uploadId,
            partNumber,
          }),
        });

        if (!partUrlResponse.ok) {
          throw new Error(`Failed to get URL for part ${partNumber}`);
        }

        const { uploadUrl } = await partUrlResponse.json();

        // Upload part with retry logic
        const etag = await uploadPartWithRetry(uploadUrl, chunk, partNumber);
        
        uploadedParts.push({
          PartNumber: partNumber,
          ETag: etag,
        });

        // Update progress
        const progress = Math.round((partNumber / totalChunks) * 100);
        setUploadProgress(progress);
        console.log(`Part ${partNumber}/${totalChunks} uploaded successfully. Progress: ${progress}%`);
      }

      // Step 3: Complete multipart upload
      console.log('Completing multipart upload...');
      const completeResponse = await fetch('/api/multipart-upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectKey,
          uploadId,
          parts: uploadedParts,
        }),
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to complete upload');
      }

      if (!objectKey) {
        throw new Error('Object key is missing');
      }

      const duration = Date.now() - startTime;
      const durationSeconds = (duration / 1000).toFixed(2);
      const durationMinutes = (duration / 60000).toFixed(2);
      console.log(`Upload completed successfully in ${durationSeconds}s (${durationMinutes} minutes)`);
      return { objectKey, durationSeconds };

    } catch (err) {
      console.error('Error uploading to R2:', err);
      
      // Abort multipart upload on error
      if (uploadId && objectKey) {
        try {
          console.log('Aborting multipart upload...');
          await fetch('/api/multipart-upload/abort', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ objectKey, uploadId }),
          });
        } catch (abortError) {
          console.error('Failed to abort upload:', abortError);
        }
      }
      
      throw err;
    }
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
        // Don't reset form here - let the success page handle it
    } catch (err) {
        console.error('Error posting video data:', err);
        setError((err as Error).message);
        throw err; // Re-throw to be caught by handleSubmit
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
    setUploadStartTime(Date.now());

    try {
      let fileToUpload = selectedFile;

      // Check if we need to transcode (or use cached transcoded file)
      if (!transcodedFile) {
        setIsTranscoding(true);
        setTranscodeProgress(0);
        
        console.log('Starting client-side transcoding...');
        console.log(`Multi-thread available: ${canUseMultiThread()}`);
        
        try {
          fileToUpload = await transcodeToMp4(selectedFile, (percent) => {
            setTranscodeProgress(percent);
          });
          setTranscodedFile(fileToUpload);
          console.log('Transcoding complete');
        } catch (transcodeError) {
          console.error('Transcoding failed:', transcodeError);
          throw new Error(`Video conversion failed: ${(transcodeError as Error).message}. Try a different video or browser.`);
        } finally {
          setIsTranscoding(false);
        }
      } else {
        // Use cached transcoded file
        fileToUpload = transcodedFile;
        console.log('Using cached transcoded file');
      }
      
      // Check file size after transcoding
      if (fileToUpload.size > MAX_FILE_SIZE) {
        throw new Error(`Video is too large after conversion (${(fileToUpload.size / (1024 * 1024)).toFixed(1)}MB). Maximum is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      }
      
      // Upload to R2
      const { objectKey, durationSeconds } = await uploadToR2(fileToUpload);
      
      // Save to database
      await postData(objectKey);
      
      // Navigate to success page
      router.push(`/video-success?fileName=${encodeURIComponent(objectKey)}&duration=${durationSeconds}`);
    } catch (err) {
      console.error('Error during video submission:', err);
      setError((err as Error).message);
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
      setUploadStartTime(null);
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
          Upload your video (any format)
        </Text>
        <Text 
          fontSize={{ base: "xs", md: "sm" }} 
          color="whiteAlpha.900" 
          textAlign="center"
          px={4}
          mt={1}
        >
          Videos will be automatically converted for web playback
        </Text>

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="video/*"
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

        {/* Transcode Progress */}
        {isTranscoding && (
          <Box width={{ base: "90%", md: "400px" }} maxWidth="400px" mt={4}>
            <Text fontSize="sm" color="white" mb={2}>
              Converting video for web playback: {transcodeProgress}%
              {elapsedTime > 0 && ` • ${formatElapsedTime(elapsedTime)}`}
              {!canUseMultiThread() && ' (single-thread mode - may be slower)'}
            </Text>
            <Box 
              width="100%" 
              height="8px" 
              bg="whiteAlpha.300" 
              borderRadius="md" 
              overflow="hidden"
            >
              <Box 
                width={transcodeProgress === 0 ? '100%' : `${transcodeProgress}%`}
                height="100%" 
                bg="yellow.300" 
                transition="width 0.3s ease"
                style={transcodeProgress === 0 ? {
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

        {/* Upload Progress */}
        {loading && !isTranscoding && (
          <Box width={{ base: "90%", md: "400px" }} maxWidth="400px" mt={4}>
            <Text fontSize="sm" color="white" mb={2}>
              {uploadProgress === 0 
                ? 'Preparing upload...' 
                : `Uploading: ${uploadProgress}%`
              }
              {elapsedTime > 0 && ` • ${formatElapsedTime(elapsedTime)}`}
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
            <Flex align="center" gap={2}>
              <Box
                as="span"
                display="inline-block"
                width="16px"
                height="16px"
                border="3px solid"
                borderColor="#f24236"
                borderTopColor="transparent"
                borderRadius="50%"
                animation="spin 0.8s linear infinite"
              />
              <Text>{isTranscoding ? 'Converting...' : 'Uploading...'}</Text>
              <style jsx>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </Flex>
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