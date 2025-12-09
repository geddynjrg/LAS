import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

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
