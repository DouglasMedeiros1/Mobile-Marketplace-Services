import apiClient from '../client';
import type {
  Proposal,
  CreateProposalRequest,
  UpdateProposalRequest,
  UpdateProposalStatusRequest,
} from '../../types/api.types';

/**
 * Proposals API service
 */
export const proposalsService = {
  /**
   * Get all proposals for a specific service
   * GET /proposals/service/:serviceId
   */
  async getProposalsByService(serviceId: number): Promise<Proposal[]> {
    const response = await apiClient.get<Proposal[]>(
      `/proposals/service/${serviceId}`,
    );
    return response.data;
  },

  /**
   * Get proposals created by authenticated prestador
   * GET /proposals/my
   */
  async getMyProposals(): Promise<Proposal[]> {
    const response = await apiClient.get<Proposal[]>('/proposals/my');
    return response.data;
  },

  /**
   * Get services where prestador has accepted proposals
   * GET /proposals/my/accepted-services
   */
  async getMyAcceptedServices(): Promise<any[]> {
    const response = await apiClient.get<any[]>('/proposals/my/accepted-services');
    return response.data;
  },

  /**
   * Create new proposal (prestador only)
   * POST /proposals
   */
  async createProposal(data: CreateProposalRequest): Promise<Proposal> {
    const response = await apiClient.post<Proposal>('/proposals', data);
    return response.data;
  },

  /**
   * Update proposal value/message (prestador owner only)
   * PUT /proposals/:id
   */
  async updateProposal(
    id: number,
    data: UpdateProposalRequest,
  ): Promise<Proposal> {
    const response = await apiClient.put<Proposal>(`/proposals/${id}`, data);
    return response.data;
  },

  /**
   * Update proposal status
   * PATCH /proposals/:id/status
   */
  async updateProposalStatus(
    id: number,
    data: UpdateProposalStatusRequest,
  ): Promise<Proposal> {
    const response = await apiClient.patch<Proposal>(
      `/proposals/${id}/status`,
      data,
    );
    return response.data;
  },

  /**
   * Delete proposal (prestador owner only)
   * DELETE /proposals/:id
   */
  async deleteProposal(id: number): Promise<void> {
    await apiClient.delete(`/proposals/${id}`);
  },
};
