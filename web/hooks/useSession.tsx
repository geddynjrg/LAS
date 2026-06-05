'use client';

import type { UserProfileResponseType } from '@/lib/api/schema/response/auth-response.schema';
import { usePathname, useRouter } from 'next/navigation';
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

// Enhanced session type that includes user profile data
type SessionData = {
  isAuthenticated: boolean;
  profile: UserProfileResponseType['data'] | null;
  isLoading: boolean;
  error: string | null;
};

interface SessionContextProps extends SessionData {
  // Methods for session management
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const SessionContext = createContext<SessionContextProps | undefined>(
  undefined,
);

// Client-side API calls
async function fetchProfile(): Promise<UserProfileResponseType['data'] | null> {
  try {
    const response = await fetch('/api/profile', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null; // Not authenticated
      }

      if (response.status === 404) {
        // Return empty profile for new users
        return {
          email: undefined,
          phoneNumber: undefined,
          name: undefined,
          roles: [],
          created: undefined,
          last_access: undefined,
        };
      }

      // Don't throw for non-critical errors, just return null
      return null;
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    // Don't throw, return null to indicate no profile data
    return null;
  }
}

async function logoutUser(): Promise<void> {
  const response = await fetch('/api/logout', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Logout failed: ${response.statusText}`);
  }
}

export const SessionProvider: React.FC<{
  initialSession: boolean;
  children?: ReactNode;
}> = ({ initialSession, children }) => {
  const router = useRouter();
  const [sessionData, setSessionData] = useState<SessionData>({
    isAuthenticated: initialSession,
    profile: null,
    isLoading: initialSession,
    error: null,
  });

  // Fetch profile data when authenticated
  const refreshProfile = useCallback(async () => {
    setSessionData((prev) => {
      if (!prev.isAuthenticated) {
        return prev;
      }
      return { ...prev, isLoading: true, error: null };
    });

    try {
      const profile = await fetchProfile();

      // If profile is null (error or not found), keep authenticated but no profile
      setSessionData((prev) => ({
        ...prev,
        profile,
        isLoading: false,
        isAuthenticated: true, // Stay authenticated even if profile fetch fails
        error: null, // Don't show error for profile fetch failures
      }));
    } catch (error) {
      setSessionData((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch profile',
      }));
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setSessionData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await logoutUser();
      setSessionData({
        isAuthenticated: false,
        profile: null,
        isLoading: false,
        error: null,
      });

      // Redirect to login page
      router.push('/login');
    } catch (error) {
      setSessionData((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      }));
    }
  }, [router]);

  // Clear error
  const clearError = useCallback(() => {
    setSessionData((prev) => ({ ...prev, error: null }));
  }, []);

  // Sync initialSession prop with internal state
  useEffect(() => {
    setSessionData((prev) => {
      // Only update if the authentication state actually changed
      if (prev.isAuthenticated !== initialSession) {
        return {
          ...prev,
          isAuthenticated: initialSession,
          isLoading: initialSession,
          profile: initialSession ? prev.profile : null,
        };
      }
      return prev;
    });
  }, [initialSession]);

  // Initial profile fetch on mount if authenticated
  useEffect(() => {
    if (initialSession) {
      void refreshProfile();
    }
  }, [initialSession, refreshProfile]);

  const contextValue: SessionContextProps = {
    ...sessionData,
    refreshProfile,
    logout,
    clearError,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextProps => {
  const context = useContext(SessionContext);

  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return context;
};

// Helper hook for requiring authentication
export const useRequireAuth = (redirectTo = '/login') => {
  const { isAuthenticated, isLoading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const callbackUrl = encodeURIComponent(pathname);
      router.push(`${redirectTo}?callbackUrl=${callbackUrl}`);
    }
  }, [isAuthenticated, isLoading, router, pathname, redirectTo]);

  return { isAuthenticated, isLoading };
};
