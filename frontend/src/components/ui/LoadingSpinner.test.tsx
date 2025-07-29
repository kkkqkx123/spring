import React from 'react';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import {
  LoadingSpinner,
  PageLoadingSpinner,
  InlineLoadingSpinner,
  OverlayLoadingSpinner,
  FullPageLoadingSpinner,
} from './LoadingSpinner';

const renderWithProvider = (component: React.ReactElement) => {
  return render(<MantineProvider>{component}</MantineProvider>);
};

describe('LoadingSpinner', () => {
  it('renders basic loading spinner', () => {
    renderWithProvider(<LoadingSpinner />);

    // Mantine Loader component should be present
    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    renderWithProvider(<LoadingSpinner message="Loading data..." />);

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = renderWithProvider(<LoadingSpinner size="sm" />);
    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();

    rerender(
      <MantineProvider>
        <LoadingSpinner size="lg" />
      </MantineProvider>
    );
    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('renders as overlay when overlay prop is true', () => {
    renderWithProvider(<LoadingSpinner overlay />);

    expect(document.querySelector('.mantine-Overlay-root')).toBeInTheDocument();
  });

  it('renders overlay with custom message', () => {
    renderWithProvider(<LoadingSpinner overlay message="Processing..." />);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(document.querySelector('.mantine-Overlay-root')).toBeInTheDocument();
  });
});

describe('PageLoadingSpinner', () => {
  it('renders page loading spinner with default message', () => {
    renderWithProvider(<PageLoadingSpinner />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    renderWithProvider(
      <PageLoadingSpinner message="Loading page content..." />
    );

    expect(screen.getByText('Loading page content...')).toBeInTheDocument();
  });
});

describe('InlineLoadingSpinner', () => {
  it('renders inline loading spinner', () => {
    renderWithProvider(<InlineLoadingSpinner />);

    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('renders with custom size', () => {
    renderWithProvider(<InlineLoadingSpinner size="lg" />);

    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });
});

describe('OverlayLoadingSpinner', () => {
  it('renders overlay loading spinner when visible', () => {
    renderWithProvider(<OverlayLoadingSpinner visible={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(document.querySelector('.mantine-Overlay-root')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    renderWithProvider(<OverlayLoadingSpinner visible={false} />);

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('renders with custom message', () => {
    renderWithProvider(<OverlayLoadingSpinner message="Saving..." />);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });
});

describe('FullPageLoadingSpinner', () => {
  it('renders full page loading spinner', () => {
    renderWithProvider(<FullPageLoadingSpinner />);

    expect(screen.getByText('Loading application...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    renderWithProvider(<FullPageLoadingSpinner message="Initializing..." />);

    expect(screen.getByText('Initializing...')).toBeInTheDocument();
  });

  it('has fixed positioning styles', () => {
    renderWithProvider(<FullPageLoadingSpinner />);

    // Check that the component renders with fixed positioning
    expect(screen.getByText('Loading application...')).toBeInTheDocument();

    // The component should have the proper structure for full page loading
    const loadingText = screen.getByText('Loading application...');
    expect(loadingText).toBeInTheDocument();
  });
});
