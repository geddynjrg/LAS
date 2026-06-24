'use client';

import { useSession } from '@/hooks/useSession';
import { persistReturnPath } from '@/lib/return-path';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function LastVisitedPathTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useSession();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const search = searchParams.toString();
    const path = search ? `${pathname}?${search}` : pathname;
    persistReturnPath(path);
  }, [isAuthenticated, pathname, searchParams]);

  return null;
}
