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
      console.log('API Response:', response);
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
  }
};

export default userManagementAPI;