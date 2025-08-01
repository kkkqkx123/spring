import React from 'react';

interface OperationProgressProps {
  title: string;
  description?: string;
  progress: number;
  status: 'running' | 'paused' | 'completed' | 'error' | 'cancelled';
  estimatedTime?: string;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  details?: Array<{
    label: string;
    value: string | number;
  }>;
}

// Hook for managing operation progress
export const useOperationProgress = () => {
  const [operations, setOperations] = React.useState<
    Map<string, OperationProgressProps>
  >(new Map());

  const startOperation = React.useCallback(
    (
      id: string,
      operation: Omit<OperationProgressProps, 'progress' | 'status'>
    ) => {
      setOperations(prev =>
        new Map(prev).set(id, {
          ...operation,
          progress: 0,
          status: 'running',
        })
      );
    },
    []
  );

  const updateProgress = React.useCallback(
    (
      id: string,
      progress: number,
      updates?: Partial<OperationProgressProps>
    ) => {
      setOperations(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(id);
        if (existing) {
          newMap.set(id, {
            ...existing,
            progress,
            ...updates,
          });
        }
        return newMap;
      });
    },
    []
  );

  const completeOperation = React.useCallback(
    (id: string) => {
      updateProgress(id, 100, { status: 'completed' });
    },
    [updateProgress]
  );

  const failOperation = React.useCallback(
    (id: string, error?: string) => {
      updateProgress(id, 0, {
        status: 'error',
        description: error,
      });
    },
    [updateProgress]
  );

  const removeOperation = React.useCallback((id: string) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  return {
    operations: Array.from(operations.entries()),
    startOperation,
    updateProgress,
    completeOperation,
    failOperation,
    removeOperation,
  };
};
