import AuthService from './AuthService';

class BaseApiService {
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

  static async handleApiResponse(response, retryCallback) {
    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', response.headers);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const jsonData = await response.json();
        return jsonData;
      } else {
        // Handle non-JSON responses
        const textData = await response.text();
        console.log('API Response Text:', textData);
        return { data: textData, message: 'Success' };
      }
    }

    if (response.status === 401) {
      const refreshResult = await AuthService.refreshToken();
      
      if (refreshResult.success) {
        return await retryCallback();
      }
      
      throw new Error('Authentication failed. Please login again.');
    }

    if (response.status === 400) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Bad Request: Invalid data provided');
      } catch (parseError) {
        throw new Error('Bad Request: Invalid data provided');
      }
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

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
      console.error('Error in GET request:', error);
      throw error;
    }
  }

  static async post(url, data) {
    try {
      console.log('Making POST request to:', url);
      console.log('Request Data:', data);
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
      console.error('Error in POST request:', error);
      throw error;
    }
  }

  static async patch(url, body = null) {
    try {
      console.log('Making PATCH request to:', url);
      console.log('Request Body:', body);
      const accessToken = await AuthService.getAccessToken();
      
      if (!accessToken) {
        throw new Error('User not authenticated. Please login again.');
      }

      // Prepare headers
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
      };

      // If body is FormData, let browser set Content-Type automatically
      // Otherwise, set Content-Type to application/json
      if (body && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      // Prepare fetch options
      const fetchOptions = {
        method: 'PATCH',
        headers,
      };

      // Only add body if it exists
      if (body) {
        if (body instanceof FormData) {
          fetchOptions.body = body;
        } else {
          fetchOptions.body = JSON.stringify(body);
        }
      }

      const response = await fetch(url, fetchOptions);

      return await this.handleApiResponse(response, async () => {
        const newToken = await AuthService.getAccessToken();
        const retryHeaders = {
          'Authorization': `Bearer ${newToken}`,
        };
        
        if (body && !(body instanceof FormData)) {
          retryHeaders['Content-Type'] = 'application/json';
        }

        const retryOptions = {
          method: 'PATCH',
          headers: retryHeaders,
        };

        if (body) {
          if (body instanceof FormData) {
            retryOptions.body = body;
          } else {
            retryOptions.body = JSON.stringify(body);
          }
        }

        const retryResponse = await fetch(url, retryOptions);
        return await this.handleApiResponse(retryResponse, null);
      });
    } catch (error) {
      console.error('Error in PATCH request:', error);
      throw error;
    }
  }

  static async delete(url) {
    try {
      console.log('Making DELETE request to:', url);
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      return await this.handleApiResponse(response, async () => {
        const newHeaders = await this.getAuthHeaders();
        const retryResponse = await fetch(url, {
          method: 'DELETE',
          headers: newHeaders,
        });
        return await this.handleApiResponse(retryResponse, null);
      });
    } catch (error) {
      console.error('Error in DELETE request:', error);
      throw error;
    }
  }
}

export default BaseApiService;