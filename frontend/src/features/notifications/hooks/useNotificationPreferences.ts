import { useState, useEffect, useCallback } from 'react';
import type { NotificationPreferences } from '../components/NotificationSettings';

const STORAGE_KEY = 'notification-preferences';

const defaultPreferences: NotificationPreferences = {
  emailNotifications: true,
  browserNotifications: true,
  soundEnabled: true,
  notificationTypes: {
    info: true,
    success: true,
    warning: true,
    error: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  frequency: 'immediate',
};

export interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences;
  updatePreferences: (preferences: NotificationPreferences) => void;
  resetPreferences: () => void;
  isInQuietHours: () => boolean;
  shouldShowNotification: (type: string) => boolean;
}

export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }, []);

  const updatePreferences = useCallback(
    (newPreferences: NotificationPreferences) => {
      setPreferences(newPreferences);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
      } catch (error) {
        console.error('Error saving notification preferences:', error);
      }
    },
    []
  );

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting notification preferences:', error);
    }
  }, []);

  const isInQuietHours = useCallback((): boolean => {
    if (!preferences.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMinute] = preferences.quietHours.start
      .split(':')
      .map(Number);
    const [endHour, endMinute] = preferences.quietHours.end
      .split(':')
      .map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    // Handle same-day quiet hours (e.g., 12:00 to 14:00)
    return currentTime >= startTime && currentTime <= endTime;
  }, [preferences.quietHours]);

  const shouldShowNotification = useCallback(
    (type: string): boolean => {
      // Check if notification type is enabled
      if (type in preferences.notificationTypes) {
        return preferences.notificationTypes[
          type as keyof typeof preferences.notificationTypes
        ];
      }

      // Default to showing if type is not in preferences
      return true;
    },
    [preferences]
  );

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    isInQuietHours,
    shouldShowNotification,
  };
}
