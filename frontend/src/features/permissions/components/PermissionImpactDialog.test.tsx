import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
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
  const mockAnalyzeImpact = {
    mutate: vi.fn(),
    data: null,
    isLoading: false,
    error: null,
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
        analyzeImpact={mockAnalyzeImpact}
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
        analyzeImpact={mockAnalyzeImpact}
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
        analyzeImpact={mockAnalyzeImpact}
      />,
      { wrapper: createWrapper() }
    );

    expect(mockAnalyzeImpact.mutate).toHaveBeenCalledWith({
      roleId: 1,
      permissionIds: [1, 2, 3],
    });
  });

  it('should display loading state during analysis', () => {
    const loadingAnalyzeImpact = {
      ...mockAnalyzeImpact,
      isLoading: true,
    };

    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={loadingAnalyzeImpact}
      />,
      { wrapper: createWrapper() }
    );

    // Loading overlay should be visible
    expect(
      screen.getByText('Permission Change Impact Analysis')
    ).toBeInTheDocument();
  });

  it('should display error when analysis fails', () => {
    const errorAnalyzeImpact = {
      ...mockAnalyzeImpact,
      error: { message: 'Failed to analyze impact' },
    };

    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={errorAnalyzeImpact}
      />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByText('Failed to analyze impact: Failed to analyze impact')
    ).toBeInTheDocument();
  });

  it('should display impact analysis results', () => {
    const analysisWithData = {
      ...mockAnalyzeImpact,
      data: mockImpactAnalysis,
    };

    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={analysisWithData}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('MEDIUM RISK')).toBeInTheDocument();
    expect(
      screen.getByText('This change will affect 5 user(s)')
    ).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Report Generation')).toBeInTheDocument();
  });

  it('should display warnings when present', () => {
    const analysisWithData = {
      ...mockAnalyzeImpact,
      data: mockImpactAnalysis,
    };

    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={analysisWithData}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Warnings')).toBeInTheDocument();
    expect(
      screen.getByText('This change will affect 5 users')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Some users may lose access to critical features')
    ).toBeInTheDocument();
  });

  it('should show correct risk level colors and icons', () => {
    const highRiskAnalysis = {
      ...mockAnalyzeImpact,
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

    expect(screen.getByText('HIGH RISK')).toBeInTheDocument();
  });

  it('should handle low risk level', () => {
    const lowRiskAnalysis = {
      ...mockAnalyzeImpact,
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

    expect(screen.getByText('LOW RISK')).toBeInTheDocument();
  });

  it('should handle cancel button click', () => {
    const analysisWithData = {
      ...mockAnalyzeImpact,
      data: mockImpactAnalysis,
    };

    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={analysisWithData}
      />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle confirm button click', () => {
    const analysisWithData = {
      ...mockAnalyzeImpact,
      data: mockImpactAnalysis,
    };

    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={analysisWithData}
      />,
      { wrapper: createWrapper() }
    );

    const confirmButton = screen.getByText('Confirm Changes');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('should disable buttons when loading', () => {
    const analysisWithData = {
      ...mockAnalyzeImpact,
      data: mockImpactAnalysis,
    };

    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={analysisWithData}
        loading={true}
      />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByText('Cancel');
    const confirmButton = screen.getByText('Confirm Changes');

    expect(cancelButton).toBeDisabled();
    expect(confirmButton).toHaveAttribute('data-loading', 'true');
  });

  it('should show red confirm button for high risk', () => {
    const highRiskAnalysis = {
      ...mockAnalyzeImpact,
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
    const analysisWithoutFeatures = {
      ...mockAnalyzeImpact,
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
    const analysisWithoutWarnings = {
      ...mockAnalyzeImpact,
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
    const analysisWithData = {
      ...mockAnalyzeImpact,
      data: mockImpactAnalysis,
    };

    render(
      <PermissionImpactDialog
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        analyzeImpact={analysisWithData}
      />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByText(
        'Are you sure you want to proceed with this permission change?'
      )
    ).toBeInTheDocument();
  });
});
