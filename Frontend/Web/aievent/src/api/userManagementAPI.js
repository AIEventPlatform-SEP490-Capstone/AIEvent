import fetcher from "./fetcher";

export const userManagementAPI = {
  // Get all users with pagination and filters
  getAllUsers: async (pageNumber = 1, pageSize = 10, email = '', name = '', role = '') => {
    try {
      const params = new URLSearchParams();
      params.append('pageNumber', pageNumber.toString());
      params.append('pageSize', pageSize.toString());

      if (email) params.append('email', email);
      if (name) params.append('name', name);
      if (role) params.append('role', role);

      const response = await fetcher.get(`/user?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch users');
    }
  },

  // Get all banned users with pagination and filters
  getAllBannedUsers: async (pageNumber = 1, pageSize = 10, email = '', name = '', role = '') => {
    try {
      const params = new URLSearchParams();
      params.append('pageNumber', pageNumber.toString());
      params.append('pageSize', pageSize.toString());

      if (email) params.append('email', email);
      if (name) params.append('name', name);
      if (role) params.append('role', role);

      const response = await fetcher.get(`/user/banned?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch banned users');
    }
  },

  // Get user by ID
  getUserById: async (id) => {
    try {
      const response = await fetcher.get(`/user/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch user');
    }
  },

  // Ban/Delete user
  banUser: async (id) => {
    try {
      const response = await fetcher.delete(`/user/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to ban user');
    }
  },

  // Unban user
  unbanUser: async (id) => {
    try {
      const response = await fetcher.patch(`/user/unban/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to unban user');
    }
  },

  // Create manager account
  createManagerAccount: async (data) => {
    try {
      // If data is FormData, fetcher will handle Content-Type automatically
      // If data is not FormData, fetcher will set Content-Type to application/json
      const response = await fetcher.post('/user/manager', data);
      return response.data;
    } catch (error) {
      // Parse error response to get statusCode and message
      const errorResponse = error.response?.data || error;
      const errorMessage = errorResponse.message || error.message || 'Failed to create manager account';
      const errorCode = errorResponse.statusCode;
      
      // Create error object with code and message
      const customError = new Error(errorMessage);
      customError.code = errorCode;
      customError.response = errorResponse;
      
      throw customError;
    }
  },

  //Staff Management
  getAllStaff: async (pageNumber = 1, pageSize = 10, email = '', name = '') => {
    try {
      const params = new URLSearchParams();
      params.append('pageNumber', pageNumber.toString());
      params.append('pageSize', pageSize.toString());

      if (email) params.append('email', email);
      if (name) params.append('name', name);

      const response = await fetcher.get(`/user/staff?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch staff');
    }
  },

  addStaff: async (data) => {
    try {
      // If data is FormData, fetcher will handle Content-Type automatically
      // If data is not FormData, fetcher will set Content-Type to application/json
      const response = await fetcher.post('/user/staff', data);
      return response.data;
    } catch (error) {
      // Parse error response to get statusCode and message
      const errorResponse = error.response?.data || error;
      const errorMessage = errorResponse.message || error.message || 'Failed to add staff';
      const errorCode = errorResponse.statusCode;
      
      // Create error object with code and message
      const customError = new Error(errorMessage);
      customError.code = errorCode;
      customError.response = errorResponse;
      
      throw customError;
    }
  },

  deleteStaff: async (id) => {
    try {
      const response = await fetcher.delete(`/user/staff/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to delete staff');
    }
  },

};

export default userManagementAPI;