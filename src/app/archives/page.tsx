'use client'

import { useState, useEffect } from 'react';
import { Box, Stack, Text } from '@chakra-ui/react';

interface Assignment {
  gifter: string;
  recipient: string;
  videoURL?: string;
  year: string;
  partyDate?: string;
  spreadsheetLink?: string;
  players?: string[];
  playerCount?: number;
}

export default function ArchivesPage() {
  const [archives, setArchives] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    console.log('[Archives Client] Starting to fetch archives...');
    try {
      console.log('[Archives Client] Calling /api/archives');
      const response = await fetch('/api/archives');
      console.log('[Archives Client] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch archives');
      }
      const data = await response.json();
      console.log('[Archives Client] Received data:', data);
      console.log('[Archives Client] Number of entries:', data.length);
      setArchives(data);
    } catch (err) {
      console.error('[Archives Client] Error:', err);
      setError((err as Error).message);
    } finally {
      console.log('[Archives Client] Fetch complete, setting loading to false');
      setLoading(false);
    }
  };

  const formatName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Group archives by year
  const groupedByYear = archives.reduce((acc, assignment) => {
    if (!acc[assignment.year]) {
      acc[assignment.year] = {
        assignments: [],
        partyDate: assignment.partyDate,
        spreadsheetLink: assignment.spreadsheetLink,
        players: assignment.players || [],
        playerCount: assignment.playerCount || 0
      };
    }
    acc[assignment.year].assignments.push(assignment);
    return acc;
  }, {} as Record<string, { 
    assignments: Assignment[], 
    partyDate?: string, 
    spreadsheetLink?: string,
    players: string[],
    playerCount: number
  }>);

  const years = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a)); // Newest first

  if (loading) {
    return (
      <Box bg="#f24236" minHeight="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center" pt={{ base: "80px", md: "90px" }}>
        <Box
          as="div"
          width="60px"
          height="60px"
          border="4px solid rgba(255, 255, 255, 0.3)"
          borderTop="4px solid white"
          borderRadius="50%"
          animation="spin 1s linear infinite"
          mb={4}
        />
        <Text color="white" fontSize="lg">Loading archives...</Text>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </Box>
    );
  }

  if (error) {
    return (
      <Box bg="#f24236" minHeight="100vh" display="flex" justifyContent="center" alignItems="center" pt={{ base: "80px", md: "90px" }}>
        <Text color="white" fontSize="xl">Error: {error}</Text>
      </Box>
    );
  }

  return (
    <Box
      bg="#f24236"
      minHeight="100vh"
      p={4}
      pt={{ base: "100px", md: "110px" }}
      pb={8}
    >
      <Stack align="center" mb={8}>
        <Text fontSize={{ base: "3xl", md: "5xl" }} color="white" fontWeight="bold" textAlign="center">
          Secret Santa Archive
        </Text>
        <Text fontSize={{ base: "md", md: "lg" }} color="white" textAlign="center" opacity={0.9}>
          Previous Years
        </Text>
      </Stack>

      <Box maxW="1200px" mx="auto">
        {archives.length === 0 ? (
          <Box bg="white" p={8} borderRadius="md" textAlign="center">
            <Text fontSize="xl" color="#f24236">
              No archives available yet
            </Text>
            <Text fontSize="md" color="gray.600" mt={2}>
              Archives will be available after February 1st of the following year
            </Text>
          </Box>
        ) : (
          <Stack gap={8}>
            {years.map((year) => {
              const yearData = groupedByYear[year];
              return (
                <Box key={year}>
                  {/* Year Header */}
                  <Box bg="white" p={6} borderTopRadius="md" borderBottom="3px solid #f24236">
                    <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="#f24236" mb={2}>
                      {year}
                    </Text>
                    {yearData.partyDate && (
                      <Text fontSize={{ base: "sm", md: "md" }} color="gray.700" mb={1}>
                        Party Date: {new Date(yearData.partyDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Text>
                    )}
                    {yearData.spreadsheetLink && (
                      <Text fontSize={{ base: "sm", md: "md" }} color="#333" mb={2}>
                        <Text 
                          as="a" 
                          href={yearData.spreadsheetLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          color="#0066cc" 
                          textDecoration="underline"
                        >
                          View Gift Spreadsheet
                        </Text>
                      </Text>
                    )}
                    {yearData.playerCount > 0 && (
                      <Box mt={3} pt={3} borderTop="1px solid #f0f0f0">
                        <Text fontSize={{ base: "sm", md: "md" }} color="gray.700" fontWeight="semibold" mb={2}>
                          Players ({yearData.playerCount})
                        </Text>
                        <Text fontSize={{ base: "sm", md: "md" }} color="gray.600">
                          {yearData.players.map(formatName).join(', ')}
                        </Text>
                      </Box>
                    )}
                  </Box>

                  {/* Assignments */}
                  <Stack gap={0}>
                    {yearData.assignments.map((assignment, index) => (
                      <Box
                        key={index}
                        bg="white"
                        p={6}
                        borderBottom={index < yearData.assignments.length - 1 ? "1px solid #f0f0f0" : "none"}
                        _last={{ borderBottomRadius: "md" }}
                      >
                        <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="#333" mb={2}>
                          {formatName(assignment.gifter)} → {formatName(assignment.recipient)}
                        </Text>
                        {assignment.videoURL ? (
                          <Text fontSize={{ base: "sm", md: "md" }} color="#333">
                            <Text 
                              as="a" 
                              href={assignment.videoURL.startsWith('http') ? assignment.videoURL : `https://www.youtube.com/watch?v=${assignment.videoURL}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              color="#0066cc" 
                              textDecoration="underline"
                            >
                              Watch Video
                            </Text>
                          </Text>
                        ) : (
                          <Text fontSize={{ base: "sm", md: "md" }} color="gray.500" fontStyle="italic">
                            No video uploaded
                          </Text>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
