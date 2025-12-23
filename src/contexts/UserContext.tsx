'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface UserContextType {
  users: string[];
  loading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType>({
  users: [],
  loading: true,
  error: null,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const userNames = data.map((user: { name: string }) => {
        const name = user.name;
        return name.charAt(0).toUpperCase() + name.slice(1);
      });
      setUsers(userNames);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ users, loading, error }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
}
