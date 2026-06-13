import axios, { AxiosResponse } from 'axios';
import {
  ImageData,
  ProcessRequest,
  LiveProcessRequest,
  ProcessResponse,
  LiveProcessResponse,
  UploadResponse,
  MultipleUploadResponse,
  OperationSchema
} from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export class ApiService {
  /**
   * Upload a single image
   */
  static async uploadImage(file: File, sessionId: string): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('session_id', sessionId);

      // Add auth token if available
      const token = localStorage.getItem('pixelflow_access_token');
      const headers: any = {
        'Content-Type': 'multipart/form-data',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response: AxiosResponse<UploadResponse> = await api.post('/images/upload', formData, {
        headers
      });

      return response.data;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(files: File[], sessionId: string): Promise<MultipleUploadResponse> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('session_id', sessionId);

      // Include auth token so authenticated users get their quota, not guest quota
      const token = localStorage.getItem('pixelflow_access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response: AxiosResponse<MultipleUploadResponse> = await api.post('/images/upload-multiple', formData, {
        headers,
      });

      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Process images through pipeline (batch mode)
   */
  static async processImages(request: ProcessRequest): Promise<ProcessResponse> {
    try {
      const response: AxiosResponse<ProcessResponse> = await api.post('/processing/process', request);
      return response.data;
    } catch (error: any) {
      console.error('Process error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Process single image with live updates
   */
  static async processLive(
    request: LiveProcessRequest,
    signal?: AbortSignal
  ): Promise<LiveProcessResponse> {
    try {
      const response: AxiosResponse<LiveProcessResponse> = await api.post(
        '/processing/process-live',
        request,
        { signal }
      );
      return response.data;
    } catch (error: any) {
      // Let cancellations propagate raw so the caller can ignore them quietly.
      if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.name === 'AbortError') {
        throw error;
      }
      console.error('Live process error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get available operations (legacy flat list of labels).
   */
  static async getOperations(): Promise<Record<string, any>> {
    try {
      const response = await api.get('/processing/operations');
      return response.data.operations;
    } catch (error: any) {
      console.error('Get operations error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get the full operation schema (categories → subcategories → typed params).
   * This is the source of truth for schema-driven UI rendering.
   */
  static async getOperationsSchema(): Promise<OperationSchema> {
    const response = await api.get('/processing/operations');
    return response.data as OperationSchema;
  }

  /**
   * Get all images for a session (from database)
   */
  static async getSessionImages(sessionId: string): Promise<ImageData[]> {
    try {
      const response = await api.get(`/images/session/${sessionId}/images?include_data=true`);
      
      if (response.data.success) {
        return response.data.images.map((img: any) => ({
          id: img.id,
          filename: img.filename,
          file_path: img.file_path,
          session_id: img.session_id,
          size_bytes: img.size_bytes,
          width: img.width,
          height: img.height,
          format: img.format,
          dataUrl: img.image,  // Full image as base64 data URL
          thumbnailDataUrl: img.thumbnail,  // Thumbnail as base64 data URL
          selected: false  // Default to not selected
        }));
      }
      
      return [];
    } catch (error: any) {
      console.error('Get session images error:', error);
      // Return empty array if session doesn't exist yet
      if (error.response?.status === 404) {
        return [];
      }
      throw this.handleError(error);
    }
  }

  /**
   * Clean up session files
   */
  static async cleanupSession(sessionId: string): Promise<void> {
    try {
      await api.post('/images/cleanup-session', { session_id: sessionId });
    } catch (error: any) {
      console.error('Cleanup error:', error);
      // Don't throw error for cleanup failures
    }
  }

  /**
   * Get session statistics (for debugging)
   */
  static async getSessionStats(): Promise<any> {
    try {
      const response = await api.get('/images/session-stats');
      return response.data.stats;
    } catch (error: any) {
      console.error('Session stats error:', error);
      return null;
    }
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await api.get('/processing/health');
      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle API errors and convert to standard format
   */
  private static handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data;
      if (errorData && errorData.message) {
        return new Error(errorData.message);
      } else if (errorData && errorData.error) {
        return new Error(errorData.error);
      } else {
        return new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
      }
    } else if (error.request) {
      // Request made but no response
      return new Error('Network error: Unable to connect to server');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  /**
   * Send cleanup beacon when page is closing (for reliable cleanup)
   */
  static sendCleanupBeacon(sessionId: string): void {
    try {
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/images/cleanup-session`;
      
      if (navigator.sendBeacon) {
        // Create JSON blob instead of FormData
        const blob = new Blob(
          [JSON.stringify({ session_id: sessionId })],
          { type: 'application/json' }
        );
        navigator.sendBeacon(url, blob);
      }
    } catch (error) {
      console.error('Beacon cleanup error:', error);
      // Silently fail - this is a best-effort cleanup
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff'];

    if (file.size > maxSize) {
      return { isValid: false, error: 'File is too large. Maximum size is 50MB.' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File type not supported. Please use JPEG, PNG, BMP, or TIFF.' };
    }

    return { isValid: true };
  }

  /**
   * Validate multiple files
   */
  static validateFiles(files: File[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxFiles = 20;

    if (files.length > maxFiles) {
      errors.push(`Too many files. Maximum ${maxFiles} files allowed.`);
    }

    files.forEach((file, index) => {
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Convert File to base64 string (for compatibility with legacy code if needed)
   */
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Download processed image
   */
  static downloadImage(dataUrl: string, filename: string): void {
    try {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Failed to download image');
    }
  }

  /**
   * Generate unique session ID
   */
  static generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${random}`;
  }
}

export default ApiService;