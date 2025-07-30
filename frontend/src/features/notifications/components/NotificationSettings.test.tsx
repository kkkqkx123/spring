import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import {
  NotificationSettings,
  NotificationPreferences,
} from './NotificationSettings';
import { vi } from 'vitest';

const mockPreferences: NotificationPreferences = {
  emailNotifications: true,
  browserNotifications: true,
  soundEnabled: false,
  notificationTypes: {
    info: true,
    success: true,
    warning: false,
    error: true,
  },
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00',
  },
  frequency: 'immediate',
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(<MantineProvider>{component}</MantineProvider>);
};

describe('NotificationSettings', () => {
  it('renders all settings sections', () => {
    renderWithProvider(<NotificationSettings preferences={mockPreferences} />);

    expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    expect(screen.getByText('General Settings')).toBeInTheDocument();
    expect(screen.getByText('Notification Types')).toBeInTheDocument();
    expect(screen.getByText('Quiet Hours')).toBeInTheDocument();
  });

  it('displays current preferences correctly', () => {
    renderWithProvider(<NotificationSettings preferences={mockPreferences} />);

    // Check that the settings sections are rendered
    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    expect(screen.getByText('Browser Notifications')).toBeInTheDocument();
    expect(screen.getByText('Sound Notifications')).toBeInTheDocument();
    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Warnings')).toBeInTheDocument();
    expect(screen.getByText('Errors')).toBeInTheDocument();
    expect(screen.getByText('Enable Quiet Hours')).toBeInTheDocument();
  });

  it('shows quiet hours controls when enabled', () => {
    renderWithProvider(<NotificationSettings preferences={mockPreferences} />);

    const startTimeInputs = screen.getAllByLabelText('Start Time');
    const endTimeInputs = screen.getAllByLabelText('End Time');
    expect(startTimeInputs[0]).toBeInTheDocument();
    expect(endTimeInputs[0]).toBeInTheDocument();
    expect(
      screen.getByText(/quiet hours will suppress browser/i)
    ).toBeInTheDocument();
  });

  it('hides quiet hours controls when disabled', () => {
    const preferencesWithoutQuietHours = {
      ...mockPreferences,
      quietHours: { ...mockPreferences.quietHours, enabled: false },
    };

    renderWithProvider(
      <NotificationSettings preferences={preferencesWithoutQuietHours} />
    );

    expect(screen.queryByLabelText('Start Time')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('End Time')).not.toBeInTheDocument();
  });

  it('enables save button when changes are made', async () => {
    renderWithProvider(<NotificationSettings preferences={mockPreferences} />);

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    expect(saveButton).toBeDisabled();

    // Make a change by clicking the first switch (email notifications)
    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
  });

  it('calls onSave with updated preferences', async () => {
    const onSave = vi.fn();
    renderWithProvider(
      <NotificationSettings preferences={mockPreferences} onSave={onSave} />
    );

    // Make a change by clicking the first switch (email notifications)
    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        ...mockPreferences,
        emailNotifications: false,
      });
    });
  });

  it('resets changes when reset button is clicked', async () => {
    renderWithProvider(<NotificationSettings preferences={mockPreferences} />);

    // Make a change by clicking the first switch (email notifications)
    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);

    // Reset changes
    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /save settings/i })
      ).toBeDisabled();
    });
  });

  it('updates notification frequency', async () => {
    const onSave = vi.fn();
    renderWithProvider(
      <NotificationSettings preferences={mockPreferences} onSave={onSave} />
    );

    // Change frequency
    const frequencySelect = screen.getByDisplayValue('Immediate');
    fireEvent.click(frequencySelect);

    const hourlyOption = screen.getByText('Hourly digest');
    fireEvent.click(hourlyOption);

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        ...mockPreferences,
        frequency: 'hourly',
      });
    });
  });

  it('updates quiet hours time settings', async () => {
    const onSave = vi.fn();
    renderWithProvider(
      <NotificationSettings preferences={mockPreferences} onSave={onSave} />
    );

    // Change start time - get the first input with value 22:00
    const startTimeSelects = screen.getAllByDisplayValue('22:00');
    const startTimeSelect = startTimeSelects[0];
    fireEvent.click(startTimeSelect);

    const newStartTime = screen.getByText('23:00');
    fireEvent.click(newStartTime);

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        ...mockPreferences,
        quietHours: {
          ...mockPreferences.quietHours,
          start: '23:00',
        },
      });
    });
  });

  it('shows loading state', () => {
    renderWithProvider(
      <NotificationSettings preferences={mockPreferences} loading />
    );

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    expect(saveButton).toHaveAttribute('data-loading', 'true');
  });

  it('disables buttons when loading', () => {
    renderWithProvider(
      <NotificationSettings preferences={mockPreferences} loading />
    );

    expect(
      screen.getByRole('button', { name: /save settings/i })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled();
  });
});
