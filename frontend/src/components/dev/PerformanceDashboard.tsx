import React from 'react';
import {
  Card,
  Text,
  Group,
  Stack,
  Badge,
  Progress,
  Button,
  Tabs,
} from '@mantine/core';
import { usePerformanceMonitor } from '../../utils/performanceMonitor';
import {
  performanceTestRunner,
  PERFORMANCE_THRESHOLDS,
} from '../../test/performance.config';

interface PerformanceDashboardProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  isVisible = false,
  onClose,
}) => {
  const { getLatestMetrics, getAverageMetrics, exportMetrics, clearMetrics } =
    usePerformanceMonitor();

  const [testResults, setTestResults] = React.useState<Map<string, number[]>>(
    new Map()
  );
  const [isRunningTests, setIsRunningTests] = React.useState(false);

  const latestMetrics = getLatestMetrics();
  const averageMetrics = getAverageMetrics();

  React.useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setTestResults(new Map(performanceTestRunner.getResults()));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const runPerformanceTests = async () => {
    setIsRunningTests(true);

    try {
      // Simulate running various performance tests
      await new Promise(resolve => setTimeout(resolve, 100));
      performanceTestRunner.measureRenderTime('dashboard-render', () => {
        // Simulate render work
        const start = performance.now();
        while (performance.now() - start < 5) {
          // Busy wait
        }
      });

      performanceTestRunner.measureMemoryUsage('dashboard-memory');

      setTestResults(new Map(performanceTestRunner.getResults()));
    } finally {
      setIsRunningTests(false);
    }
  };

  const getStatusColor = (
    value: number,
    threshold: number,
    inverse = false
  ) => {
    const isGood = inverse ? value > threshold : value < threshold;
    return isGood ? 'green' : value < threshold * 1.5 ? 'yellow' : 'red';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '400px',
        height: '100vh',
        backgroundColor: 'white',
        boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
        overflow: 'auto',
        padding: '16px',
      }}
    >
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={600}>
          Performance Dashboard
        </Text>
        <Button variant="subtle" size="xs" onClick={onClose}>
          ×
        </Button>
      </Group>

      <Tabs defaultValue="metrics">
        <Tabs.List>
          <Tabs.Tab value="metrics">Metrics</Tabs.Tab>
          <Tabs.Tab value="tests">Tests</Tabs.Tab>
          <Tabs.Tab value="analysis">Analysis</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="metrics" pt="md">
          <Stack gap="md">
            {latestMetrics && (
              <Card withBorder>
                <Text size="sm" fw={500} mb="xs">
                  Current Metrics
                </Text>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="xs">Render Time</Text>
                    <Badge
                      color={getStatusColor(
                        latestMetrics.renderTime,
                        PERFORMANCE_THRESHOLDS.renderTime
                      )}
                      size="xs"
                    >
                      {latestMetrics.renderTime.toFixed(2)}ms
                    </Badge>
                  </Group>

                  <Group justify="space-between">
                    <Text size="xs">Memory Usage</Text>
                    <Badge
                      color={getStatusColor(
                        latestMetrics.memoryUsage,
                        PERFORMANCE_THRESHOLDS.memoryUsage
                      )}
                      size="xs"
                    >
                      {latestMetrics.memoryUsage.toFixed(2)}MB
                    </Badge>
                  </Group>

                  <Group justify="space-between">
                    <Text size="xs">Bundle Size</Text>
                    <Badge
                      color={getStatusColor(
                        latestMetrics.bundleSize,
                        PERFORMANCE_THRESHOLDS.bundleSize
                      )}
                      size="xs"
                    >
                      {formatBytes(latestMetrics.bundleSize * 1024)}
                    </Badge>
                  </Group>

                  <Group justify="space-between">
                    <Text size="xs">Cache Hit Rate</Text>
                    <Badge
                      color={getStatusColor(
                        latestMetrics.cacheHitRate,
                        PERFORMANCE_THRESHOLDS.cacheHitRate,
                        true
                      )}
                      size="xs"
                    >
                      {latestMetrics.cacheHitRate.toFixed(1)}%
                    </Badge>
                  </Group>
                </Stack>
              </Card>
            )}

            {averageMetrics && Object.keys(averageMetrics).length > 0 && (
              <Card withBorder>
                <Text size="sm" fw={500} mb="xs">
                  Average Metrics
                </Text>
                <Stack gap="xs">
                  {averageMetrics.renderTime && (
                    <div>
                      <Group justify="space-between" mb={4}>
                        <Text size="xs">Avg Render Time</Text>
                        <Text size="xs">
                          {averageMetrics.renderTime.toFixed(2)}ms
                        </Text>
                      </Group>
                      <Progress
                        value={
                          (averageMetrics.renderTime /
                            PERFORMANCE_THRESHOLDS.renderTime) *
                          100
                        }
                        color={getStatusColor(
                          averageMetrics.renderTime,
                          PERFORMANCE_THRESHOLDS.renderTime
                        )}
                        size="xs"
                      />
                    </div>
                  )}

                  {averageMetrics.memoryUsage && (
                    <div>
                      <Group justify="space-between" mb={4}>
                        <Text size="xs">Avg Memory Usage</Text>
                        <Text size="xs">
                          {averageMetrics.memoryUsage.toFixed(2)}MB
                        </Text>
                      </Group>
                      <Progress
                        value={
                          (averageMetrics.memoryUsage /
                            PERFORMANCE_THRESHOLDS.memoryUsage) *
                          100
                        }
                        color={getStatusColor(
                          averageMetrics.memoryUsage,
                          PERFORMANCE_THRESHOLDS.memoryUsage
                        )}
                        size="xs"
                      />
                    </div>
                  )}
                </Stack>
              </Card>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="tests" pt="md">
          <Stack gap="md">
            <Group>
              <Button
                size="xs"
                onClick={runPerformanceTests}
                loading={isRunningTests}
              >
                Run Tests
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => performanceTestRunner.clearResults()}
              >
                Clear Results
              </Button>
            </Group>

            {testResults.size > 0 && (
              <Card withBorder>
                <Text size="sm" fw={500} mb="xs">
                  Test Results
                </Text>
                <Stack gap="xs">
                  {Array.from(testResults.entries()).map(
                    ([testName, results]) => {
                      const avg =
                        results.reduce((sum, val) => sum + val, 0) /
                        results.length;
                      const max = Math.max(...results);

                      return (
                        <div key={testName}>
                          <Group justify="space-between" mb={4}>
                            <Text size="xs">{testName}</Text>
                            <Text size="xs">
                              Avg: {avg.toFixed(2)}ms | Max: {max.toFixed(2)}ms
                            </Text>
                          </Group>
                          <Progress
                            value={Math.min((avg / 50) * 100, 100)} // Assume 50ms as max for visualization
                            color={
                              avg < 16 ? 'green' : avg < 33 ? 'yellow' : 'red'
                            }
                            size="xs"
                          />
                        </div>
                      );
                    }
                  )}
                </Stack>
              </Card>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="analysis" pt="md">
          <Stack gap="md">
            <Card withBorder>
              <Text size="sm" fw={500} mb="xs">
                Performance Analysis
              </Text>
              <Stack gap="xs">
                <Text size="xs">
                  • Monitor render times to stay under 16ms (60fps)
                </Text>
                <Text size="xs">
                  • Keep memory usage below 50MB for optimal performance
                </Text>
                <Text size="xs">• Maintain cache hit rate above 80%</Text>
                <Text size="xs">
                  • Bundle size should stay under 1MB for fast loading
                </Text>
              </Stack>
            </Card>

            <Group>
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  const data = exportMetrics();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'performance-metrics.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export Metrics
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  const report = performanceTestRunner.generateReport();
                  console.log(report);
                  alert('Report logged to console');
                }}
              >
                Generate Report
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

// Hook to toggle performance dashboard
export const usePerformanceDashboard = () => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Toggle dashboard with Ctrl+Shift+P
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return {
    isVisible,
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
    toggle: () => setIsVisible(prev => !prev),
  };
};
