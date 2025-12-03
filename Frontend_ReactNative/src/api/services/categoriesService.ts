import apiClient from '../client';
import type {Category} from '../../types/api.types';

/**
 * Categories API service
 */
export const categoriesService = {
  /**
   * Get all categories
   * GET /categories
   */
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
  },

  /**
   * Get category by ID
   * GET /categories/:id
   */
  async getCategoryById(id: number): Promise<Category> {
    const response = await apiClient.get<Category>(`/categories/${id}`);
    return response.data;
  },
};
