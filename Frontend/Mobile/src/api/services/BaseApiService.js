import AuthService from './AuthService';

class BaseApiService {
  static async getAuthHeaders(hasBody = true) {
    const accessToken = await AuthService.getAccessToken();

    if (!accessToken) {
      throw new Error('User not authenticated. Please login again.');
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    // Only set Content-Type for requests with a body
    if (hasBody) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  static async handleApiResponse(response, retryCallback) {
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const jsonData = await response.json();
        return jsonData;
      } else {
        // Handle non-JSON responses
        const textData = await response.text();
        console.log('API Response Text:', textData);
        return {data: textData, message: 'Success'};
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
        // Read response as text first to avoid body consumption issues
        const textData = await response.text();
        console.error('API 400 Error Body (text):', textData);
        
        let errorData = null;
        let errorMessage = 'Bad Request: Invalid data provided';
        let statusCode = '400';
        
        // Try to parse as JSON
        try {
          errorData = JSON.parse(textData);
          console.error('API 400 Error Body (parsed):', errorData);
          
          // Extract message from parsed data
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData) {
            errorMessage = JSON.stringify(errorData);
          }
          
          statusCode = errorData?.statusCode || '400';
        } catch (parseError) {
          console.error('Failed to parse 400 response as JSON:', parseError);
          // If parsing fails, try to use textData if it looks like an error message
          if (textData && textData.length < 500 && !textData.includes('<!DOCTYPE')) {
            errorMessage = textData;
          }
        }
        
        // Create error object with proper properties
        const error = new Error(errorMessage);
        error.statusCode = statusCode;
        error.errors = errorData?.errors;
        error.originalData = errorData;

        throw error;
      } catch (error) {
        // If error is already our custom error, re-throw it
        if (error.statusCode) {
          throw error;
        }
        // Otherwise, wrap it
        console.error('Error handling 400 response:', error);
        const wrappedError = new Error(error.message || 'Bad Request: Invalid data provided');
        wrappedError.statusCode = '400';
        throw wrappedError;
      }
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  static async get(url) {
    try {
      const headers = await this.getAuthHeaders(false);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      return await this.handleApiResponse(response, async () => {
        const newHeaders = await this.getAuthHeaders(false);
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

  static async post(url, data = null) {
    try {
      console.log('Making POST request to:', url);
      console.log('Request Data:', data);
      const headers = await this.getAuthHeaders(data !== null && data !== undefined);

      const fetchOptions = {
        method: 'POST',
        headers,
      };

      // Only add body if data is provided and not null
      if (data !== null && data !== undefined) {
        fetchOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, fetchOptions);

      return await this.handleApiResponse(response, async () => {
        const newHeaders = await this.getAuthHeaders(data !== null && data !== undefined);
        const retryOptions = {
          method: 'POST',
          headers: newHeaders,
        };
        
        // Only add body if data is provided and not null
        if (data !== null && data !== undefined) {
          retryOptions.body = JSON.stringify(data);
        }
        
        const retryResponse = await fetch(url, retryOptions);
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
        Authorization: `Bearer ${accessToken}`,
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
          Authorization: `Bearer ${newToken}`,
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

  static async put(url, data = null) {
    try {
      console.log('Making PUT request to:', url);
      console.log('Request Data:', data);
      const headers = await this.getAuthHeaders(data !== null && data !== undefined);

      const fetchOptions = {
        method: 'PUT',
        headers,
      };

      // Only add body if data is provided and not null
      if (data !== null && data !== undefined) {
        fetchOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, fetchOptions);

      return await this.handleApiResponse(response, async () => {
        const newHeaders = await this.getAuthHeaders(data !== null && data !== undefined);
        const retryOptions = {
          method: 'PUT',
          headers: newHeaders,
        };
        
        // Only add body if data is provided and not null
        if (data !== null && data !== undefined) {
          retryOptions.body = JSON.stringify(data);
        }
        
        const retryResponse = await fetch(url, retryOptions);
        return await this.handleApiResponse(retryResponse, null);
      });
    } catch (error) {
      console.error('Error in PUT request:', error);
      throw error;
    }
  }

  static async delete(url) {
    try {
      console.log('Making DELETE request to:', url);
      const headers = await this.getAuthHeaders(false);

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      return await this.handleApiResponse(response, async () => {
        const newHeaders = await this.getAuthHeaders(false);
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
