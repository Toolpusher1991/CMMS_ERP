// Automatische API-URL Erkennung
const getApiBaseUrl = () => {
  // 1. Production: Nutze immer VITE_API_URL wenn gesetzt (wird beim Build eingefügt)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 2. Development: Nutze gleichen Host wie Frontend
  const currentHost = window.location.hostname;
  
  // Wenn über localhost/127.0.0.1 zugegriffen wird
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:5137';
  }
  
  // Wenn über IP zugegriffen wird (z.B. 192.168.x.x), nutze gleiche IP für Backend
  if (currentHost.startsWith('192.168.') || currentHost.startsWith('10.') || currentHost.startsWith('172.')) {
    return `http://${currentHost}:5137`;
  }
  
  // 3. Production fallback
  if (currentHost.includes('onrender.com')) {
    return `https://${currentHost}`;
  }
  
  // 4. Fallback zu localhost:5137
  return 'http://localhost:5137';
};

const API_BASE_URL = `${getApiBaseUrl()}/api`;

console.log('🔧 API Base URL:', API_BASE_URL); // Debug-Ausgabe

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private defaultTimeout = 30000; // 30 seconds

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeader(skipContentType = false): HeadersInit {
    const token = localStorage.getItem('accessToken');
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (!skipContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const newAccessToken = data.data.accessToken;
      localStorage.setItem('accessToken', newAccessToken);
      return newAccessToken;
    } catch {
      // If refresh fails, clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/';
      return null;
    }
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  async request<T>(
    endpoint: string,
    options: RequestInit & { responseType?: 'json' | 'blob' | 'text' } = {},
    isRetry = false
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const { responseType = 'json', ...fetchOptions } = options;
    
    // Check if body is FormData to skip Content-Type header
    const isFormData = fetchOptions.body instanceof FormData;
    const skipContentType = isFormData || fetchOptions.headers && 'Content-Type' in fetchOptions.headers;
    
    const headers = {
      ...this.getAuthHeader(skipContentType),
      ...fetchOptions.headers,
    };

    try {
      // Add timeout via AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && !isRetry) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          const newToken = await this.refreshAccessToken();
          this.isRefreshing = false;

          if (newToken) {
            this.onTokenRefreshed(newToken);
            // Retry the original request with new token
            return this.request<T>(endpoint, { ...options, responseType }, true);
          }
        } else {
          // Wait for token refresh to complete
          return new Promise((resolve, reject) => {
            this.addRefreshSubscriber((token: string) => {
              if (token) {
                this.request<T>(endpoint, { ...options, responseType }, true)
                  .then(resolve)
                  .catch(reject);
              } else {
                reject(new Error('Token refresh failed'));
              }
            });
          });
        }
      }

      if (!response.ok) {
        // Handle 429 Too Many Requests with retry after delay
        if (response.status === 429 && !isRetry) {
          console.warn('Rate limit hit, retrying after 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return this.request<T>(endpoint, { ...options, responseType }, true);
        }

        let error: { message?: string } = {};
        try {
          error = await response.json();
        } catch {
          error = { message: `HTTP error! status: ${response.status}` };
        }
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      // Handle different response types
      switch (responseType) {
        case 'blob':
          return await response.blob() as T;
        case 'text':
          return await response.text() as T;
        case 'json':
        default:
          return await response.json();
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`Zeitüberschreitung: Server antwortet nicht (${this.defaultTimeout / 1000}s)`);
      }
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    // Check if data is FormData - if so, don't stringify
    const isFormData = data instanceof FormData;
    
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? data as BodyInit : JSON.stringify(data),
      ...options,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
