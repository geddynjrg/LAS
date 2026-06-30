import { ProfileMenu } from '@/components/profile-menu';
import { Header } from '@workspace/ui/components/header';
import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import type { FC } from 'react';

export const AppHeader: FC = () => {
  const t = useTranslations('Common');

  return (
    <Header
      startDecorator={
        <Link href="/">
          <Image
            alt="Uwezo Fund Logo"
            src="/images/uwezo_logo_full.png"
            width={82}
            height={69}
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
