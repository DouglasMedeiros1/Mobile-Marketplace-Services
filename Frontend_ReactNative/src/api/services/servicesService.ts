import apiClient from '../client';
import type {
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
} from '../../types/api.types';

/**
 * Services API service
 */
export const servicesService = {
  /**
   * Get all services
   * GET /services
   */
  async getServices(): Promise<Service[]> {
    const response = await apiClient.get<Service[]>('/services');
    return response.data;
  },

  /**
   * Get service by ID
   * GET /services/:id
   */
  async getServiceById(id: number): Promise<Service> {
    const response = await apiClient.get<Service>(`/services/${id}`);
    return response.data;
  },

  /**
   * Create new service
   * POST /services
   */
  async createService(data: CreateServiceRequest): Promise<Service> {
    const response = await apiClient.post<Service>('/services', data);
    return response.data;
  },

  /**
   * Update existing service
   * PUT /services/:id
   */
  async updateService(
    id: number,
    data: UpdateServiceRequest,
  ): Promise<Service> {
    const response = await apiClient.put<Service>(`/services/${id}`, data);
    return response.data;
  },

  /**
   * Delete service
   * DELETE /services/:id
   */
  async deleteService(id: number): Promise<void> {
    await apiClient.delete(`/services/${id}`);
  },
};
