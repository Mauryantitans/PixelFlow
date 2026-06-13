import axios from 'axios';
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  SavedPipeline,
  CreatePipelineRequest
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Token management
const TOKEN_KEY = 'pixelflow_access_token';
const REFRESH_TOKEN_KEY = 'pixelflow_refresh_token';

export const authService = {
  // Store tokens in localStorage
  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  // Get access token
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  // Remove tokens
  clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  // Login
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
    return response.data;
  },

  // Register
  async register(data: RegisterRequest): Promise<User> {
    const response = await axios.post<User>(`${API_BASE_URL}/auth/register`, data);
    return response.data;
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }
    
    const response = await axios.get<User>(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<User> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }
    
    const response = await axios.put<User>(`${API_BASE_URL}/auth/me`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Silently exchange a refresh token for a new access + refresh token pair.
  // Returns true on success, false if the refresh token is invalid/expired.
  async refreshTokens(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const formData = new FormData();
      formData.append('refresh_token', refreshToken);

      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}/auth/refresh`,
        formData,
      );

      this.setTokens(response.data.access_token, response.data.refresh_token);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  },

  // Logout and cleanup user data
  async logout(sessionId: string) {
    const token = this.getAccessToken();
    
    if (token && sessionId) {
      try {
        // Call backend logout to cleanup user data
        const formData = new FormData();
        formData.append('session_id', sessionId);
        
        await axios.post(`${API_BASE_URL}/auth/logout`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
      } catch (error) {
        console.error('Logout cleanup error:', error);
        // Continue with client-side logout even if backend fails
      }
    }
    
    this.clearTokens();
  },
};

// Pipeline service
export const pipelineService = {
  // Get user's pipelines
  async getUserPipelines(category?: string): Promise<SavedPipeline[]> {
    const token = authService.getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }
    
    const params = category ? { category } : {};
    const response = await axios.get<SavedPipeline[]>(`${API_BASE_URL}/pipelines/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    });
    return response.data;
  },

  // Get public pipelines
  async getPublicPipelines(category?: string): Promise<SavedPipeline[]> {
    const params = category ? { category } : {};
    const response = await axios.get<SavedPipeline[]>(`${API_BASE_URL}/pipelines/public`, {
      params,
    });
    return response.data;
  },

  // Get specific pipeline
  async getPipeline(id: number): Promise<SavedPipeline> {
    const token = authService.getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }
    
    const response = await axios.get<SavedPipeline>(`${API_BASE_URL}/pipelines/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Create pipeline
  async createPipeline(data: CreatePipelineRequest): Promise<SavedPipeline> {
    const token = authService.getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }
    
    const response = await axios.post<SavedPipeline>(`${API_BASE_URL}/pipelines/`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Update pipeline
  async updatePipeline(id: number, data: Partial<CreatePipelineRequest>): Promise<SavedPipeline> {
    const token = authService.getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }
    
    const response = await axios.put<SavedPipeline>(`${API_BASE_URL}/pipelines/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Delete pipeline
  async deletePipeline(id: number): Promise<void> {
    const token = authService.getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }
    
    await axios.delete(`${API_BASE_URL}/pipelines/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Duplicate pipeline
  async duplicatePipeline(id: number, newName: string): Promise<SavedPipeline> {
    const token = authService.getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }
    
    const response = await axios.post<SavedPipeline>(
      `${API_BASE_URL}/pipelines/${id}/duplicate`,
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          new_name: newName,
        },
      }
    );
    return response.data;
  },
};

// Track whether a refresh is already in-flight to avoid parallel refresh storms.
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function processQueue(newToken: string | null) {
  refreshQueue.forEach((resolve) => resolve(newToken));
  refreshQueue = [];
}

// Axios interceptor: on 401, attempt a silent refresh then retry the original
// request once. If the refresh also fails, clear tokens and redirect to /auth.
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 responses that haven't already been retried,
    // and only when we actually have a refresh token to try.
    if (
      error.response?.status === 401 &&
      !originalRequest._retried &&
      authService.getRefreshToken()
    ) {
      originalRequest._retried = true;

      if (isRefreshing) {
        // Another refresh is in-flight — queue this request until it resolves.
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (token) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              resolve(axios(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;
      const success = await authService.refreshTokens();
      isRefreshing = false;

      if (success) {
        const newToken = authService.getAccessToken();
        processQueue(newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axios(originalRequest);
      } else {
        processQueue(null);
        const isPublicPage = ['/', '/auth', '/login', '/register', '/app'].includes(
          window.location.pathname
        );
        if (!isPublicPage) {
          window.location.href = '/auth';
        }
      }
    }

    return Promise.reject(error);
  }
);
