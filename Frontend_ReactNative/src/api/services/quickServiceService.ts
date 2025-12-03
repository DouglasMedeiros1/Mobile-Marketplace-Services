import apiClient from '../client';
import type {
  QuickServiceAvailability,
  QuickServiceRequest,
  QuickServiceResponse,
} from '../../types/api.types';

/**
 * Quick Service API service
 */
export const quickServiceService = {
  /**
   * Update prestador availability for quick services
   * PUT /user/me/quick-availability
   */
  async updateAvailability(
    data: QuickServiceAvailability,
  ): Promise<{success: boolean; disponivel: boolean}> {
    const response = await apiClient.put<{success: boolean; disponivel: boolean}>(
      '/user/me/quick-availability',
      data,
    );
    return response.data;
  },

  /**
   * Request quick service (cliente)
   * POST /quick-service/request
   */
  async requestService(
    data: QuickServiceRequest,
  ): Promise<QuickServiceResponse> {
    const response = await apiClient.post<QuickServiceResponse>(
      '/quick-service/request',
      data,
    );
    return response.data;
  },
};
