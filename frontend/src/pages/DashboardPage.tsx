import React from 'react';
import {
  Container,
  Grid,
  Card,
  Text,
  Stack,
  Group,
  Badge,
  ActionIcon,
  SimpleGrid,
  Progress,
  RingProgress,
  Center,
} from '@mantine/core';
import {
  IconUsers,
  IconBuilding,
  IconMail,
  IconBell,
  IconTrendingUp,
  IconTrendingDown,
  IconArrowRight,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  onClick,
}) => (
  <Card
    padding="lg"
    radius="md"
    withBorder
    style={{ cursor: onClick ? 'pointer' : 'default' }}
    onClick={onClick}
  >
    <Group justify="space-between" mb="xs">
      <Text size="sm" c="dimmed" fw={500}>
        {title}
      </Text>
      <ActionIcon variant="light" color={color} size="sm">
        {icon}
      </ActionIcon>
    </Group>

    <Group align="flex-end" gap="xs">
      <Text size="xl" fw={700}>
        {value}
      </Text>
      {trend && (
        <Group gap={4} align="center">
          {trend.isPositive ? (
            <IconTrendingUp size={16} color="green" />
          ) : (
            <IconTrendingDown size={16} color="red" />
          )}
          <Text size="sm" c={trend.isPositive ? 'green' : 'red'} fw={500}>
            {Math.abs(trend.value)}%
          </Text>
        </Group>
      )}
    </Group>
  </Card>
);

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const canViewEmployees = user?.roles.some(role =>
    ['ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(role.name)
  );

  const canViewDepartments = user?.roles.some(role =>
    ['ADMIN', 'HR_MANAGER'].includes(role.name)
  );

  const canViewPermissions = user?.roles.some(role =>
    ['ADMIN'].includes(role.name)
  );

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Welcome Section */}
        <div>
          <Text size="xl" fw={700} mb="xs">
            Welcome back, {user?.firstName || user?.username}!
          </Text>
          <Text c="dimmed">
            Here's what's happening in your organization today.
          </Text>
        </div>

        {/* Stats Grid */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          {canViewEmployees && (
            <StatCard
              title="Total Employees"
              value="1,234"
              icon={<IconUsers size={18} />}
              color="blue"
              trend={{ value: 5.2, isPositive: true }}
              onClick={() => navigate('/employees')}
            />
          )}

          {canViewDepartments && (
            <StatCard
              title="Departments"
              value="12"
              icon={<IconBuilding size={18} />}
              color="green"
              onClick={() => navigate('/departments')}
            />
          )}

          <StatCard
            title="Unread Messages"
            value="8"
            icon={<IconMail size={18} />}
            color="orange"
            onClick={() => navigate('/chat')}
          />

          <StatCard
            title="Notifications"
            value="3"
            icon={<IconBell size={18} />}
            color="red"
            onClick={() => navigate('/notifications')}
          />
        </SimpleGrid>

        {/* Main Content Grid */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="lg">
              {/* Recent Activity */}
              <Card padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Text fw={600} size="lg">
                    Recent Activity
                  </Text>
                  <ActionIcon variant="subtle" size="sm">
                    <IconArrowRight size={16} />
                  </ActionIcon>
                </Group>

                <Stack gap="sm">
                  <Group justify="space-between">
                    <Group gap="sm">
                      <Badge color="blue" variant="light" size="sm">
                        Employee
                      </Badge>
                      <Text size="sm">
                        John Doe joined the Engineering team
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      2 hours ago
                    </Text>
                  </Group>

                  <Group justify="space-between">
                    <Group gap="sm">
                      <Badge color="green" variant="light" size="sm">
                        Department
                      </Badge>
                      <Text size="sm">Marketing department updated</Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      4 hours ago
                    </Text>
                  </Group>

                  <Group justify="space-between">
                    <Group gap="sm">
                      <Badge color="orange" variant="light" size="sm">
                        Email
                      </Badge>
                      <Text size="sm">
                        Monthly newsletter sent to all employees
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      1 day ago
                    </Text>
                  </Group>
                </Stack>
              </Card>

              {/* Quick Actions */}
              {canViewEmployees && (
                <Card padding="lg" radius="md" withBorder>
                  <Text fw={600} size="lg" mb="md">
                    Quick Actions
                  </Text>

                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <Card
                      padding="md"
                      radius="sm"
                      withBorder
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate('/employees/new')}
                    >
                      <Group gap="sm">
                        <IconUsers size={20} color="blue" />
                        <Text fw={500}>Add New Employee</Text>
                      </Group>
                    </Card>

                    {canViewDepartments && (
                      <Card
                        padding="md"
                        radius="sm"
                        withBorder
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/departments/new')}
                      >
                        <Group gap="sm">
                          <IconBuilding size={20} color="green" />
                          <Text fw={500}>Create Department</Text>
                        </Group>
                      </Card>
                    )}

                    <Card
                      padding="md"
                      radius="sm"
                      withBorder
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate('/email/compose')}
                    >
                      <Group gap="sm">
                        <IconMail size={20} color="orange" />
                        <Text fw={500}>Send Email</Text>
                      </Group>
                    </Card>

                    <Card
                      padding="md"
                      radius="sm"
                      withBorder
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate('/chat')}
                    >
                      <Group gap="sm">
                        <IconBell size={20} color="purple" />
                        <Text fw={500}>Start Chat</Text>
                      </Group>
                    </Card>
                  </SimpleGrid>
                </Card>
              )}
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="lg">
              {/* Department Distribution */}
              {canViewDepartments && (
                <Card padding="lg" radius="md" withBorder>
                  <Text fw={600} size="lg" mb="md">
                    Department Distribution
                  </Text>

                  <Center>
                    <RingProgress
                      size={160}
                      thickness={16}
                      sections={[
                        {
                          value: 40,
                          color: 'blue',
                          tooltip: 'Engineering - 40%',
                        },
                        { value: 25, color: 'green', tooltip: 'Sales - 25%' },
                        {
                          value: 20,
                          color: 'orange',
                          tooltip: 'Marketing - 20%',
                        },
                        { value: 15, color: 'red', tooltip: 'HR - 15%' },
                      ]}
                      label={
                        <Text c="dimmed" fw={700} ta="center" size="xl">
                          100%
                        </Text>
                      }
                    />
                  </Center>

                  <Stack gap="xs" mt="md">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: 'var(--mantine-color-blue-6)',
                          }}
                        />
                        <Text size="sm">Engineering</Text>
                      </Group>
                      <Text size="sm" fw={500}>
                        494
                      </Text>
                    </Group>

                    <Group justify="space-between">
                      <Group gap="xs">
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: 'var(--mantine-color-green-6)',
                          }}
                        />
                        <Text size="sm">Sales</Text>
                      </Group>
                      <Text size="sm" fw={500}>
                        309
                      </Text>
                    </Group>

                    <Group justify="space-between">
                      <Group gap="xs">
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: 'var(--mantine-color-orange-6)',
                          }}
                        />
                        <Text size="sm">Marketing</Text>
                      </Group>
                      <Text size="sm" fw={500}>
                        247
                      </Text>
                    </Group>

                    <Group justify="space-between">
                      <Group gap="xs">
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: 'var(--mantine-color-red-6)',
                          }}
                        />
                        <Text size="sm">HR</Text>
                      </Group>
                      <Text size="sm" fw={500}>
                        184
                      </Text>
                    </Group>
                  </Stack>
                </Card>
              )}

              {/* System Health */}
              <Card padding="lg" radius="md" withBorder>
                <Text fw={600} size="lg" mb="md">
                  System Health
                </Text>

                <Stack gap="md">
                  <div>
                    <Group justify="space-between" mb={4}>
                      <Text size="sm">Database</Text>
                      <Text size="sm" fw={500}>
                        98%
                      </Text>
                    </Group>
                    <Progress value={98} color="green" size="sm" />
                  </div>

                  <div>
                    <Group justify="space-between" mb={4}>
                      <Text size="sm">API Response</Text>
                      <Text size="sm" fw={500}>
                        95%
                      </Text>
                    </Group>
                    <Progress value={95} color="blue" size="sm" />
                  </div>

                  <div>
                    <Group justify="space-between" mb={4}>
                      <Text size="sm">WebSocket</Text>
                      <Text size="sm" fw={500}>
                        100%
                      </Text>
                    </Group>
                    <Progress value={100} color="green" size="sm" />
                  </div>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
};

export default DashboardPage;
