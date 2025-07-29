import React from 'react';
import { Box, Indicator, Avatar, Tooltip } from '@mantine/core';

interface OnlineStatusProps {
  isOnline: boolean;
  userName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTooltip?: boolean;
}

export const OnlineStatus: React.FC<OnlineStatusProps> = ({
  isOnline,
  userName,
  size = 'sm',
  showTooltip = true,
}) => {
  const avatar = (
    <Indicator
      color={isOnline ? 'green' : 'gray'}
      size={8}
      offset={2}
      position="bottom-end"
      withBorder
    >
      <Avatar size={size} radius="xl" color="blue">
        {userName.charAt(0).toUpperCase()}
      </Avatar>
    </Indicator>
  );

  if (showTooltip) {
    return (
      <Tooltip
        label={`${userName} is ${isOnline ? 'online' : 'offline'}`}
        position="top"
      >
        {avatar}
      </Tooltip>
    );
  }

  return avatar;
};

// Simple online indicator dot
interface OnlineDotProps {
  isOnline: boolean;
  size?: number;
}

export const OnlineDot: React.FC<OnlineDotProps> = ({ isOnline, size = 8 }) => {
  return (
    <Box
      style={theme => ({
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: isOnline
          ? theme.colors.green[6]
          : theme.colors.gray[4],
        border: `2px solid ${theme.white}`,
        boxShadow: theme.shadows.sm,
      })}
    />
  );
};

export default OnlineStatus;
