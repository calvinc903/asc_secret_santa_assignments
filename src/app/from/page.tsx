'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Button, Stack, Text, Input, Spinner } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useUsers } from '@/contexts/UserContext';

export default function FromPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { users, loading: usersLoading } = useUsers();
  const [selectedUser, setSelectedUser] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
    setName(user);
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

  const fetchData = async (query: string) => {
    setLoading(true);
    setError(null);
    
    if (!selectedUser) {
      alert('Please select a user from the dropdown');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/assignments?gifter=${query.toLowerCase().trim()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.length == 1) {
        router.push(`/loadingPage?gifter=${encodeURIComponent(query)}`);
      } else {
        alert('You are not on the list!');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (name.trim()) {
      fetchData(name.toLowerCase());
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
          Reveal your Secret Santa Assignment!
        </Text>
        <Text fontSize={{ base: "lg", md: "4xl" }} color="white" fontWeight="bold" textAlign="center" px={4}>
          What&apos;s your name?
        </Text>
        
        {/* User Selection Dropdown */}
        <Box position="relative" width={{ base: "90%", md: "400px" }} maxWidth="400px" ref={dropdownRef}>
          <Input
            ref={inputRef}
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
            size={{ base: "xs", md: "lg" }}
            variant="outline"
            borderColor="white"
            color="#f24236"
            bg="white"
            p={4}
            mt={4}
            width="100%"
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