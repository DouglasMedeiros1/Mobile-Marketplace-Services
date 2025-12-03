import apiClient from '../client';
import type {User} from '../../types/api.types';

export interface UpdateUserRequest {
  nome?: string;
  email?: string;
  telefone?: string;
  bio?: string;
}

/**
 * User API service
 */
export const userService = {
  /**
   * Get current user profile
   * GET /user/me
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/user/me');
    return response.data;
  },

  /**
   * Get user by ID
   * GET /user/:id
   */
  async getUserById(id: number): Promise<User> {
    const response = await apiClient.get<User>(`/user/${id}`);
    return response.data;
  },

  /**
   * Update user profile
   * PUT /user/:id
   */
  async updateUser(id: number, data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put<User>(`/user/${id}`, data);
    return response.data;
  },

  /**
   * Delete current user
   * DELETE /user/me
   */
  async deleteMe(): Promise<void> {
    await apiClient.delete('/user/me');
  },

  /**
   * Delete user by ID (admin only)
   * DELETE /user/:id
   */
  async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/user/${id}`);
  },
};
