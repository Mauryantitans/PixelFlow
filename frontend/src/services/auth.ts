import axios from 'axios';
import {
  User,
  RegisterRequest,
  SavedPipeline,
  CreatePipelineRequest
} from '../types';
import { getCookie } from './api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Auth is cookie-based (httpOnly): tokens live in cookies set by the backend and
// are never readable by JS. Send credentials on every request and echo the CSRF
// cookie back as a header on state-changing requests (double-submit-cookie).
axios.defaults.withCredentials = true;

const UNSAFE_METHODS = ['post', 'put', 'delete', 'patch'];
axios.interceptors.request.use((config) => {
  if (config.method && UNSAFE_METHODS.includes(config.method.toLowerCase())) {
    const csrf = getCookie('pf_csrf');
    if (csrf) {
      config.headers = config.headers ?? {};
      (config.headers as any)['X-CSRF-Token'] = csrf;
    }
  }
  return config;
});

export const authService = {
  // Login — backend sets httpOnly cookies and returns the user record.
  async login(email: string, password: string): Promise<User> {
    const response = await axios.post<User>(`${API_BASE_URL}/auth/login`, {
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

  // Get current user (auth cookie sent automatically). Throws if not authenticated.
  async getCurrentUser(): Promise<User> {
    const response = await axios.get<User>(`${API_BASE_URL}/auth/me`);
    return response.data;
  },

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await axios.put<User>(`${API_BASE_URL}/auth/me`, data);
    return response.data;
  },

  // Silently rotate tokens using the httpOnly refresh cookie.
  // Returns true on success, false if the refresh token is invalid/expired.
  async refreshTokens(): Promise<boolean> {
    try {
      await axios.post(`${API_BASE_URL}/auth/refresh`, {});
      return true;
    } catch {
      return false;
    }
  },

  // Logout: backend clears the cookies and cleans up session data.
  async logout(sessionId: string) {
    try {
      const formData = new FormData();
      if (sessionId) formData.append('session_id', sessionId);
      await axios.post(`${API_BASE_URL}/auth/logout`, formData);
    } catch (error) {
      console.error('Logout cleanup error:', error);
      // Continue with client-side logout even if backend fails
    }
  },
};

// Pipeline service — auth travels in the httpOnly cookie (withCredentials default).
export const pipelineService = {
  // Get user's pipelines
  async getUserPipelines(category?: string): Promise<SavedPipeline[]> {
    const params = category ? { category } : {};
    const response = await axios.get<SavedPipeline[]>(`${API_BASE_URL}/pipelines/`, { params });
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
    const response = await axios.get<SavedPipeline>(`${API_BASE_URL}/pipelines/${id}`);
    return response.data;
  },

  // Create pipeline
  async createPipeline(data: CreatePipelineRequest): Promise<SavedPipeline> {
    const response = await axios.post<SavedPipeline>(`${API_BASE_URL}/pipelines/`, data);
    return response.data;
  },

  // Update pipeline
  async updatePipeline(id: number, data: Partial<CreatePipelineRequest>): Promise<SavedPipeline> {
    const response = await axios.put<SavedPipeline>(`${API_BASE_URL}/pipelines/${id}`, data);
    return response.data;
  },

  // Delete pipeline
  async deletePipeline(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/pipelines/${id}`);
  },

  // Duplicate pipeline
  async duplicatePipeline(id: number, newName: string): Promise<SavedPipeline> {
    const response = await axios.post<SavedPipeline>(
      `${API_BASE_URL}/pipelines/${id}/duplicate`,
      null,
      { params: { new_name: newName } }
    );
    return response.data;
  },
};

// Track whether a refresh is already in-flight to avoid parallel refresh storms.
let isRefreshing = false;
let refreshQueue: Array<(ok: boolean) => void> = [];

function processQueue(ok: boolean) {
  refreshQueue.forEach((resolve) => resolve(ok));
  refreshQueue = [];
}

// Axios interceptor: on 401, attempt a silent cookie refresh then retry the
// original request once. The fresh access token arrives as a cookie, so the
// retry needs no header changes. If the refresh fails, redirect to /auth.
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRefresh = originalRequest?.url?.includes('/auth/refresh');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retried &&
      !isAuthRefresh
    ) {
      originalRequest._retried = true;

      if (isRefreshing) {
        // Another refresh is in-flight — queue this request until it resolves.
        return new Promise((resolve, reject) => {
          refreshQueue.push((ok) => (ok ? resolve(axios(originalRequest)) : reject(error)));
        });
      }

      isRefreshing = true;
      const success = await authService.refreshTokens();
      isRefreshing = false;
      processQueue(success);

      if (success) {
        return axios(originalRequest);
      }
      const isPublicPage = ['/', '/auth', '/login', '/register', '/app'].includes(
        window.location.pathname
      );
      if (!isPublicPage) {
        window.location.href = '/auth';
      }
    }

    return Promise.reject(error);
  }
);
