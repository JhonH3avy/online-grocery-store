import { config } from '../config';

// API Configuration - now using centralized config
const API_BASE_URL = config.api.baseUrl;

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// HTTP Client Class
class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.timeout = config.api.timeout;
    this.retries = config.api.retries;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    // Get auth token from localStorage
    const authToken = localStorage.getItem('auth_token');
    
    const requestConfig: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    };

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await fetch(url, requestConfig);
        clearTimeout(timeoutId);
        
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return {
          success: true,
          data: data.data || data,
          message: data.message,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on the last attempt
        if (attempt === this.retries) break;
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    // If we get here, all retries failed
    clearTimeout(timeoutId);
    console.error('API request failed after retries:', lastError);
    
    return {
      success: false,
      error: lastError?.message || 'Unknown error occurred',
    };
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Health check utility
export const healthCheck = async (): Promise<ApiResponse> => {
  return apiClient.get('/health');
};
