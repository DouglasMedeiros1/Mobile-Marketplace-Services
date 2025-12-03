import apiClient from '../client';
import type {
  ClienteDashboardResponse,
  PrestadorDashboardResponse,
} from '../../types/api.types';

export const dashboardService = {
  async getClienteDashboard(userId: number): Promise<ClienteDashboardResponse> {
    const response = await apiClient.get<ClienteDashboardResponse>(
      `/dashboards/cliente/${userId}`
    );
    return response.data;
  },

  async getPrestadorDashboard(
    userId: number
  ): Promise<PrestadorDashboardResponse> {
    const response = await apiClient.get<PrestadorDashboardResponse>(
      `/dashboards/prestador/${userId}`
    );
    return response.data;
  },
};
