import React from 'react';
import { Box, List, ListProps } from '@mantine/core';
import { useKeyboardNavigation, useAriaSelected } from '../../utils/accessibility';

interface AccessibleListProps<T> extends Omit<ListProps, 'children'> {
  items: T[];
  renderItem: (item: T, index: number, isSelected: boolean, isFocused: boolean) => React.ReactNode;
  onSelect?: (item: T, index: number) => void;
  multiSelect?: boolean;
  orientation?: 'horizontal' | 'vertical' | 'grid';
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

export function AccessibleList<T>({
  items,
  renderItem,
  onSelect,
  multiSelect = false,
  orientation = 'vertical',
  ariaLabel,
  ariaLabelledBy,
  ...listProps
}: AccessibleListProps<T>) {
  const { containerRef, focusedIndex } = useKeyboardNavigation(
    items,
    onSelect,
    orientation
  );

  const { isSelected, select } = useAriaSelected(items, multiSelect);

  const handleItemClick = (item: T, index: number) => {
    select(index);
    onSelect?.(item, index);
  };

  const handleItemKeyDown = (
    event: React.KeyboardEvent,
    item: T,
    index: number
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleItemClick(item, index);
    }
  };

  return (
    <Box
      ref={containerRef}
      role={multiSelect ? 'listbox' : 'list'}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-multiselectable={multiSelect}
      tabIndex={0}
      style={{
        outline: 'none',
        '&:focus-visible': {
          outline: '2px solid var(--mantine-color-blue-6)',
          outlineOffset: '2px',
        },
      }}
    >
      <List {...listProps} listStyleType="none">
        {items.map((item, index) => (
          <List.Item
            key={index}
            role={multiSelect ? 'option' : 'listitem'}
            aria-selected={multiSelect ? isSelected(index) : undefined}
            tabIndex={focusedIndex === index ? 0 : -1}
            onClick={() => handleItemClick(item, index)}
            onKeyDown={(e) => handleItemKeyDown(e, item, index)}
            style={{
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.25rem',
              backgroundColor: isSelected(index) 
                ? 'var(--mantine-color-blue-1)' 
                : 'transparent',
              border: focusedIndex === index 
                ? '2px solid var(--mantine-color-blue-6)' 
                : '2px solid transparent',
              outline: 'none',
            }}
          >
            {renderItem(item, index, isSelected(index), focusedIndex === index)}
          </List.Item>
        ))}
      </List>
    </Box>
  );
}