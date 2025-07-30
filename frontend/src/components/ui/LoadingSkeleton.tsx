import React from 'react';
import { Skeleton, Stack, Group, Card, Container } from '@mantine/core';

interface LoadingSkeletonProps {
  variant?: 'page' | 'list' | 'form' | 'card' | 'table';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'page',
  count = 1,
}) => {
  const renderPageSkeleton = () => (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Header skeleton */}
        <Group justify="space-between">
          <Skeleton height={32} width={200} />
          <Group gap="sm">
            <Skeleton height={36} width={100} />
            <Skeleton height={36} width={120} />
          </Group>
        </Group>

        {/* Content skeleton */}
        <Card padding="lg">
          <Stack gap="md">
            <Skeleton height={24} width="60%" />
            <Skeleton height={16} width="100%" />
            <Skeleton height={16} width="80%" />
            <Skeleton height={16} width="90%" />
            
            <Group gap="md" mt="md">
              <Skeleton height={20} width={80} />
              <Skeleton height={20} width={100} />
              <Skeleton height={20} width={60} />
            </Group>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );

  const renderListSkeleton = () => (
    <Stack gap="sm">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} padding="md">
          <Group justify="space-between">
            <Group gap="md">
              <Skeleton height={40} width={40} radius="50%" />
              <Stack gap={4}>
                <Skeleton height={16} width={150} />
                <Skeleton height={12} width={100} />
              </Stack>
            </Group>
            <Group gap="sm">
              <Skeleton height={32} width={80} />
              <Skeleton height={32} width={32} />
            </Group>
          </Group>
        </Card>
      ))}
    </Stack>
  );

  const renderFormSkeleton = () => (
    <Card padding="lg">
      <Stack gap="md">
        <Skeleton height={24} width={200} />
        
        {Array.from({ length: count || 5 }).map((_, index) => (
          <Stack key={index} gap={4}>
            <Skeleton height={16} width={100} />
            <Skeleton height={36} width="100%" />
          </Stack>
        ))}
        
        <Group justify="flex-end" gap="sm" mt="lg">
          <Skeleton height={36} width={80} />
          <Skeleton height={36} width={100} />
        </Group>
      </Stack>
    </Card>
  );

  const renderCardSkeleton = () => (
    <Card padding="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Skeleton height={20} width={120} />
          <Skeleton height={16} width={60} />
        </Group>
        <Skeleton height={14} width="100%" />
        <Skeleton height={14} width="80%" />
        <Group gap="sm" mt="sm">
          <Skeleton height={24} width={60} />
          <Skeleton height={24} width={80} />
        </Group>
      </Stack>
    </Card>
  );

  const renderTableSkeleton = () => (
    <Card padding="lg">
      {/* Table header */}
      <Group justify="space-between" mb="md">
        <Group gap="md">
          <Skeleton height={16} width={100} />
          <Skeleton height={16} width={80} />
          <Skeleton height={16} width={120} />
          <Skeleton height={16} width={90} />
        </Group>
        <Skeleton height={32} width={32} />
      </Group>
      
      {/* Table rows */}
      <Stack gap="sm">
        {Array.from({ length: count || 10 }).map((_, index) => (
          <Group key={index} justify="space-between" py="xs">
            <Group gap="md">
              <Skeleton height={12} width={80} />
              <Skeleton height={12} width={100} />
              <Skeleton height={12} width={120} />
              <Skeleton height={12} width={90} />
            </Group>
            <Group gap="sm">
              <Skeleton height={24} width={24} />
              <Skeleton height={24} width={24} />
            </Group>
          </Group>
        ))}
      </Stack>
      
      {/* Pagination */}
      <Group justify="center" mt="lg">
        <Group gap="xs">
          <Skeleton height={32} width={32} />
          <Skeleton height={32} width={32} />
          <Skeleton height={32} width={32} />
          <Skeleton height={32} width={32} />
          <Skeleton height={32} width={32} />
        </Group>
      </Group>
    </Card>
  );

  switch (variant) {
    case 'list':
      return renderListSkeleton();
    case 'form':
      return renderFormSkeleton();
    case 'card':
      return renderCardSkeleton();
    case 'table':
      return renderTableSkeleton();
    case 'page':
    default:
      return renderPageSkeleton();
  }
};