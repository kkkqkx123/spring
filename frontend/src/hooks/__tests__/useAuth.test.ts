import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useAuth } from '../useAuth';

// Mock the auth store
const mockUseAuthStore = vi.fn();
vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

// Mock the API
const mockAuthApi = {
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  getCurrentUser: vi.fn(),
};
vi.mock('../../services/auth', () => ({
  authApi: mockAuthApi,
}));

describe('useAuth', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    roles: ['USER'],
  };

  const mockSetUser = vi.fn();
  const mockSetToken = vi.fn();
  const mockClearAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: mockSetUser,
      setToken: mockSetToken,
      clearAuth: mockClearAuth,
    });
  });

  it('returns initial auth state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
  });

  it('returns authenticated state when user is logged in', () => {
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      token: 'test-token',
      isAuthenticated: true,
      setUser: mockSetUser,
      setToken: mockSetToken,
      clearAuth: mockClearAuth,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('test-token');
  });

  it('provides login function', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.login).toBe('function');
  });

  it('provides logout function', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.logout).toBe('function');
  });

  it('provides hasRole function', () => {
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      token: 'test-token',
      isAuthenticated: true,
      setUser: mockSetUser,
      setToken: mockSetToken,
      clearAuth: mockClearAuth,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.hasRole('USER')).toBe(true);
    expect(result.current.hasRole('ADMIN')).toBe(false);
  });

  it('provides hasPermission function', () => {
    const userWithPermissions = {
      ...mockUser,
      permissions: ['READ_EMPLOYEES', 'WRITE_EMPLOYEES'],
    };

    mockUseAuthStore.mockReturnValue({
      user: userWithPermissions,
      token: 'test-token',
      isAuthenticated: true,
      setUser: mockSetUser,
      setToken: mockSetToken,
      clearAuth: mockClearAuth,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.hasPermission('READ_EMPLOYEES')).toBe(true);
    expect(result.current.hasPermission('DELETE_EMPLOYEES')).toBe(false);
  });

  it('handles logout correctly', async () => {
    mockAuthApi.logout.mockResolvedValue({});

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockAuthApi.logout).toHaveBeenCalled();
    expect(mockClearAuth).toHaveBeenCalled();
  });

  it('handles login correctly', async () => {
    const loginResponse = {
      token: 'new-token',
      user: mockUser,
    };
    mockAuthApi.login.mockResolvedValue(loginResponse);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('testuser', 'password');
    });

    expect(mockAuthApi.login).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password',
    });
    expect(mockSetToken).toHaveBeenCalledWith('new-token');
    expect(mockSetUser).toHaveBeenCalledWith(mockUser);
  });

  it('handles token refresh', async () => {
    const refreshResponse = {
      token: 'refreshed-token',
      user: mockUser,
    };
    mockAuthApi.refreshToken.mockResolvedValue(refreshResponse);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.refreshToken();
    });

    expect(mockAuthApi.refreshToken).toHaveBeenCalled();
    expect(mockSetToken).toHaveBeenCalledWith('refreshed-token');
    expect(mockSetUser).toHaveBeenCalledWith(mockUser);
  });

  it('returns false for hasRole when user is not authenticated', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.hasRole('USER')).toBe(false);
  });

  it('returns false for hasPermission when user is not authenticated', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.hasPermission('READ_EMPLOYEES')).toBe(false);
  });

  it('handles multiple roles correctly', () => {
    const userWithMultipleRoles = {
      ...mockUser,
      roles: ['USER', 'ADMIN', 'MANAGER'],
    };

    mockUseAuthStore.mockReturnValue({
      user: userWithMultipleRoles,
      token: 'test-token',
      isAuthenticated: true,
      setUser: mockSetUser,
      setToken: mockSetToken,
      clearAuth: mockClearAuth,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.hasRole('USER')).toBe(true);
    expect(result.current.hasRole('ADMIN')).toBe(true);
    expect(result.current.hasRole('MANAGER')).toBe(true);
    expect(result.current.hasRole('SUPER_ADMIN')).toBe(false);
  });
});
