import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export interface CreateLayoutProps {
  children?: ReactNode;
}

export default async function CreateLayout({ children }: CreateLayoutProps) {
  const session = await getSession();

  if (!session) {
    redirect('/login?callbackUrl=/apply/create');
  }

  return <>{children}</>;
}
