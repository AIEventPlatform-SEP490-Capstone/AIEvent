import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { notificationAPI } from "../../api/notificationAPI";
import { showError, showSuccess } from "../../lib/toastUtils";

// Log initial state for debugging
console.log('Initializing notifications slice with initialState:', {
  items: [],
  loading: false,
  error: null,
  unreadCount: 0,
  hasMore: true,
  page: 1,
  totalPages: 1,
  totalItems: 0
});

// Async thunks
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async ({ pageNumber = 1, pageSize = 10 }, { rejectWithValue }) => {
    try {
      console.log('Fetching notifications from API, page:', pageNumber, 'size:', pageSize);
      const response = await notificationAPI.getNotifications(pageNumber, pageSize);
      console.log('Received notifications from API:', response.data);
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
      console.log('Fetching unread count from API in thunk');
      const count = await notificationAPI.getUnreadCount();
      console.log('Received unread count from API in thunk:', count);
      return count;
    } catch (error) {
      console.error('Error in fetchUnreadCount thunk:', error);
      return rejectWithValue(error.response?.data?.message || "Failed to fetch unread count");
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
      console.log('Adding new notification:', action.payload);
      // Add new notification to the beginning of the list
      state.items.unshift(action.payload);
      // Increment unread count since new notifications are unread by default
      const previousCount = state.unreadCount;
      state.unreadCount += 1;
      console.log('Added notification, unreadCount changed from', previousCount, 'to:', state.unreadCount);
    },
    clearNotifications: (state) => {
      console.log('Clearing notifications, previous unreadCount:', state.unreadCount);
      state.items = [];
      state.unreadCount = 0;
      state.page = 1;
      state.hasMore = true;
      console.log('Cleared notifications, unreadCount is now:', state.unreadCount);
    },
    updateUnreadCount: (state, action) => {
      console.log('Updating unread count from', state.unreadCount, 'to:', action.payload);
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
        
        console.log('Fetched notifications, current unreadCount:', state.unreadCount);
        
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
        
        // Count unread notifications in the current page
        const unreadInPage = items.filter(n => !n.isRead).length;
        console.log('Unread notifications in current page:', unreadInPage);
        
        // Do not overwrite unreadCount when fetching notifications
        // The unreadCount is managed separately and updated in real-time
        // when new notifications arrive or when notifications are marked as read
        console.log('After fetch, unreadCount is still:', state.unreadCount);
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
          console.log('Marked notification as read, unreadCount changed from', previousCount, 'to:', state.unreadCount);
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
        console.log('Marked all notifications as read, unreadCount changed from', previousCount, 'to:', state.unreadCount);
      })
      .addCase(markAllAsRead.rejected, (_, action) => {
        showError(action.payload);
      })
      
      // Delete read notifications
      .addCase(deleteReadNotifications.fulfilled, (state) => {
        console.log('Deleting read notifications, current unreadCount:', state.unreadCount);
        state.items = state.items.filter(notification => !notification.isRead);
        showSuccess("Cleared read notifications");
        console.log('Deleted read notifications, unreadCount is still:', state.unreadCount);
      })
      .addCase(deleteReadNotifications.rejected, (_, action) => {
        showError(action.payload);
      })
      
      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        console.log('Received unread count from API:', action.payload);
        const newUnreadCount = action.payload;
        console.log('Updating unread count from', state.unreadCount, 'to:', newUnreadCount);
        state.unreadCount = newUnreadCount;
        console.log('Fetched unread count, unreadCount is now:', state.unreadCount);
      })
      .addCase(fetchUnreadCount.rejected, (_, action) => {
        console.error("Failed to fetch unread count: ", action.payload);
        showError("Failed to fetch unread notification count");
      });
  }
});

export const { addNotification, clearNotifications, updateUnreadCount } = notificationsSlice.actions;
export default notificationsSlice.reducer;