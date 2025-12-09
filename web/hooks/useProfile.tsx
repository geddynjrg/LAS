'use client';

import type { UserProfileResponseType } from '@/lib/api/schema/response/auth-response.schema';
import { useMemo } from 'react';

import { useSession } from './useSession';

interface UserIdentification {
  identifier: string;
  identifierType: 'email' | 'phone' | 'name';
}

interface UseProfileReturn {
  profile: UserProfileResponseType['data'];
  userIdentification: UserIdentification | null;
  isAdmin: boolean;
  getDisplayName: () => string;
  getContactInfo: () => string;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useProfile(): UseProfileReturn {
  const { profile, isLoading } = useSession();

  const userIdentification = useMemo((): UserIdentification | null => {
    if (!profile) return null;

    // Priority order: email > phoneNumber > name
    if (profile.email) {
      return {
        identifier: profile.email,
        identifierType: 'email',
      };
    }

    if (profile.phoneNumber) {
      return {
        identifier: profile.phoneNumber,
        identifierType: 'phone',
      };
    }

    if (profile.name) {
      return {
        identifier: profile.name,
        identifierType: 'name',
      };
    }

    return null;
  }, [profile]);

  const isAdmin = useMemo(() => {
    if (!profile?.roles) return false;
    return profile.roles.some(
      (role: string) =>
        role.toLowerCase() === 'admin' ||
        role.toLowerCase() === 'administrator',
    );
  }, [profile?.roles]);

  const getDisplayName = useMemo(
    () => () => {
      if (!profile) return 'User';

      // Priority: email > phoneNumber > name
      if (profile.email) return profile.email;
      if (profile.phoneNumber) return profile.phoneNumber;
      if (profile.name) return profile.name;

      return 'User';
    },
    [profile],
  );

  const getContactInfo = useMemo(
    () => () => {
      if (!profile) return '';

      // Return the best contact information available
      const contactMethods = [];
      if (profile.email) contactMethods.push(`Email: ${profile.email}`);
      if (profile.phoneNumber)
        contactMethods.push(`Phone: ${profile.phoneNumber}`);

      return contactMethods.join(' • ');
    },
    [profile],
  );

  return {
    profile: profile ?? undefined,
    userIdentification,
    isAdmin,
    getDisplayName,
    getContactInfo,
    isAuthenticated: !!profile,
    isLoading,
  };
}
