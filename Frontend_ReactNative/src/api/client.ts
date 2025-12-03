import axios, {AxiosInstance, AxiosError, InternalAxiosRequestConfig} from 'axios';
import {API_BASE_URL} from '@env';
import {storage} from '../utils/storage';
import type {ApiError} from '../types/api.types';

// Fallback to default if env variable is not loaded
const baseURL = API_BASE_URL || 'http://10.0.2.2:3000';

/**
 * Axios instance configured for the Mobile Marketplace API
 */
const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to inject JWT token
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

/**
 * Response interceptor to handle common errors
 */
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError<ApiError>) => {
    if (error.response) {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.response.status === 401) {
        // Clear stored credentials
        await storage.clearAll();
        
        // You could emit an event here to trigger navigation to login
        // For now, just reject the promise
        return Promise.reject({
          message: 'Session expired. Please login again.',
          status: 401,
        });
      }

      // Handle other error responses
      const apiError: ApiError = error.response.data || {
        error: 'Unknown error occurred',
      };

      return Promise.reject({
        message: apiError.error || apiError.message || 'Request failed',
        status: error.response.status,
        details: apiError.details,
      });
    }

    // Handle network errors
    if (error.request) {
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 0,
      });
    }

    // Handle other errors
    return Promise.reject({
      message: error.message || 'An unexpected error occurred',
      status: 0,
    });
  },
);

export default apiClient;
