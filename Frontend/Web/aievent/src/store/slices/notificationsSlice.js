import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { notificationAPI } from "../../api/notificationAPI";
import { showError, showSuccess } from "../../lib/toastUtils";

// Async thunks
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async ({ isRead = null, pageNumber = 1, pageSize = 10 }, { rejectWithValue }) => {
    try {
      const response = await notificationAPI.getNotifications(isRead, pageNumber, pageSize);
      return response;
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
      // Normalize the incoming notification to camelCase
      const normalizedNotification = {
        ...action.payload,
        notificationId: action.payload.notificationId || action.payload.NotificationId,
        title: action.payload.title || action.payload.Title,
        message: action.payload.message || action.payload.Message,
        isRead: action.payload.isRead !== undefined ? action.payload.isRead : action.payload.IsRead,
        readAt: action.payload.readAt || action.payload.ReadAt,
        imageUrl: action.payload.imageUrl || action.payload.ImageUrl,
        type: action.payload.type || action.payload.Type,
        createdTime: action.payload.createdTime || action.payload.CreatedTime,
        eventId: action.payload.eventId || action.payload.EventId,
        eventInvitationId: action.payload.eventInvitationId || action.payload.EventInvitationId,
        organizerProfileId: action.payload.organizerProfileId || action.payload.OrganizerProfileId
      };
      
      // Add new notification to the beginning of the list
      state.items.unshift(normalizedNotification);
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
        const data = action.payload;
        
        // Handle different response structures
        let items, totalItems, currentPage, totalPages;
        
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          if (data.items || data.Items) {
            // Paginated response - handle both camelCase and PascalCase
            items = data.items || data.Items;
            totalItems = data.totalItems || data.TotalItems || 0;
            currentPage = data.currentPage || data.CurrentPage || 1;
            totalPages = data.totalPages || data.TotalPages || Math.ceil(totalItems / (data.pageSize || data.PageSize || 10));
          } else {
            // Non-paginated response object
            items = [data];
            totalItems = 1;
            currentPage = 1;
            totalPages = 1;
          }
        } else if (Array.isArray(data)) {
          // Direct array response
          items = data;
          totalItems = data.length;
          currentPage = 1;
          totalPages = 1;
        } else {
          // Fallback
          items = [];
          totalItems = 0;
          currentPage = 1;
          totalPages = 1;
        }
        
        // Normalize property names to camelCase for consistency
        const normalizedItems = items.map(item => ({
          ...item,
          notificationId: item.notificationId || item.NotificationId,
          title: item.title || item.Title,
          message: item.message || item.Message,
          isRead: item.isRead !== undefined ? item.isRead : item.IsRead,
          readAt: item.readAt || item.ReadAt,
          imageUrl: item.imageUrl || item.ImageUrl,
          type: item.type || item.Type,
          createdTime: item.createdTime || item.CreatedTime,
          eventId: item.eventId || item.EventId,
          eventInvitationId: item.eventInvitationId || item.EventInvitationId,
          organizerProfileId: item.organizerProfileId || item.OrganizerProfileId
        }));
        
        if (currentPage === 1) {
          state.items = normalizedItems;
        } else {
          // Append new notifications
          state.items = [...state.items, ...normalizedItems];
        }
        
        // Update pagination info
        state.page = currentPage;
        state.totalPages = totalPages;
        state.totalItems = totalItems;
        state.hasMore = currentPage < totalPages;
        
        // For the first page, we should also update the unread count based on current notifications
        if (currentPage === 1) {
          const unreadInCurrentPage = normalizedItems.filter(n => !n.isRead).length;
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
        const notification = state.items.find(n => 
          (n.notificationId === notificationId) || 
          (n.NotificationId === notificationId)
        );
        if (notification) {
          // Update both camelCase and PascalCase properties if they exist
          notification.isRead = true;
          notification.IsRead = true;
          const readAt = new Date().toISOString();
          notification.readAt = readAt;
          notification.ReadAt = readAt;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAsRead.rejected, (_, action) => {
        showError(action.payload);
      })
      
      // Mark all as read
      .addCase(markAllAsRead.fulfilled, (state) => {
        const readAt = new Date().toISOString();
        state.items.forEach(notification => {
          // Update both camelCase and PascalCase properties if they exist
          notification.isRead = true;
          notification.IsRead = true;
          notification.readAt = readAt;
          notification.ReadAt = readAt;
        });
        state.unreadCount = 0;
        // showSuccess("All notifications marked as read");
      })
      .addCase(markAllAsRead.rejected, (_, action) => {
        showError(action.payload);
      })
      
      // Delete read notifications
      .addCase(deleteReadNotifications.fulfilled, (state) => {
        state.items = state.items.filter(notification => 
          !notification.isRead && !notification.IsRead
        );
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