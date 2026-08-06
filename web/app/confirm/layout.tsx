import { LOANS_NOINDEX_METADATA } from '@/lib/seo/site';
import type { ReactNode } from 'react';

export const metadata = LOANS_NOINDEX_METADATA;

export default function ConfirmLayout({ children }: { children: ReactNode }) {
  return children;
}
