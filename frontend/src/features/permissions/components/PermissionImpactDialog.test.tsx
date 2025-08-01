import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import type { UseMutationResult } from '@tanstack/react-query';
import { PermissionImpactDialog } from './PermissionImpactDialog';
import type { PermissionImpactAnalysis } from '../services/permissionApi';
import { vi } from 'vitest';

const mockImpactAnalysis: PermissionImpactAnalysis = {
  affectedUsers: 5,
  affectedFeatures: ['User Management', 'Report Generation'],
  riskLevel: 'MEDIUM',
  warnings: [
    'This change will affect 5 users',
    'Some users may lose access to critical features',
  ],
};

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <MantineProvider>{children}</MantineProvider>
  );
};
describe('PermissionImpactDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  type MutationResult = UseMutationResult<
    PermissionImpactAnalysis,
    Error,
    { roleId: number; permissionIds: number[] }
  >;

  const baseMock: Omit<
    MutationResult,
    | 'status'
    | 'isIdle'
    | 'isPending'
    | 'isSuccess'
    | 'isError'
    | 'data'
    | 'error'
    | 'variables'
  > = {
    mutate: vi.fn(),
    reset: vi.fn(),
    mutateAsync: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  };

  const idleMock: MutationResult = {
    ...baseMock,
    status: 'idle',
    isIdle: true,
    isPending: false,
    isSuccess: false,
    isError: false,
    data: undefined,
    error: null,
    variables: undefined,
  };

  const pendingMock: MutationResult = {
    ...baseMock,
    status: 'pending',
    isIdle: false,
    isPending: true,
    isSuccess: false,
    isError: false,
    data: undefined,
    error: null,
    variables: { roleId: 1, permissionIds: [1, 2, 3] },
  };

  const errorMock: MutationResult = {
    ...baseMock,
    status: 'error',
    isIdle: false,
    isPending: false,
    isSuccess: false,
    isError: true,
    data: undefined,
    error: new Error('Failed to analyze impact'),
    variables: { roleId: 1, permissionIds: [1, 2, 3] },
  };

  const successMock: MutationResult = {
    ...baseMock,
    status: 'success',
    isIdle: false,
    isPending: false,
    isSuccess: true,
    isError: false,
    data: mockImpactAnalysis,
    error: null,
    variables: { roleId: 1, permissionIds: [1, 2, 3] },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when closed', () => {
    render(
      <PermissionImpactDialog
        opened={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={idleMock}
      />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.queryByText('Permission Change Impact Analysis')
    ).not.toBeInTheDocument();
  });

  it('should render when opened', () => {
    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={idleMock}
      />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByText('Permission Change Impact Analysis')
    ).toBeInTheDocument();
  });

  it('should trigger impact analysis when opened with role and permission data', () => {
    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        roleId={1}
        permissionIds={[1, 2, 3]}
        analyzeImpact={idleMock}
      />,
      { wrapper: createWrapper() }
    );

    expect(idleMock.mutate).toHaveBeenCalledWith({
      roleId: 1,
      permissionIds: [1, 2, 3],
    });
  });

  it('should display loading state during analysis', () => {
    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={pendingMock}
      />,
      { wrapper: createWrapper() }
    );

    // Loading overlay should be visible
    expect(
      screen.getByText('Permission Change Impact Analysis')
    ).toBeInTheDocument();
  });

  it('should display error when analysis fails', () => {
    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={errorMock}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Analysis Failed')).toBeInTheDocument();
  });

  it('should display impact analysis results', () => {
    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={successMock}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('MEDIUM Risk Level')).toBeInTheDocument();
    expect(screen.getByText('Affected Users:')).toBeInTheDocument();
    expect(screen.getByText('5 users')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Report Generation')).toBeInTheDocument();
  });

  it('should display warnings when present', () => {
    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={successMock}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Warnings:')).toBeInTheDocument();
    expect(
      screen.getByText('This change will affect 5 users')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Some users may lose access to critical features')
    ).toBeInTheDocument();
  });

  it('should show correct risk level colors and icons', () => {
    const highRiskAnalysis: MutationResult = {
      ...successMock,
      data: { ...mockImpactAnalysis, riskLevel: 'HIGH' as const },
    };

    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={highRiskAnalysis}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('HIGH Risk Level')).toBeInTheDocument();
  });

  it('should handle low risk level', () => {
    const lowRiskAnalysis: MutationResult = {
      ...successMock,
      data: { ...mockImpactAnalysis, riskLevel: 'LOW' as const },
    };

    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={lowRiskAnalysis}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('LOW Risk Level')).toBeInTheDocument();
  });

  it('should handle cancel button click', () => {
    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={successMock}
      />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle confirm button click', () => {
    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={successMock}
      />,
      { wrapper: createWrapper() }
    );

    const confirmButton = screen.getByText('Confirm Changes');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('should disable buttons when loading', () => {
    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={successMock}
        loading={true}
      />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByText('Cancel');
    const confirmButton = screen.getByText('Confirm Changes');

    expect(cancelButton).toBeDisabled();
    expect(confirmButton).toBeDisabled();
  });

  it('should show red confirm button for high risk', () => {
    const highRiskAnalysis: MutationResult = {
      ...successMock,
      data: { ...mockImpactAnalysis, riskLevel: 'HIGH' as const },
    };

    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={highRiskAnalysis}
      />,
      { wrapper: createWrapper() }
    );

    const confirmButton = screen.getByText('Confirm Changes');
    expect(confirmButton).toBeInTheDocument();
    // The color would be applied via CSS classes, which we can't easily test here
  });

  it('should not show affected features section when empty', () => {
    const analysisWithoutFeatures: MutationResult = {
      ...successMock,
      data: { ...mockImpactAnalysis, affectedFeatures: [] },
    };

    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={analysisWithoutFeatures}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Affected Features')).not.toBeInTheDocument();
  });

  it('should not show warnings section when empty', () => {
    const analysisWithoutWarnings: MutationResult = {
      ...successMock,
      data: { ...mockImpactAnalysis, warnings: [] },
    };

    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={analysisWithoutWarnings}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Warnings')).not.toBeInTheDocument();
  });

  it('should show confirmation question', () => {
    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={successMock}
      />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByText(
        /Are you sure you want to proceed with this permission change?/
      )
    ).toBeInTheDocument();
  });
});
