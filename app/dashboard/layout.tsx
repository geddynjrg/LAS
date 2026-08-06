import { getSession } from '@/lib/session';
import { LOANS_NOINDEX_METADATA } from '@/lib/seo/site';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export const metadata = LOANS_NOINDEX_METADATA;

export interface DashboardLayoutProps {
  children?: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await getSession();

  if (!session) {
    redirect('/login?callbackUrl=/dashboard');
  }

  return <>{children}</>;
}
