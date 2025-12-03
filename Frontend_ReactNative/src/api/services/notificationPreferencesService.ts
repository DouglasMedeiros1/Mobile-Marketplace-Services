import apiClient from '../client';

export interface NotificationPreferences {
  id?: number;
  user_id: number;
  report_enabled: boolean;
  report_frequency: 'daily' | 'weekly' | 'monthly';
  report_day_of_week: number; // 0-6 (0=Sunday)
  report_day_of_month: number; // 1-31
  report_time: string; // "HH:MM:SS"
  notification_method: 'in-app' | 'email' | 'both';
  last_sent_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateNotificationPreferencesRequest {
  report_enabled?: boolean;
  report_frequency?: 'daily' | 'weekly' | 'monthly';
  report_day_of_week?: number;
  report_day_of_month?: number;
  report_time?: string;
  notification_method?: 'in-app' | 'email' | 'both';
}

/**
 * Notification Preferences API service
 */
export const notificationPreferencesService = {
  /**
   * Get current user's notification preferences
   * GET /notification-preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await apiClient.get<NotificationPreferences>('/notification-preferences');
    return response.data;
  },

  /**
   * Update notification preferences
   * PUT /notification-preferences
   */
  async updatePreferences(data: UpdateNotificationPreferencesRequest): Promise<NotificationPreferences> {
    const response = await apiClient.put<NotificationPreferences>('/notification-preferences', data);
    return response.data;
  },

  /**
   * Delete notification preferences
   * DELETE /notification-preferences
   */
  async deletePreferences(): Promise<void> {
    await apiClient.delete('/notification-preferences');
  },
};
