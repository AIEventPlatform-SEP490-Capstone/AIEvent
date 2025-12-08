import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteReadNotifications,
  addNotification,
  updateUnreadCount,
  selectNotifications,
  selectNotificationsLoading,
  selectNotificationsError,
  selectUnreadCount,
  selectHasMore,
  selectPage,
  selectTotalPages,
  selectTotalItems,
} from '../redux/slices/notificationsSlice';
import NotificationService from '../api/services/NotificationService';
import { NETWORK_CONFIG, getSignalRBaseUrl } from '../config/NetworkConfig';

export const useNotifications = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const notifications = useSelector(selectNotifications);
  const loading = useSelector(selectNotificationsLoading);
  const error = useSelector(selectNotificationsError);
  const unreadCount = useSelector(selectUnreadCount);
  const hasMore = useSelector(selectHasMore);
  const page = useSelector(selectPage);
  const totalPages = useSelector(selectTotalPages);
  const totalItems = useSelector(selectTotalItems);

  // Persist connection across re-renders
  const connectionRef = useRef(null);
  const [signalRConnected, setSignalRConnected] = useState(false);

  // Fetch notifications
  const fetchNotificationsAPI = async (isRead = null, pageNumber = 1, pageSize = 10) => {
    try {
      const response = await NotificationService.getNotifications({
        isRead,
        pageNumber,
        pageSize,
      });

      if (response.success) {
        dispatch(fetchNotifications({ notifications: response.data, pagination: response.pagination }));
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      throw err;
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await NotificationService.markAsRead(notificationId);
      if (response.success) {
        dispatch(markAsRead(notificationId));
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const response = await NotificationService.markAllAsRead();
      if (response.success) {
        dispatch(markAllAsRead());
        dispatch(updateUnreadCount(0));
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  };

  // Delete read notifications
  const handleDeleteReadNotifications = async () => {
    try {
      const response = await NotificationService.deleteReadNotifications();
      if (response.success) {
        dispatch(deleteReadNotifications());
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error('Error deleting read notifications:', err);
      throw err;
    }
  };

  // Setup SignalR connection (chỉ load notification mà không báo device)
  useEffect(() => {
    const setupSignalR = async () => {
      try {
        const AuthService = require('../api/services/AuthService').default;
        const accessToken = await AuthService.getAccessToken();
        
        if (!accessToken) {
          console.log('SignalR: No access token available');
          return;
        }

        // Chỉ setup nếu chưa có connection
        if (connectionRef.current) {
          return;
        }

        // Get base URL safely
        const baseUrl = getSignalRBaseUrl();
        if (!baseUrl) {
          console.log('SignalR: No base URL configured');
          return;
        }

        const cleanUrl = baseUrl.replace(/\/$/, '');
        console.log('SignalR: Connecting to', `${cleanUrl}/hubs/notification`);
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(`${cleanUrl}/hubs/notification`, {
            accessTokenFactory: () => accessToken,
          })
          .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: (retryContext) => {
              if (retryContext.elapsedMilliseconds > 120000) return null;
              return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount + 1), 30000);
            }
          })
          .configureLogging(signalR.LogLevel.Warning)
          .build();

        connectionRef.current = connection;

        // Listen for notifications từ server
        connection.on('ReceiveNotification', (notification) => {
          console.log('Received notification from SignalR:', notification);
          // Thêm vào Redux store
          dispatch(addNotification(notification));
          // Tăng unread count
          dispatch(updateUnreadCount(unreadCount + 1));
        });

        // Handle connection events
        connection.onreconnecting(() => {
          console.log('SignalR: Reconnecting...');
          setSignalRConnected(false);
        });

        connection.onreconnected(() => {
          console.log('SignalR: Reconnected');
          setSignalRConnected(true);
        });

        connection.onclose(() => {
          console.log('SignalR: Connection closed');
          setSignalRConnected(false);
        });

        // Start connection
        try {
          await connection.start();
          console.log('SignalR: Connected');
          setSignalRConnected(true);
        } catch (err) {
          console.error('SignalR: Failed to connect:', err);
          setTimeout(() => {
            if (connectionRef.current) {
              connectionRef.current.start().catch(e => console.error('SignalR reconnect failed:', e));
            }
          }, 3000);
        }
      } catch (err) {
        console.error('Error setting up SignalR:', err);
      }
    };

    setupSignalR();

    return () => {
      if (connectionRef.current) {
        console.log('SignalR: Cleaning up connection...');
        connectionRef.current.off('ReceiveNotification');
        connectionRef.current.stop().catch(() => {});
        connectionRef.current = null;
        setSignalRConnected(false);
      }
    };
  }, [dispatch, unreadCount]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    hasMore,
    page,
    totalPages,
    totalItems,
    signalRConnected,
    fetchNotifications: fetchNotificationsAPI,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteReadNotifications: handleDeleteReadNotifications,
  };
};

export default useNotifications;
