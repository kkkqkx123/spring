import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Box, ScrollArea } from '@mantine/core';

interface VirtualScrollListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  className?: string;
}

export function VirtualScrollList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  onScroll,
  className,
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Offset for visible items
  const offsetY = visibleRange.startIndex * itemHeight;

  return (
    <ScrollArea
      h={containerHeight}
      onScrollPositionChange={({ y }) => setScrollTop(y)}
      className={className}
    >
      <Box h={totalHeight} pos="relative">
        <Box
          pos="absolute"
          top={offsetY}
          left={0}
          right={0}
        >
          {visibleItems.map((item, index) => (
            <Box key={visibleRange.startIndex + index} h={itemHeight}>
              {renderItem(item, visibleRange.startIndex + index)}
            </Box>
          ))}
        </Box>
      </Box>
    </ScrollArea>
  );
}

// Hook for virtual scrolling with dynamic item heights
export function useVirtualScroll<T>({
  items,
  estimatedItemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  estimatedItemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const itemHeights = useRef<Map<number, number>>(new Map());
  const itemOffsets = useRef<Map<number, number>>(new Map());

  // Calculate item offsets
  const calculateOffsets = useCallback(() => {
    let offset = 0;
    itemOffsets.current.clear();

    for (let i = 0; i < items.length; i++) {
      itemOffsets.current.set(i, offset);
      const height = itemHeights.current.get(i) || estimatedItemHeight;
      offset += height;
    }
  }, [items.length, estimatedItemHeight]);

  // Update item height
  const setItemHeight = useCallback((index: number, height: number) => {
    if (itemHeights.current.get(index) !== height) {
      itemHeights.current.set(index, height);
      calculateOffsets();
    }
  }, [calculateOffsets]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    let startIndex = 0;
    let endIndex = items.length - 1;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const offset = itemOffsets.current.get(i) || i * estimatedItemHeight;
      if (offset >= scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
    }

    // Find end index
    for (let i = startIndex; i < items.length; i++) {
      const offset = itemOffsets.current.get(i) || i * estimatedItemHeight;
      const height = itemHeights.current.get(i) || estimatedItemHeight;
      if (offset + height >= scrollTop + containerHeight) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
    }

    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, items.length, estimatedItemHeight, overscan]);

  // Total height
  const totalHeight = useMemo(() => {
    const lastIndex = items.length - 1;
    const lastOffset = itemOffsets.current.get(lastIndex) || lastIndex * estimatedItemHeight;
    const lastHeight = itemHeights.current.get(lastIndex) || estimatedItemHeight;
    return lastOffset + lastHeight;
  }, [items.length, estimatedItemHeight]);

  useEffect(() => {
    calculateOffsets();
  }, [calculateOffsets]);

  return {
    visibleRange,
    totalHeight,
    setScrollTop,
    setItemHeight,
    getItemOffset: (index: number) => itemOffsets.current.get(index) || index * estimatedItemHeight,
  };
}

// Virtual list component with dynamic heights
export function DynamicVirtualList<T>({
  items,
  estimatedItemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  onScroll,
  className,
}: {
  items: T[];
  estimatedItemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number, setHeight: (height: number) => void) => React.ReactNode;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  className?: string;
}) {
  const {
    visibleRange,
    totalHeight,
    setScrollTop,
    setItemHeight,
    getItemOffset,
  } = useVirtualScroll({
    items,
    estimatedItemHeight,
    containerHeight,
    overscan,
  });

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [setScrollTop, onScroll]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  return (
    <ScrollArea
      h={containerHeight}
      onScrollPositionChange={({ y }) => setScrollTop(y)}
      className={className}
    >
      <Box h={totalHeight} pos="relative">
        {visibleItems.map((item, index) => {
          const actualIndex = visibleRange.startIndex + index;
          const offset = getItemOffset(actualIndex);

          return (
            <Box
              key={actualIndex}
              pos="absolute"
              top={offset}
              left={0}
              right={0}
            >
              {renderItem(item, actualIndex, (height) => setItemHeight(actualIndex, height))}
            </Box>
          );
        })}
      </Box>
    </ScrollArea>
  );
}

// Virtual table component for large datasets
export function VirtualTable<T>({
  data,
  columns,
  rowHeight = 50,
  headerHeight = 40,
  containerHeight,
  overscan = 10,
}: {
  data: T[];
  columns: Array<{
    key: keyof T;
    title: string;
    width?: number;
    render?: (value: any, record: T) => React.ReactNode;
  }>;
  rowHeight?: number;
  headerHeight?: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const contentHeight = containerHeight - headerHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIndex = Math.min(
      data.length - 1,
      Math.ceil((scrollTop + contentHeight) / rowHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, rowHeight, containerHeight, headerHeight, data.length, overscan]);

  const visibleData = useMemo(() => {
    return data.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [data, visibleRange]);

  const totalHeight = data.length * rowHeight;
  const offsetY = visibleRange.startIndex * rowHeight;

  return (
    <Box h={containerHeight} style={{ border: '1px solid var(--mantine-color-gray-3)' }}>
      {/* Header */}
      <Box
        h={headerHeight}
        style={{
          borderBottom: '1px solid var(--mantine-color-gray-3)',
          backgroundColor: 'var(--mantine-color-gray-0)',
          display: 'flex',
          alignItems: 'center',
          fontWeight: 600,
        }}
      >
        {columns.map((column, index) => (
          <Box
            key={String(column.key)}
            px="md"
            style={{
              flex: column.width ? `0 0 ${column.width}px` : 1,
              borderRight: index < columns.length - 1 ? '1px solid var(--mantine-color-gray-3)' : 'none',
            }}
          >
            {column.title}
          </Box>
        ))}
      </Box>

      {/* Virtual scrollable content */}
      <ScrollArea
        h={containerHeight - headerHeight}
        onScrollPositionChange={({ y }) => setScrollTop(y)}
      >
        <Box h={totalHeight} pos="relative">
          <Box
            pos="absolute"
            top={offsetY}
            left={0}
            right={0}
          >
            {visibleData.map((row, index) => (
              <Box
                key={visibleRange.startIndex + index}
                h={rowHeight}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--mantine-color-gray-2)',
                }}
              >
                {columns.map((column, colIndex) => (
                  <Box
                    key={String(column.key)}
                    px="md"
                    style={{
                      flex: column.width ? `0 0 ${column.width}px` : 1,
                      borderRight: colIndex < columns.length - 1 ? '1px solid var(--mantine-color-gray-2)' : 'none',
                    }}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] || '')}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </ScrollArea>
    </Box>
  );
}