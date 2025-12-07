import BaseApiService from './BaseApiService';
import EndUrls from '../EndUrls';

class NotificationService {
  /**
   * Get notifications for the current user
   */
  static async getNotifications(params = {}) {
    try {
      const {
        isRead = null,
        pageNumber = 1,
        pageSize = 10
      } = params;

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('pageNumber', pageNumber);
      queryParams.append('pageSize', pageSize);
      
      // Only add isRead parameter if it's not null
      if (isRead !== null) {
        queryParams.append('isRead', isRead);
      }

      const url = `${EndUrls.NOTIFICATIONS}?${queryParams.toString()}`;
      const response = await BaseApiService.get(url);
      
      // Extract data from the response
      let data = response;
      
      // Handle different response structures
      if (response.data) {
        data = response.data;
      }
      
      // If we have a data wrapper, extract the actual data
      if (data.data) {
        data = data.data;
      }
      
      // Extract items from paginated response
      const items = data.items || data.Items || [];
      
      return {
        success: true,
        data: items,
        pagination: {
          currentPage: data.currentPage || data.CurrentPage || pageNumber,
          totalPages: data.totalPages || data.TotalPages || 1,
          totalItems: data.totalItems || data.TotalItems || items.length || 0,
          pageSize: data.pageSize || data.PageSize || pageSize
        },
        message: 'Notifications fetched successfully',
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        data: [],
        error: error.message,
        message: 'Failed to fetch notifications',
      };
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount() {
    try {
      const response = await BaseApiService.get(EndUrls.NOTIFICATIONS_UNREAD_COUNT);
      
      // Extract data from the response
      let data = response;
      
      if (response.data) {
        data = response.data;
      }
      
      if (data.data) {
        data = data.data;
      }
      
      // If the response has items directly, count them
      if (Array.isArray(data)) {
        return {
          success: true,
          data: data.length,
          message: 'Unread count fetched successfully',
        };
      }
      
      // If the response has a paginated structure
      if (data && data.items) {
        return {
          success: true,
          data: data.items.length,
          message: 'Unread count fetched successfully',
        };
      }

      return {
        success: true,
        data: 0,
        message: 'No unread notifications',
      };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return {
        success: false,
        data: 0,
        error: error.message,
        message: 'Failed to fetch unread count',
      };
    }
  }

  /**
   * Mark a specific notification as read
   */
  static async markAsRead(notificationId) {
    try {
      const url = EndUrls.MARK_NOTIFICATION_READ(notificationId);
      const response = await BaseApiService.patch(url, {});
      
      // Extract data from the response
      let data = response;
      
      if (response.data) {
        data = response.data;
      }
      
      if (data.data) {
        data = data.data;
      }
      
      return {
        success: true,
        data: data,
        message: 'Notification marked as read',
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to mark notification as read',
      };
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead() {
    try {
      const response = await BaseApiService.patch(
        EndUrls.MARK_ALL_NOTIFICATIONS_READ,
        {}
      );
      
      // Extract data from the response
      let data = response;
      
      if (response.data) {
        data = response.data;
      }
      
      if (data.data) {
        data = data.data;
      }
      
      return {
        success: true,
        data: data,
        message: 'All notifications marked as read',
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to mark all notifications as read',
      };
    }
  }

  /**
   * Delete all read notifications
   */
  static async deleteReadNotifications() {
    try {
      const response = await BaseApiService.delete(
        EndUrls.DELETE_READ_NOTIFICATIONS
      );
      
      // Extract data from the response
      let data = response;
      
      if (response.data) {
        data = response.data;
      }
      
      if (data.data) {
        data = data.data;
      }
      
      return {
        success: true,
        data: data,
        message: 'Read notifications deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete read notifications',
      };
    }
  }
}

export default NotificationService;
