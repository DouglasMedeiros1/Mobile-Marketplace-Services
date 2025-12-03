import {storage} from '../storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

describe('Storage Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Management', () => {
    it('should save token successfully', async () => {
      const token = 'test-jwt-token';
      await storage.saveToken(token);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@mobile_marketplace:token',
        token,
      );
    });

    it('should retrieve token successfully', async () => {
      const token = 'test-jwt-token';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(token);
      
      const result = await storage.getToken();
      
      expect(result).toBe(token);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@mobile_marketplace:token');
    });

    it('should remove token successfully', async () => {
      await storage.removeToken();
      
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@mobile_marketplace:token');
    });
  });

  describe('User Management', () => {
    const mockUser = {
      id: 1,
      nome: 'Test User',
      email: 'test@example.com',
      cpf: '12345678900',
      roles: ['cliente'],
      disponivel_servico_rapido: false,
      created_at: '2025-11-30T00:00:00.000Z',
    };

    it('should save user successfully', async () => {
      await storage.saveUser(mockUser);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@mobile_marketplace:user',
        JSON.stringify(mockUser),
      );
    });

    it('should retrieve user successfully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockUser),
      );
      
      const result = await storage.getUser();
      
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      
      const result = await storage.getUser();
      
      expect(result).toBeNull();
    });
  });

  describe('Clear All', () => {
    it('should clear all storage', async () => {
      await storage.clearAll();
      
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@mobile_marketplace:token',
        '@mobile_marketplace:user',
      ]);
    });
  });
});
