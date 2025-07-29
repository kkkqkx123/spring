import React from 'react';
import { Box, Text, Group, Avatar, Transition } from '@mantine/core';
import { cn } from '../../../utils';

interface TypingIndicatorProps {
  userName: string;
  isVisible: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  userName,
  isVisible,
}) => {
  return (
    <Transition
      mounted={isVisible}
      transition="fade"
      duration={200}
      timingFunction="ease"
    >
      {(styles) => (
        <Group gap="sm" align="flex-start" mb="xs" style={styles}>
          <Avatar size="sm" radius="xl" color="gray">
            {userName.charAt(0).toUpperCase()}
          </Avatar>

          <Box
            p="xs"
            style={(theme) => ({
              backgroundColor: theme.colors.gray[1],
              borderRadius: theme.radius.md,
              minWidth: 60,
            })}
          >
            <Group gap={2} align="center">
              <Text size="xs" c="dimmed" mr={4}>
                {userName} is typing
              </Text>
              <TypingDots />
            </Group>
          </Box>
        </Group>
      )}
    </Transition>
  );
};

// Animated typing dots component
const TypingDots: React.FC = () => {
  return (
    <Group gap={2} align="center">
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          style={(theme) => ({
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: theme.colors.gray[5],
            animation: `typing-dot 1.4s infinite ease-in-out`,
            animationDelay: `${index * 0.16}s`,
          })}
        />
      ))}
      <style>
        {`
          @keyframes typing-dot {
            0%, 80%, 100% {
              opacity: 0.3;
              transform: scale(0.8);
            }
            40% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </Group>
  );
};

export default TypingIndicator;