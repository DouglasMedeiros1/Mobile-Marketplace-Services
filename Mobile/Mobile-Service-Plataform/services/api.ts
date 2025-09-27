import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.31:3000'; // Ajuste conforme necessário

export interface Service {
  id: number;
  nome: string;
  descricao: string;
  valor_minimo: number;
  valor_maximo: number;
  data_inicio: string;
  usuario_id: number;
  categoria_id: number;
  usuario?: {
    id: number;
    nome: string;
    email: string;
    cidade?: string;
    estado?: string;
  };
}

export interface CreateServiceData {
  nome: string;
  descricao: string;
  valor_minimo: number;
  valor_maximo: number;
  data_inicio: string;
  categoria_id: number;
}

export interface UpdateServiceData extends Partial<CreateServiceData> {}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Services endpoints
  async getServices(): Promise<Service[]> {
    try {
      const response = await axios.get(`${this.baseURL}/services`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  async getService(id: number): Promise<Service> {
    try {
      const response = await axios.get(`${this.baseURL}/services/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching service:', error);
      throw error;
    }
  }

  async createService(serviceData: CreateServiceData): Promise<Service> {
    try {
      const response = await axios.post(`${this.baseURL}/services`, serviceData, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  async updateService(id: number, serviceData: UpdateServiceData): Promise<Service> {
    try {
      const response = await axios.put(`${this.baseURL}/services/${id}`, serviceData, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  async deleteService(id: number): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/services/${id}`, {
        headers: this.getHeaders(),
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }

  // User endpoints
  async getUsers(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseURL}/users`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUser(id: number): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/users/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async updateUser(id: number, userData: any): Promise<any> {
    try {
      const response = await axios.put(`${this.baseURL}/users/${id}`, userData, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  async register(userData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.baseURL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/auth/logout`, {}, {
        headers: this.getHeaders(),
      });
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  async getMe(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/auth/me`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();


