import AuthService from './AuthService';

class BaseApiService {
  /**
   * Get authentication headers
   */
  static async getAuthHeaders() {
    const accessToken = await AuthService.getAccessToken();
    
    if (!accessToken) {
      throw new Error('User not authenticated. Please login again.');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };
  }

  /**
   * Handle API response with token refresh
   */
  static async handleApiResponse(response, retryCallback) {
    if (response.ok) {
      return await response.json();
    }

    if (response.status === 401) {
      // Token might be expired, try to refresh
      const refreshResult = await AuthService.refreshToken();
      
      if (refreshResult.success) {
        // Retry with new token
        return await retryCallback();
      }
      
      throw new Error('Authentication failed. Please login again.');
    }

    throw new Error(`HTTP error! status: ${response.status}`);
  }

  /**
   * Make authenticated GET request
   */
  static async get(url) {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      return await this.handleApiResponse(response, async () => {
        const newHeaders = await this.getAuthHeaders();
        const retryResponse = await fetch(url, {
          method: 'GET',
          headers: newHeaders,
        });
        return await this.handleApiResponse(retryResponse, null);
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make authenticated POST request
   */
  static async post(url, data) {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      return await this.handleApiResponse(response, async () => {
        const newHeaders = await this.getAuthHeaders();
        const retryResponse = await fetch(url, {
          method: 'POST',
          headers: newHeaders,
          body: JSON.stringify(data),
        });
        return await this.handleApiResponse(retryResponse, null);
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make authenticated PATCH request
   */
  static async patch(url, formData) {
    try {
      const accessToken = await AuthService.getAccessToken();
      
      if (!accessToken) {
        throw new Error('User not authenticated. Please login again.');
      }

      const response = await fetch(url, {
        method: 'PATCH',
        body: formData,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return await this.handleApiResponse(response, async () => {
        const newToken = await AuthService.getAccessToken();
        const retryResponse = await fetch(url, {
          method: 'PATCH',
          body: formData,
          headers: {
            'Authorization': `Bearer ${newToken}`,
          },
        });
        return await this.handleApiResponse(retryResponse, null);
      });
    } catch (error) {
      throw error;
    }
  }
}

export default BaseApiService;
