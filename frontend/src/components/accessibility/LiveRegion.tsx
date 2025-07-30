import React from 'react';
import { Box } from '@mantine/core';
import { useLiveRegion } from '../../utils/accessibility';

interface LiveRegionProps {
  message?: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message = '',
  priority = 'polite',
  className = 'sr-only',
}) => {
  const { liveRegionRef } = useLiveRegion(message);

  return (
    <Box
      ref={liveRegionRef}
      aria-live={priority}
      aria-atomic="true"
      className={className}
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {message}
    </Box>
  );
};
