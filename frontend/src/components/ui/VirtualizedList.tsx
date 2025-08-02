import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Box, ScrollArea } from '@mantine/core';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

export interface VirtualizedListHandle {
  scrollToIndex: (index: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

export const VirtualizedList = React.forwardRef<
  VirtualizedListHandle,
  VirtualizedListProps<any>
>(function VirtualizedList<T>(
  {
    items,
    itemHeight,
    containerHeight,
    renderItem,
    overscan = 5,
    className,
    onScroll,
    getItemKey = (_, index) => index,
  }: VirtualizedListProps<T>,
  ref: React.ForwardedRef<VirtualizedListHandle>
) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    );
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Calculate total height
  const totalHeight = items.length * itemHeight;

  // Get visible items
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      key: getItemKey(item, startIndex + index),
    }));
  }, [items, visibleRange, getItemKey]);

  // Handle scroll

  // Scroll to index
  const scrollToIndex = useCallback(
    (index: number) => {
      if (scrollElementRef.current) {
        const scrollTop = index * itemHeight;
        scrollElementRef.current.scrollTop = scrollTop;
        setScrollTop(scrollTop);
      }
    },
    [itemHeight]
  );

  // Expose scroll methods
  React.useImperativeHandle(
    ref,
    () => ({
      scrollToIndex,
      scrollToTop: () => scrollToIndex(0),
      scrollToBottom: () => scrollToIndex(items.length - 1),
    }),
    [scrollToIndex, items.length]
  );

  return (
    <ScrollArea
      h={containerHeight}
      className={className}
      onScrollPositionChange={({ y }) => {
        setScrollTop(y);
        onScroll?.(y);
      }}
      viewportRef={scrollElementRef}
    >
      <Box style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, key }) => (
          <Box
            key={key}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </Box>
        ))}
      </Box>
    </ScrollArea>
  );
});
