import AsyncStorage from '@react-native-async-storage/async-storage';
import type {User} from '../types/api.types';

const STORAGE_KEYS = {
  TOKEN: '@mobile_marketplace:token',
  USER: '@mobile_marketplace:user',
};

/**
 * Storage utility for persisting authentication data
 */
export const storage = {
  /**
   * Save JWT token to AsyncStorage
   */
  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } catch (error) {
      console.error('Error saving token:', error);
      throw new Error('Failed to save token');
    }
  },

  /**
   * Retrieve JWT token from AsyncStorage
   */
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  /**
   * Remove JWT token from AsyncStorage
   */
  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('Error removing token:', error);
      throw new Error('Failed to remove token');
    }
  },

  /**
   * Save user data to AsyncStorage
   */
  async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
      throw new Error('Failed to save user');
    }
  },

  /**
   * Retrieve user data from AsyncStorage
   */
  async getUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  /**
   * Remove user data from AsyncStorage
   */
  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Error removing user:', error);
      throw new Error('Failed to remove user');
    }
  },

  /**
   * Clear all authentication data
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw new Error('Failed to clear storage');
    }
  },
};
