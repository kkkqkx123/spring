import React, { useEffect } from 'react';
import { AppShell as MantineAppShell, Overlay, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Navigation } from './Navigation';
import { Header } from './Header';
import type { User } from '../../types';
import {
  useIsMobile,
  useIsTablet,
  useTouchGestures,
} from '../../utils/responsive';

export interface AppShellProps {
  user: User;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const [opened, { toggle, close, open }] = useDisclosure();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Close navigation when screen size changes from mobile to desktop
  useEffect(() => {
    if (!isMobile && opened) {
      close();
    }
  }, [isMobile, opened, close]);

  // Touch gestures for mobile navigation
  const touchGestures = useTouchGestures({
    onSwipeRight: () => {
      if (isMobile && !opened) {
        open();
      }
    },
    onSwipeLeft: () => {
      if (isMobile && opened) {
        close();
      }
    },
  });

  // Responsive navbar width
  const getNavbarWidth = () => {
    if (isMobile) return 280;
    if (isTablet) return 260;
    return 280;
  };

  // Responsive header height
  const getHeaderHeight = () => {
    if (isMobile) return 56;
    return 60;
  };

  // Responsive padding
  const getMainPadding = () => {
    if (isMobile) return 'sm';
    if (isTablet) return 'md';
    return 'lg';
  };

  return (
    <Box {...touchGestures} style={{ height: '100vh', overflow: 'hidden' }}>
      <MantineAppShell
        header={{ height: getHeaderHeight() }}
        navbar={{
          width: getNavbarWidth(),
          breakpoint: 'md',
          collapsed: { mobile: !opened, desktop: false },
        }}
        padding={getMainPadding()}
        style={{
          '--app-shell-navbar-offset': isMobile && opened ? '0px' : undefined,
        }}
      >
        <MantineAppShell.Header>
          <Header
            user={user}
            navbarOpened={opened}
            toggleNavbar={toggle}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </MantineAppShell.Header>

        <MantineAppShell.Navbar
          p={isMobile ? 'sm' : 'md'}
          style={{
            // Enhanced mobile navbar styling
            ...(isMobile && {
              position: 'fixed',
              top: 0,
              left: 0,
              height: '100vh',
              zIndex: 1000,
              transform: opened ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s ease',
              boxShadow: opened ? '0 0 20px rgba(0, 0, 0, 0.3)' : 'none',
            }),
          }}
        >
          <Navigation
            user={user}
            onNavigate={isMobile ? close : undefined}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </MantineAppShell.Navbar>

        {/* Mobile overlay */}
        {isMobile && opened && (
          <Overlay
            color="#000"
            opacity={0.5}
            onClick={close}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />
        )}

        <MantineAppShell.Main
          style={{
            // Ensure proper scrolling on mobile
            height: isMobile
              ? `calc(100vh - ${getHeaderHeight()}px)`
              : undefined,
            overflowY: 'auto',
            overflowX: 'hidden',
            // Add safe area padding for mobile devices
            paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : undefined,
          }}
        >
          {/* Skip link for accessibility */}
          <a
            href="#main-content"
            className="skip-link"
            style={{
              position: 'absolute',
              top: -40,
              left: 6,
              background: 'var(--mantine-color-blue-6)',
              color: 'white',
              padding: 8,
              textDecoration: 'none',
              borderRadius: 4,
              zIndex: 1000,
            }}
            onFocus={e => {
              e.currentTarget.style.top = '6px';
            }}
            onBlur={e => {
              e.currentTarget.style.top = '-40px';
            }}
          >
            Skip to main content
          </a>

          <Box id="main-content" tabIndex={-1}>
            {children}
          </Box>
        </MantineAppShell.Main>
      </MantineAppShell>
    </Box>
  );
}
