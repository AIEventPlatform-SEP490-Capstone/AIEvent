import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
  unreadCount: 0,
  hasMore: true,
  page: 1,
  totalPages: 1,
  totalItems: 0,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Fetch notifications
    fetchNotifications: (state, action) => {
      state.loading = false;
      state.items = action.payload.notifications || [];
      if (action.payload.pagination) {
        state.page = action.payload.pagination.currentPage;
        state.totalPages = action.payload.pagination.totalPages;
        state.totalItems = action.payload.pagination.totalItems;
        state.hasMore = state.page < state.totalPages;
      }
    },

    // Add new notification (from SignalR)
    addNotification: (state, action) => {
      const notification = action.payload;
      // Thêm notification vào đầu danh sách
      state.items.unshift(notification);
      // Tăng total items
      state.totalItems += 1;
      // Nếu notification chưa read, tăng unread count
      if (!notification.isRead && !notification.IsRead) {
        state.unreadCount += 1;
      }
    },

    // Mark notification as read
    markAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.items.find(
        n => n.notificationId === notificationId || n.NotificationId === notificationId
      );
      if (notification) {
        notification.isRead = true;
        notification.IsRead = true;
        if (state.unreadCount > 0) {
          state.unreadCount -= 1;
        }
      }
    },

    // Mark all notifications as read
    markAllAsRead: (state) => {
      state.items.forEach(notification => {
        notification.isRead = true;
        notification.IsRead = true;
      });
      state.unreadCount = 0;
    },

    // Delete read notifications
    deleteReadNotifications: (state) => {
      state.items = state.items.filter(n => !n.isRead && !n.IsRead);
      state.totalItems = state.items.length;
    },

    // Update unread count
    updateUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },

    // Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Set error
    setError: (state, action) => {
      state.error = action.payload;
    },

    // Clear all notifications
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
      state.totalItems = 0;
      state.page = 1;
      state.totalPages = 1;
      state.hasMore = true;
    },
  },
});

// Actions
export const {
  fetchNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteReadNotifications,
  updateUnreadCount,
  setLoading,
  setError,
  clearNotifications,
} = notificationsSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notifications.items;
export const selectNotificationsLoading = (state) => state.notifications.loading;
export const selectNotificationsError = (state) => state.notifications.error;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectHasMore = (state) => state.notifications.hasMore;
export const selectPage = (state) => state.notifications.page;
export const selectTotalPages = (state) => state.notifications.totalPages;
export const selectTotalItems = (state) => state.notifications.totalItems;

// Default export
export default notificationsSlice.reducer;
