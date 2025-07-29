import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import {
  ConfirmDialog,
  DeleteConfirmDialog,
  BulkDeleteConfirmDialog,
  SaveConfirmDialog,
  LogoutConfirmDialog,
} from './ConfirmDialog';

const renderWithProvider = (component: React.ReactElement) => {
  return render(<MantineProvider>{component}</MantineProvider>);
};

describe('ConfirmDialog', () => {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Test Dialog',
    message: 'Are you sure?',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog with title and message', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ConfirmDialog {...defaultProps} />);

    await user.click(screen.getByText('Confirm'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ConfirmDialog {...defaultProps} />);

    await user.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders custom button labels', () => {
    renderWithProvider(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Delete"
        cancelLabel="Keep"
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('shows loading state on confirm button', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} loading={true} />);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toHaveAttribute('data-loading', 'true');
  });

  it('disables cancel button when loading', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} loading={true} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
  });

  it('renders different variants with appropriate colors', () => {
    const { rerender } = renderWithProvider(
      <ConfirmDialog {...defaultProps} variant="danger" />
    );

    expect(screen.getByText('Confirm')).toBeInTheDocument();

    rerender(
      <MantineProvider>
        <ConfirmDialog {...defaultProps} variant="warning" />
      </MantineProvider>
    );

    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderWithProvider(
      <ConfirmDialog {...defaultProps}>
        <div>Additional content</div>
      </ConfirmDialog>
    );

    expect(screen.getByText('Additional content')).toBeInTheDocument();
  });

  it('does not render when not opened', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} opened={false} />);

    expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();
  });
});

describe('DeleteConfirmDialog', () => {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    itemName: 'Test Item',
  };

  it('renders delete confirmation with item name', () => {
    renderWithProvider(<DeleteConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Delete Confirmation')).toBeInTheDocument();
    expect(screen.getByText(/delete "Test Item"/)).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});

describe('BulkDeleteConfirmDialog', () => {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    count: 3,
  };

  it('renders bulk delete confirmation with count', () => {
    renderWithProvider(<BulkDeleteConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Bulk Delete Confirmation')).toBeInTheDocument();
    expect(screen.getByText(/delete 3 selected items/)).toBeInTheDocument();
    expect(screen.getByText('Delete 3 items')).toBeInTheDocument();
  });

  it('handles singular form for count of 1', () => {
    renderWithProvider(<BulkDeleteConfirmDialog {...defaultProps} count={1} />);

    expect(screen.getByText(/delete 1 selected item\?/)).toBeInTheDocument();
    expect(screen.getByText('Delete 1 item')).toBeInTheDocument();
  });
});

describe('SaveConfirmDialog', () => {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  it('renders save confirmation for unsaved changes', () => {
    renderWithProvider(<SaveConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    expect(screen.getByText(/You have unsaved changes/)).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Discard')).toBeInTheDocument();
  });

  it('renders different message when no unsaved changes', () => {
    renderWithProvider(
      <SaveConfirmDialog {...defaultProps} hasUnsavedChanges={false} />
    );

    expect(
      screen.getByText(/Do you want to save your changes/)
    ).toBeInTheDocument();
  });
});

describe('LogoutConfirmDialog', () => {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  it('renders logout confirmation', () => {
    renderWithProvider(<LogoutConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Confirm Logout')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to log out/)
    ).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('Stay Logged In')).toBeInTheDocument();
  });
});
