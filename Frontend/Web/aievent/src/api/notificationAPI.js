import fetcher from "./fetcher";

export const notificationAPI = {
  // Get notifications for the current user
  getNotifications: async (pageNumber = 1, pageSize = 10) => {
    console.log('Fetching notifications from API, page:', pageNumber, 'size:', pageSize);
    const response = await fetcher.get(`/notifications?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    console.log('Received notifications response:', response.data);
    return response.data;
  },

  // Get total unread notification count
  getUnreadCount: async () => {
    try {
      console.log('Fetching unread count from API');
      // Try to get a direct count first
      try {
        const countResponse = await fetcher.get(`/notifications/unread-count`);
        console.log('Received direct unread count response:', countResponse.data);
        if (typeof countResponse.data === 'number') {
          console.log('Returning direct count:', countResponse.data);
          return countResponse.data;
        }
      } catch (directCountError) {
        console.log('Direct unread count endpoint not available, falling back to page fetch');
      }
      
      // Fetch with a larger page size to get more notifications
      const response = await fetcher.get(`/notifications?pageNumber=1&pageSize=100`);
      console.log('Received notifications page response:', response.data);
      const data = response.data;
      
      // Handle different response structures
      if (typeof data === 'number') {
        // Direct count returned
        console.log('Returning direct count:', data);
        return data;
      }
      
      // If the response has items directly, filter them
      if (Array.isArray(data)) {
        const count = data.filter(n => !n.isRead).length;
        console.log('Calculated count from array:', count);
        return count;
      }
      
      // If the response has a paginated structure
      if (data && data.items) {
        const count = data.items.filter(n => !n.isRead).length;
        console.log('Calculated count from paginated items:', count);
        return count;
      }
      
      // If we can't determine the structure, return 0
      console.warn('Unable to determine unread count structure, returning 0');
      return 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
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