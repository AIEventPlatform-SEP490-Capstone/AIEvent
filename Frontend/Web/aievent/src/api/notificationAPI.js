import fetcher from "./fetcher";

export const notificationAPI = {
  // Get notifications for the current user
  getNotifications: async (isRead = null, pageNumber = 1, pageSize = 10) => {
    // Build query parameters properly
    const params = new URLSearchParams();
    params.append('pageNumber', pageNumber.toString());
    params.append('pageSize', pageSize.toString());
    
    // Only add isRead parameter if it's not null
    if (isRead !== null) {
      params.append('isRead', isRead.toString());
    }
    
    const response = await fetcher.get(`/notifications?${params.toString()}`);
    // Extract the actual data from the SuccessResponse wrapper
    return response.data.data;
  },

  // Get total unread notification count
  getUnreadCount: async () => {
    try {
      // Fetch unread notifications only
      const response = await fetcher.get('/notifications?isRead=false&pageNumber=1&pageSize=100');
      // Extract the actual data from the SuccessResponse wrapper
      const data = response.data.data;
      
      // If the response has items directly, count them
      if (Array.isArray(data)) {
        return data.length;
      }
      
      // If the response has a paginated structure
      if (data && data.items) {
        return data.items.length;
      }

      return 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  // Mark a specific notification as read
  markAsRead: async (notificationId) => {
    const response = await fetcher.patch(`/notifications/${notificationId}/read`);
    return response.data.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await fetcher.patch(`/notifications/read-all`);
    return response.data.data;
  },

  // Delete all read notifications
  deleteReadNotifications: async () => {
    const response = await fetcher.delete(`/notifications/read`);
    return response.data.data;
  }
};