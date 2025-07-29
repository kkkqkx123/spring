import React, { useState } from 'react';
import {
  AppShell as MantineAppShell,
  Burger,
  Group,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Navigation } from './Navigation';
import { Header } from './Header';
import { User } from '../../types';

export interface AppShellProps {
  user: User;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const [opened, { toggle, close }] = useDisclosure();
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: 'md',
        collapsed: { mobile: !opened, desktop: false },
      }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Header
          user={user}
          navbarOpened={opened}
          toggleNavbar={toggle}
          isMobile={isMobile}
        />
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p="md">
        <Navigation user={user} onNavigate={isMobile ? close : undefined} />
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  );
}
