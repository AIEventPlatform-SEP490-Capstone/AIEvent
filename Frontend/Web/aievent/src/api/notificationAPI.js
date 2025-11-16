import fetcher from "./fetcher";

export const notificationAPI = {
  // Get notifications for the current user
  getNotifications: async (pageNumber = 1, pageSize = 10) => {
    const response = await fetcher.get(`/notifications?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    return response.data;
  },

  // Get total unread notification count
  getUnreadCount: async () => {
    try {
      // Try to get a direct count first
      try {
        const countResponse = await fetcher.get(`/notifications/unread-count`);
        if (typeof countResponse.data === 'number') {
          return countResponse.data;
        }
      } catch (directCountError) {
      }
      
      // Fetch with a larger page size to get more notifications
      const response = await fetcher.get(`/notifications?pageNumber=1&pageSize=100`);
      const data = response.data;
      
      // Handle different response structures
      if (typeof data === 'number') {
        // Direct count returned
        return data;
      }
      
      // If the response has items directly, filter them
      if (Array.isArray(data)) {
        const count = data.filter(n => !n.isRead).length;
        return count;
      }
      
      // If the response has a paginated structure
      if (data && data.items) {
        const count = data.items.filter(n => !n.isRead).length;
        return count;
      }

      return 0;
    } catch (error) {
      throw error;
    }
  },



  // Mark a specific notification as read
  markAsRead: async (notificationId) => {
    const response = await fetcher.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await fetcher.patch(`/notifications/read-all`);
    return response.data;
  },

  // Delete all read notifications
  deleteReadNotifications: async () => {
    const response = await fetcher.delete(`/notifications/read`);
    return response.data;
  }
};