import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';
import { AccessibleButton } from './AccessibleButton';

// Mock the accessibility utilities
vi.mock('../../utils/accessibility', () => ({
  useReducedMotion: vi.fn(() => false),
}));

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('AccessibleButton', () => {
  it('should render with proper ARIA attributes', () => {
    renderWithProvider(
      <AccessibleButton ariaLabel="Test button">
        Click me
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Test button');
    expect(button).toHaveAttribute('aria-busy', 'false');
    expect(button).toHaveAttribute('aria-disabled', 'false');
  });

  it('should handle loading state', () => {
    renderWithProvider(
      <AccessibleButton loading loadingText="Processing...">
        Submit
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('should handle disabled state', () => {
    renderWithProvider(
      <AccessibleButton disabled>
        Disabled button
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toBeDisabled();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    renderWithProvider(
      <AccessibleButton onClick={handleClick}>
        Click me
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should handle keyboard events', () => {
    const handleClick = vi.fn();
    renderWithProvider(
      <AccessibleButton onClick={handleClick}>
        Click me
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(button, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('should not trigger click when loading', () => {
    const handleClick = vi.fn();
    renderWithProvider(
      <AccessibleButton loading onClick={handleClick}>
        Submit
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not trigger click when disabled', () => {
    const handleClick = vi.fn();
    renderWithProvider(
      <AccessibleButton disabled onClick={handleClick}>
        Disabled
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should have minimum touch target size', () => {
    renderWithProvider(
      <AccessibleButton>
        Small
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    const styles = window.getComputedStyle(button);
    
    // Note: In a real test environment, you'd check the computed styles
    // Here we're just ensuring the style prop is set correctly
    expect(button).toHaveStyle({ minHeight: '44px', minWidth: '44px' });
  });

  it('should support aria-describedby', () => {
    renderWithProvider(
      <div>
        <AccessibleButton ariaDescribedBy="help-text">
          Submit
        </AccessibleButton>
        <div id="help-text">This will submit the form</div>
      </div>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-describedby', 'help-text');
  });

  it('should respect reduced motion preference', () => {
    const { useReducedMotion } = require('../../utils/accessibility');
    useReducedMotion.mockReturnValue(true);

    renderWithProvider(
      <AccessibleButton style={{ transition: 'all 0.3s ease' }}>
        Button
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    // The component should override the transition when reduced motion is preferred
    expect(button).toHaveStyle({ transition: 'none' });
  });
});