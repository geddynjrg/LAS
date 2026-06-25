'use client';

import { type Locale, locales } from '@/i18n/config';
import { setUserLocale } from '@/lib/locale';
import { IconHelp } from '@tabler/icons-react';
import { FlagSelect } from '@workspace/ui/components/flag-select';
import { NavLink } from '@workspace/ui/components/nav-link';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSubmenu,
} from '@workspace/ui/components/sidebar';
import { useTranslations } from 'next-intl';
import type { FC } from 'react';

export interface AppSidebarProps {
  locale: Locale;
}

export const AppSidebar: FC<AppSidebarProps> = ({ locale }) => {
  const t = useTranslations('Common');
  const help = useTranslations('HelpPage.nav');

  return (
    <Sidebar title={t('menu')} closeTitle={t('closeMenu')}>
      <SidebarHeader>
        <FlagSelect
          defaultValue={locale}
          onChange={setUserLocale}
          options={locales}
          variant="list"
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem asChild>
            <NavLink href="/">{t('home')}</NavLink>
          </SidebarMenuItem>
          <SidebarMenuItem asChild>
            <NavLink href="/dashboard">{t('myApplications')}</NavLink>
          </SidebarMenuItem>
          <SidebarSubmenu title={t('helpAndSupport')} icon={<IconHelp />}>
            <SidebarMenuItem asChild>
              <NavLink href="/help#gettingStarted">
                {help('gettingStarted')}
              </NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <NavLink href="/help#applicationProcess">
                {help('applicationProcess')}
              </NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <NavLink href="/help#memberConfirmation">
                {help('memberConfirmation')}
              </NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <NavLink href="/help#statusUpdates">
                {help('statusUpdates')}
              </NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <NavLink href="/help#repayment">{help('repayment')}</NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <NavLink href="/help#faq">{help('faq')}</NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <NavLink href="/help#contact">{help('contact')}</NavLink>
            </SidebarMenuItem>
          </SidebarSubmenu>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};
