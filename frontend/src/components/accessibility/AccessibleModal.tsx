import React, { useEffect } from 'react';
import { Modal, Box } from '@mantine/core';
import type { ModalProps } from '@mantine/core';
import { useFocusTrap, useScreenReader } from '../../utils/accessibility';

interface AccessibleModalProps extends Omit<ModalProps, 'opened' | 'onClose'> {
  opened: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  closeOnEscape?: boolean;
  announceOnOpen?: boolean;
  announceOnClose?: boolean;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  opened,
  onClose,
  title,
  children,
  closeOnEscape = true,
  announceOnOpen = true,
  announceOnClose = true,
  ...modalProps
}) => {
  const focusTrapRef = useFocusTrap<HTMLDivElement>(opened);
  const { announce } = useScreenReader();

  useEffect(() => {
    if (opened && announceOnOpen) {
      announce(`Dialog opened: ${title}`, 'assertive');
    }
  }, [opened, title, announceOnOpen, announce]);

  useEffect(() => {
    if (!opened && announceOnClose) {
      announce('Dialog closed', 'polite');
    }
  }, [opened, announceOnClose, announce]);

  useEffect(() => {
    if (!opened || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [opened, closeOnEscape, onClose]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      {...modalProps}
      styles={{
        content: {
          ...modalProps.styles?.content,
        },
        header: {
          ...modalProps.styles?.header,
        },
        body: {
          ...modalProps.styles?.body,
        },
      }}
    >
      <Box ref={focusTrapRef} tabIndex={-1}>
        {children}
      </Box>
    </Modal>
  );
};
