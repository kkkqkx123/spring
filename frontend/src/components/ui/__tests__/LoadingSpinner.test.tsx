import React from 'react';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { LoadingSpinner } from '../LoadingSpinner';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('LoadingSpinner', () => {
  it('renders loading spinner', () => {
    render(
      <TestWrapper>
        <LoadingSpinner />
      </TestWrapper>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with custom size', () => {
    render(
      <TestWrapper>
        <LoadingSpinner size="lg" />
      </TestWrapper>
    );

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('data-size', 'lg');
  });

  it('renders with custom text', () => {
    render(
      <TestWrapper>
        <LoadingSpinner message="Loading data..." />
      </TestWrapper>
    );

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders centered spinner', () => {
    render(
      <TestWrapper>
        <LoadingSpinner centered />
      </TestWrapper>
    );

    const container = screen.getByRole('status').parentElement;
    expect(container).toHaveClass('centered');
  });

  it('renders overlay spinner', () => {
    render(
      <TestWrapper>
        <LoadingSpinner overlay />
      </TestWrapper>
    );

    const container = screen.getByRole('status').parentElement;
    expect(container).toHaveClass('overlay');
  });

  it('renders with custom color', () => {
    render(
      <TestWrapper>
        <LoadingSpinner color="red" />
      </TestWrapper>
    );

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('data-color', 'red');
  });

  it('has proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <LoadingSpinner />
      </TestWrapper>
    );

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders with custom aria-label', () => {
    render(
      <TestWrapper>
        <LoadingSpinner ariaLabel="Loading employees" />
      </TestWrapper>
    );

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading employees');
  });
});
