import React from 'react';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
import { User } from '../../types';

// Mock the child components
vi.mock('./Navigation', () => ({
  Navigation: ({ user, onNavigate }: any) => (
    <div data-testid="navigation">
      Navigation for {user.username}
      {onNavigate && <button onClick={onNavigate}>Navigate</button>}
    </div>
  ),
}));

vi.mock('./Header', () => ({
  Header: ({ user, navbarOpened, toggleNavbar, isMobile }: any) => (
    <div data-testid="header">
      Header for {user.username}
      <button onClick={toggleNavbar}>
        Toggle: {navbarOpened ? 'Open' : 'Closed'}
      </button>
      {isMobile && <span>Mobile</span>}
    </div>
  ),
}));

const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  roles: [{ id: 1, name: 'USER', permissions: [] }],
  enabled: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      <BrowserRouter>{component}</BrowserRouter>
    </MantineProvider>
  );
};

describe('AppShell', () => {
  it('renders with user and children', () => {
    renderWithProviders(
      <AppShell user={mockUser}>
        <div data-testid="main-content">Main Content</div>
      </AppShell>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });

  it('passes user to header and navigation components', () => {
    renderWithProviders(
      <AppShell user={mockUser}>
        <div>Content</div>
      </AppShell>
    );

    expect(screen.getByText('Header for testuser')).toBeInTheDocument();
    expect(screen.getByText('Navigation for testuser')).toBeInTheDocument();
  });

  it('renders children in main area', () => {
    renderWithProviders(
      <AppShell user={mockUser}>
        <div data-testid="child-content">Child Content</div>
      </AppShell>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  // Note: Testing responsive behavior and navbar toggle would require more complex setup
  // with media query mocking, which is beyond the scope of this basic test
});
