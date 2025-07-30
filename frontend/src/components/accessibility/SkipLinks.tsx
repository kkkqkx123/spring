import React from 'react';
import { Box, Anchor } from '@mantine/core';
import { useSkipLinks } from '../../utils/accessibility';

interface SkipLinksProps {
  links: Array<{ href: string; label: string }>;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ links }) => {
  const { skipLinksRef } = useSkipLinks(links);

  return (
    <Box
      ref={skipLinksRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        transform: 'translateY(-100%)',
        transition: 'transform 0.2s ease',
        backgroundColor: 'var(--mantine-color-blue-6)',
        padding: '0.5rem',
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
      }}
    >
      {links.map((link, index) => (
        <Anchor
          key={index}
          href={link.href}
          style={{
            color: 'white',
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid transparent',
          }}
          onFocus={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.borderColor = 'white';
          }}
          onBlur={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          {link.label}
        </Anchor>
      ))}
    </Box>
  );
};