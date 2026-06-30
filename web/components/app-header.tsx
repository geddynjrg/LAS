'use client';

import { ProfileMenu } from '@/components/profile-menu';
import { Header } from '@workspace/ui/components/header';
import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { FC } from 'react';

const AUTH_ROUTES = ['/login', '/signup', '/reset'];

export const AppHeader: FC = () => {
  const t = useTranslations('Common');
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  return (
    <Header
      startDecorator={
        <Link href="/">
          <Image
            alt="Uwezo Fund Logo"
            src="/images/uwezo_logo_full.png"
            width={isAuthRoute ? 158 : 82}
            height={isAuthRoute ? 60 : 69}
            priority={isAuthRoute}
          />
        </Link>
      }
      className="bg-background"
      endDecorator={
        <>
          <SidebarTrigger>{t('menu')}</SidebarTrigger>
          <ProfileMenu />
        </>
      }
    />
  );
};
