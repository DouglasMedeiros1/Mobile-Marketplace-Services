import apiClient from '../client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  User,
} from '../../types/api.types';

/**
 * Authentication API service
 */
export const authService = {
  /**
   * Login user and receive JWT token
   * POST /auth/login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      credentials,
    );
    return response.data;
  },

  /**
   * Register new user (cliente or prestador)
   * POST /auth/register
   */
  async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/auth/register',
      userData,
    );
    return response.data;
  },

  /**
   * Logout user and blacklist token
   * POST /auth/logout
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  /**
   * Get current authenticated user
   * GET /auth/me
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Request password recovery code
   * POST /auth/password/forgot
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await apiClient.post('/auth/password/forgot', data);
  },

  /**
   * Reset password with recovery code
   * POST /auth/password/reset
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiClient.post('/auth/password/reset', data);
  },
};
