import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { notificationAPI } from "../../api/notificationAPI";
import { showError, showSuccess } from "../../lib/toastUtils";

// Async thunks
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async ({ pageNumber = 1, pageSize = 10 }, { rejectWithValue }) => {
    try {
      const response = await notificationAPI.getNotifications(pageNumber, pageSize);
      return response.data;
    } catch (error) {
      console.error('Error in fetchNotifications thunk:', error);
      return rejectWithValue(error.response?.data?.message || "Failed to fetch notifications");
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const count = await notificationAPI.getUnreadCount();
      return count;
    } catch (error) {
      console.error('Error in fetchUnreadCount thunk:', error);
      // Return 0 as fallback instead of rejecting to prevent UI issues
      return 0;
    }
  }
);

export const markAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to mark notification as read");
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      await notificationAPI.markAllAsRead();
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to mark all notifications as read");
    }
  }
);

export const deleteReadNotifications = createAsyncThunk(
  "notifications/deleteReadNotifications",
  async (_, { rejectWithValue }) => {
    try {
      await notificationAPI.deleteReadNotifications();
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to clear read notifications");
    }
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    loading: false,
    error: null,
    unreadCount: 0,
    hasMore: true,
    page: 1,
    totalPages: 1,
    totalItems: 0
  },
  reducers: {
    addNotification: (state, action) => {
      // Add new notification to the beginning of the list
      state.items.unshift(action.payload);
      // Increment unread count since new notifications are unread by default
      state.unreadCount += 1;
    },
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
      state.page = 1;
      state.hasMore = true;
    },
    updateUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const { items, totalItems, currentPage, totalPages, pageSize } = action.payload;
        
        if (currentPage === 1) {
          state.items = items;
        } else {
          // Append new notifications
          state.items = [...state.items, ...items];
        }
        
        // Update pagination info
        state.page = currentPage;
        state.totalPages = totalPages;
        state.totalItems = totalItems;
        state.hasMore = currentPage < totalPages;
        
        // For the first page, we should also update the unread count based on current notifications
        if (currentPage === 1) {
          const unreadInCurrentPage = items.filter(n => !n.isRead).length;
          // But we don't want to overwrite the real-time count, so we only update if it's 0
          // This ensures that real-time updates are preserved
          if (state.unreadCount === 0 && unreadInCurrentPage > 0) {
            state.unreadCount = unreadInCurrentPage;
          }
        }
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        showError(action.payload);
      })
      
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notificationId = action.payload;
        const notification = state.items.find(n => n.notificationId === notificationId);
        if (notification) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
          const previousCount = state.unreadCount;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAsRead.rejected, (_, action) => {
        showError(action.payload);
      })
      
      // Mark all as read
      .addCase(markAllAsRead.fulfilled, (state) => {
        const previousCount = state.unreadCount;
        state.items.forEach(notification => {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
        });
        state.unreadCount = 0;
        showSuccess("All notifications marked as read");
      })
      .addCase(markAllAsRead.rejected, (_, action) => {
        showError(action.payload);
      })
      
      // Delete read notifications
      .addCase(deleteReadNotifications.fulfilled, (state) => {
        state.items = state.items.filter(notification => !notification.isRead);
        showSuccess("Cleared read notifications");
      })
      .addCase(deleteReadNotifications.rejected, (_, action) => {
        showError(action.payload);
      })
      
      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        const newUnreadCount = action.payload;
        state.unreadCount = newUnreadCount;
      })
      .addCase(fetchUnreadCount.rejected, (_, action) => {
        console.error("Failed to fetch unread count: ", action.payload);
        showError("Failed to fetch unread notification count");
      });
  }
});

export const { addNotification, clearNotifications, updateUnreadCount } = notificationsSlice.actions;
export default notificationsSlice.reducer;