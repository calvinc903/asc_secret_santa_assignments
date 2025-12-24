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

const USERS_CACHE_KEY = 'asc_secret_santa_users';
const CACHE_EXPIRY_KEY = 'asc_secret_santa_users_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to load from local storage first
    const cachedUsers = loadUsersFromCache();
    
    if (cachedUsers) {
      // Instantly set cached users
      setUsers(cachedUsers);
      setLoading(false);
      
      // Still fetch fresh data in the background
      fetchUsers(true);
    } else {
      // No cache, fetch normally
      fetchUsers(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsersFromCache = (): string[] | null => {
    try {
      const cached = localStorage.getItem(USERS_CACHE_KEY);
      const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
      
      if (cached && expiry) {
        const expiryTime = parseInt(expiry, 10);
        if (Date.now() < expiryTime) {
          return JSON.parse(cached);
        } else {
          // Cache expired, clear it
          localStorage.removeItem(USERS_CACHE_KEY);
          localStorage.removeItem(CACHE_EXPIRY_KEY);
        }
      }
    } catch (err) {
      console.error('Error loading users from cache:', err);
    }
    return null;
  };

  const saveUsersToCache = (userNames: string[]) => {
    try {
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(userNames));
      localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
    } catch (err) {
      console.error('Error saving users to cache:', err);
    }
  };

  const fetchUsers = async (isBackgroundFetch: boolean) => {
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
      saveUsersToCache(userNames);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      if (!isBackgroundFetch) {
        setError((err as Error).message);
      }
    } finally {
      if (!isBackgroundFetch) {
        setLoading(false);
      }
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
