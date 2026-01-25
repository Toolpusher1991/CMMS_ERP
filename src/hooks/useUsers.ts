import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/services/api';

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  assignedPlant?: string;
  role?: string;
}

// Global cache shared across all components
const userListCache: {
  data: UserListItem[] | null;
  timestamp: number;
  maxAge: number;
} = {
  data: null,
  timestamp: 0,
  maxAge: 5 * 60 * 1000, // 5 minutes
};

interface UseUsersOptions {
  autoLoad?: boolean;
  filterByPlant?: string;
}

interface UseUsersReturn {
  users: UserListItem[];
  loading: boolean;
  error: string | null;
  loadUsers: () => Promise<void>;
  getUserById: (id: string) => UserListItem | undefined;
  getUserByEmail: (email: string) => UserListItem | undefined;
  getUserDisplayName: (idOrEmail: string) => string;
  clearCache: () => void;
}

export function useUsers(options: UseUsersOptions = {}): UseUsersReturn {
  const { autoLoad = true, filterByPlant } = options;
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const loadUsers = useCallback(async () => {
    const now = Date.now();
    
    // Check cache first
    if (
      userListCache.data &&
      now - userListCache.timestamp < userListCache.maxAge
    ) {
      let cachedUsers = userListCache.data;
      
      // Apply plant filter if specified
      if (filterByPlant) {
        cachedUsers = cachedUsers.filter(
          u => !u.assignedPlant || u.assignedPlant === filterByPlant
        );
      }
      
      if (isMounted.current) {
        setUsers(cachedUsers);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get<UserListItem[]>('/users/list');
      
      // Update cache
      userListCache.data = response;
      userListCache.timestamp = Date.now();
      
      let filteredUsers = response;
      
      // Apply plant filter if specified
      if (filterByPlant) {
        filteredUsers = response.filter(
          u => !u.assignedPlant || u.assignedPlant === filterByPlant
        );
      }
      
      if (isMounted.current) {
        setUsers(filteredUsers);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      if (isMounted.current) {
        setError('Benutzer konnten nicht geladen werden');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [filterByPlant]);

  const getUserById = useCallback((id: string): UserListItem | undefined => {
    return users.find(u => u.id === id);
  }, [users]);

  const getUserByEmail = useCallback((email: string): UserListItem | undefined => {
    return users.find(u => u.email === email);
  }, [users]);

  const getUserDisplayName = useCallback((idOrEmail: string): string => {
    if (!idOrEmail) return 'Nicht zugewiesen';

    // Check if it's already a formatted name (contains space, no @)
    if (idOrEmail.includes(' ') && !idOrEmail.includes('@')) {
      return idOrEmail;
    }

    // Try to find user by ID
    const userById = users.find(u => u.id === idOrEmail);
    if (userById) {
      return `${userById.firstName} ${userById.lastName}`;
    }

    // Try to find user by email
    const userByEmail = users.find(u => u.email === idOrEmail);
    if (userByEmail) {
      return `${userByEmail.firstName} ${userByEmail.lastName}`;
    }

    // If it looks like an email, show just the email prefix
    if (idOrEmail.includes('@')) {
      return idOrEmail.split('@')[0];
    }

    // Fallback: return as-is but truncate if it's a UUID
    if (idOrEmail.length > 20) {
      return 'Unbekannter User';
    }

    return idOrEmail;
  }, [users]);

  const clearCache = useCallback(() => {
    userListCache.data = null;
    userListCache.timestamp = 0;
  }, []);

  useEffect(() => {
    isMounted.current = true;
    
    if (autoLoad) {
      loadUsers();
    }

    return () => {
      isMounted.current = false;
    };
  }, [autoLoad, loadUsers]);

  return {
    users,
    loading,
    error,
    loadUsers,
    getUserById,
    getUserByEmail,
    getUserDisplayName,
    clearCache,
  };
}
